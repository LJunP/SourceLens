#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "DEPENDENCY CHECK FAIL: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

assert_file() {
  local path="$1"
  [[ -f "$ROOT_DIR/$path" ]] || fail "$path must exist"
}

assert_match() {
  local description="$1"
  local pattern="$2"
  shift 2
  rg -n --hidden "$pattern" "$@" >/dev/null || fail "$description"
}

assert_no_match() {
  local description="$1"
  local pattern="$2"
  shift 2
  local output
  if output="$(rg -n --hidden "$pattern" "$@" 2>/dev/null)"; then
    echo "$output" >&2
    fail "$description"
  fi
}

assert_cargo_dependencies_are_registry_only() {
  local manifest="$ROOT_DIR/analyzer-rust/Cargo.toml"
  awk '
    /^\[dependencies\]$/ { in_deps = 1; next }
    /^\[/ { in_deps = 0 }
    in_deps && /^[[:space:]]*[A-Za-z0-9_.-]+[[:space:]]*=/ && /(^|[,{[:space:]])(git|path)[[:space:]]*=/ {
      print FILENAME ":" FNR ":" $0
      bad = 1
    }
    END { exit bad ? 1 : 0 }
  ' "$manifest" || fail "analyzer Rust dependencies must not use git/path sources"
}

assert_workflow_actions_are_pinned_to_sha() {
  local workflow_dir="$ROOT_DIR/.github/workflows"
  local workflow_files=()
  local workflow
  local output
  while IFS= read -r -d '' workflow; do
    workflow_files+=("$workflow")
  done < <(find "$workflow_dir" -type f \( -name '*.yml' -o -name '*.yaml' \) -print0)
  [[ ${#workflow_files[@]} -gt 0 ]] || fail "at least one GitHub Actions workflow must exist"
  if ! output="$(awk '
    function trim(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }
    function unquote(value) {
      if ((substr(value, 1, 1) == "\"" && substr(value, length(value), 1) == "\"") ||
          (substr(value, 1, 1) == "'\''" && substr(value, length(value), 1) == "'\''")) {
        return substr(value, 2, length(value) - 2)
      }
      return value
    }
    /^[[:space:]]*(-[[:space:]]*)?uses:[[:space:]]*/ {
      value = $0
      sub(/^[[:space:]]*(-[[:space:]]*)?uses:[[:space:]]*/, "", value)
      sub(/[[:space:]]+#.*$/, "", value)
      value = unquote(trim(value))
      if (value ~ /^\.\//) {
        next
      }
      if (value ~ /^docker:\/\//) {
        print FILENAME ":" FNR ":" value " uses a Docker image action; use a SHA-pinned GitHub Action or add a reviewed local action"
        bad = 1
        next
      }
      if (value !~ /@[0-9a-f]{40}$/) {
        print FILENAME ":" FNR ":" value
        bad = 1
      }
    }
    END { exit bad ? 1 : 0 }
  ' "${workflow_files[@]}")"; then
    echo "$output" >&2
    fail "GitHub Actions workflow uses entries must be pinned to 40-character commit SHAs"
  fi
}

assert_dockerfile_base_images_are_pinned_to_digest() {
  local dockerfiles=()
  local dockerfile
  local output
  while IFS= read -r -d '' dockerfile; do
    dockerfiles+=("$dockerfile")
  done < <(find "$ROOT_DIR" \
    \( -path "$ROOT_DIR/.git" -o -path "$ROOT_DIR/backend-spring/target" -o -path "$ROOT_DIR/web-console/node_modules" -o -path "$ROOT_DIR/web-console/dist" \) -prune \
    -o -type f \( -name 'Dockerfile' -o -name '*.Dockerfile' \) -print0)
  [[ ${#dockerfiles[@]} -gt 0 ]] || fail "at least one Dockerfile must exist"
  if ! output="$(awk '
    BEGIN {
      digest_pattern = "@sha256:[0-9a-f]{64}($|[[:space:]])"
    }
    /^[[:space:]]*FROM[[:space:]]+/ {
      image = $2
      if (image == "scratch") {
        next
      }
      if (image ~ /^\$/) {
        print FILENAME ":" FNR ":" image " uses a build argument instead of a pinned image"
        bad = 1
        next
      }
      if (image !~ digest_pattern) {
        print FILENAME ":" FNR ":" image
        bad = 1
      }
    }
    END { exit bad ? 1 : 0 }
  ' "${dockerfiles[@]}")"; then
    echo "$output" >&2
    fail "Dockerfile base images must be pinned to sha256 digests"
  fi
}

assert_compose_images_are_pinned_to_digest() {
  local compose_files=()
  local compose_file
  local output
  while IFS= read -r -d '' compose_file; do
    compose_files+=("$compose_file")
  done < <(find "$ROOT_DIR/deploy" -type f \( -name '*.yml' -o -name '*.yaml' \) -print0)
  [[ ${#compose_files[@]} -gt 0 ]] || fail "at least one deploy compose file must exist"
  if ! output="$(awk '
    /^[[:space:]]*image:[[:space:]]*/ {
      image = $0
      sub(/^[[:space:]]*image:[[:space:]]*/, "", image)
      sub(/[[:space:]]+#.*$/, "", image)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", image)
      gsub(/^["'\'']|["'\'']$/, "", image)
      if (image == "") {
        print FILENAME ":" FNR ":empty image"
        bad = 1
        next
      }
      if (image ~ /^\$/) {
        print FILENAME ":" FNR ":" image " uses a variable instead of a pinned image"
        bad = 1
        next
      }
      if (image !~ /@sha256:[0-9a-f]{64}$/) {
        print FILENAME ":" FNR ":" image
        bad = 1
      }
    }
    END { exit bad ? 1 : 0 }
  ' "${compose_files[@]}")"; then
    echo "$output" >&2
    fail "Docker Compose service images must be pinned to sha256 digests"
  fi
}

require_cmd rg
require_cmd awk
require_cmd find

cd "$ROOT_DIR"

assert_file "web-console/package-lock.json"
assert_file "analyzer-rust/Cargo.lock"
assert_file ".github/workflows/ci.yml"
assert_workflow_actions_are_pinned_to_sha
assert_dockerfile_base_images_are_pinned_to_digest
assert_compose_images_are_pinned_to_digest

assert_match \
  "frontend package lock must use npm lockfileVersion 3" \
  '"lockfileVersion":[[:space:]]*3' \
  web-console/package-lock.json

assert_no_match \
  "frontend package manifest must not use local file dependencies" \
  '"[^"]+"[[:space:]]*:[[:space:]]*"file:' \
  web-console/package.json

assert_no_match \
  "frontend package lock must not resolve local file dependencies" \
  '"resolved"[[:space:]]*:[[:space:]]*"file:' \
  web-console/package-lock.json

assert_no_match \
  "frontend package lock must not contain git dependencies" \
  '"resolved"[[:space:]]*:[[:space:]]*"git(\+|://)' \
  web-console/package-lock.json

assert_match \
  "verify-all must run frontend through npm run build" \
  'npm run build' \
  scripts/verify-all.sh

assert_match \
  "CI frontend install must use npm ci" \
  'npm ci' \
  .github/workflows/ci.yml

assert_cargo_dependencies_are_registry_only

assert_match \
  "verify-all must run cargo check with --locked" \
  'cargo check --locked' \
  scripts/verify-all.sh

assert_match \
  "verify-all must run cargo test with --locked" \
  'cargo test --locked' \
  scripts/verify-all.sh

assert_match \
  "CI analyzer check must use --locked" \
  'cargo check --locked' \
  .github/workflows/ci.yml

assert_match \
  "CI analyzer tests must use --locked" \
  'cargo test --locked' \
  .github/workflows/ci.yml

assert_no_match \
  "Maven dependencies must not use system scope" \
  '<scope>[[:space:]]*system[[:space:]]*</scope>' \
  backend-spring/pom.xml

assert_no_match \
  "Maven dependencies must not use systemPath" \
  '<systemPath>' \
  backend-spring/pom.xml

assert_no_match \
  "Maven dependencies must not use floating LATEST versions" \
  '<version>[[:space:]]*LATEST[[:space:]]*</version>' \
  backend-spring/pom.xml

assert_no_match \
  "Maven dependencies must not use floating RELEASE versions" \
  '<version>[[:space:]]*RELEASE[[:space:]]*</version>' \
  backend-spring/pom.xml

echo "Dependency regression checks passed."
