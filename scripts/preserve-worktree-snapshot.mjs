#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = new Date();
const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const defaultOutput = path.resolve(ROOT, "..", ".sourcelens-audit", `p0-b-preservation-${timestamp}`);

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: options.encoding ?? null,
    maxBuffer: 1024 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitText(args, fallback = null) {
  try {
    return git(args, { encoding: "utf8" }).trim();
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function splitNul(buffer) {
  return buffer.toString("utf8").split("\0").filter(Boolean);
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function describePath(baseDir, relativePath) {
  const absolute = path.join(baseDir, relativePath);
  let stat;
  try {
    stat = fs.lstatSync(absolute);
  } catch (error) {
    if (error.code === "ENOENT") return { path: relativePath, type: "deleted" };
    throw error;
  }

  if (stat.isSymbolicLink()) {
    const target = fs.readlinkSync(absolute);
    return {
      path: relativePath,
      type: "symlink",
      mode: stat.mode & 0o7777,
      size: Buffer.byteLength(target),
      sha256: sha256Buffer(Buffer.from(target)),
      symlink_target: target,
    };
  }
  if (!stat.isFile()) {
    throw new Error(`Unsupported snapshot path type: ${relativePath}`);
  }
  return {
    path: relativePath,
    type: "file",
    mode: stat.mode & 0o7777,
    size: stat.size,
    sha256: sha256File(absolute),
  };
}

function assertInsideRoot(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  if (absolute !== ROOT && !absolute.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return absolute;
}

function copyUntracked(relativePath, destinationRoot) {
  const source = assertInsideRoot(relativePath);
  const destination = path.join(destinationRoot, relativePath);
  const stat = fs.lstatSync(source);
  fs.mkdirSync(path.dirname(destination), { recursive: true });

  if (stat.isSymbolicLink()) {
    const target = fs.readlinkSync(source);
    fs.symlinkSync(target, destination);
    return {
      path: relativePath,
      type: "symlink",
      mode: stat.mode & 0o7777,
      size: Buffer.byteLength(target),
      sha256: sha256Buffer(Buffer.from(target)),
      symlink_target: target,
    };
  }

  if (!stat.isFile()) {
    throw new Error(`Unsupported untracked path type: ${relativePath}`);
  }

  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(destination, stat.mode & 0o7777);
  const copied = fs.readFileSync(destination);
  const original = fs.readFileSync(source);
  if (sha256Buffer(copied) !== sha256Buffer(original)) {
    throw new Error(`Copied file hash mismatch: ${relativePath}`);
  }
  return {
    path: relativePath,
    type: "file",
    mode: stat.mode & 0o7777,
    size: stat.size,
    sha256: sha256Buffer(original),
  };
}

function assertDescriptorEqual(expected, actual, label, modeSemantics = "exact") {
  for (const field of ["path", "type", "size", "sha256", "symlink_target"]) {
    if ((expected[field] ?? null) !== (actual[field] ?? null)) {
      throw new Error(`${label} mismatch for ${expected.path}: ${field}`);
    }
  }
  if (modeSemantics === "exact" && expected.mode !== actual.mode) {
    throw new Error(`${label} mismatch for ${expected.path}: mode`);
  }
  if (modeSemantics === "git" && Boolean(expected.mode & 0o111) !== Boolean(actual.mode & 0o111)) {
    throw new Error(`${label} mismatch for ${expected.path}: executable bit`);
  }
}

function verifySnapshot(snapshotDir) {
  const absoluteSnapshot = path.resolve(snapshotDir);
  const manifest = JSON.parse(fs.readFileSync(path.join(absoluteSnapshot, "manifest.json"), "utf8"));

  for (const key of ["tracked_patch", "tracked_worktree_manifest", "status_porcelain_z", "untracked_paths_z", "untracked_manifest"]) {
    const artifact = manifest.artifacts[key];
    if (!artifact) throw new Error(`Missing snapshot artifact declaration: ${key}`);
    const artifactPath = path.join(absoluteSnapshot, artifact.path);
    if (sha256File(artifactPath) !== artifact.sha256) {
      throw new Error(`Snapshot artifact hash mismatch: ${artifact.path}`);
    }
  }

  const untracked = JSON.parse(fs.readFileSync(path.join(absoluteSnapshot, manifest.artifacts.untracked_manifest.path), "utf8"));
  for (const expected of untracked) {
    const actual = describePath(path.join(absoluteSnapshot, manifest.artifacts.untracked_copy_root), expected.path);
    assertDescriptorEqual(expected, actual, "untracked copy");
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sourcelens-snapshot-verify-"));
  const checkout = path.join(tempRoot, "checkout");
  try {
    execFileSync("git", ["clone", "--no-hardlinks", "--quiet", ROOT, checkout], { stdio: "pipe" });
    execFileSync("git", ["checkout", "--detach", "--quiet", manifest.head], { cwd: checkout, stdio: "pipe" });
    execFileSync("git", ["apply", "--binary", path.join(absoluteSnapshot, manifest.artifacts.tracked_patch.path)], {
      cwd: checkout,
      stdio: "pipe",
      maxBuffer: 1024 * 1024 * 1024,
    });
    const tracked = JSON.parse(fs.readFileSync(path.join(absoluteSnapshot, manifest.artifacts.tracked_worktree_manifest.path), "utf8"));
    for (const expected of tracked) {
      const actual = describePath(checkout, expected.path);
      assertDescriptorEqual(expected, actual, "restored tracked path", "git");
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const verification = {
    schema_version: 1,
    verified_at: new Date().toISOString(),
    verifier: "scripts/preserve-worktree-snapshot.mjs --verify",
    manifest_sha256: sha256File(path.join(absoluteSnapshot, "manifest.json")),
    head: manifest.head,
    tracked_changed_count: manifest.tracked_changed_count,
    untracked_file_count: manifest.untracked_file_count,
    artifact_hashes_valid: true,
    untracked_copy_hashes_valid: true,
    tracked_patch_disposable_restore_valid: true,
  };
  fs.writeFileSync(path.join(absoluteSnapshot, "verification.json"), `${JSON.stringify(verification, null, 2)}\n`, { mode: 0o600 });

  console.log(`WORKTREE_SNAPSHOT_VERIFY_OK ${absoluteSnapshot}`);
  console.log(`head=${manifest.head}`);
  console.log(`tracked_changed=${manifest.tracked_changed_count}`);
  console.log(`untracked=${manifest.untracked_file_count}`);
}

if (process.argv[2] === "--verify") {
  if (!process.argv[3]) throw new Error("Usage: preserve-worktree-snapshot.mjs --verify <snapshot-dir>");
  verifySnapshot(process.argv[3]);
  process.exit(0);
}

const outputDir = path.resolve(process.argv[2] ?? defaultOutput);

if (fs.existsSync(outputDir)) {
  throw new Error(`Snapshot output already exists: ${outputDir}`);
}
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

const trackedPatch = git(["diff", "--binary", "--full-index", "HEAD", "--"]);
const statusPorcelain = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
const trackedChanged = splitNul(git(["diff", "HEAD", "--name-only", "-z", "--"]));
const stagedChanged = splitNul(git(["diff", "--cached", "--name-only", "-z", "--"]));
const trackedFiles = splitNul(git(["ls-files", "-z"]));
const untrackedFiles = splitNul(git(["ls-files", "--others", "--exclude-standard", "-z"]));

const patchPath = path.join(outputDir, "tracked.patch");
const statusPath = path.join(outputDir, "status.porcelain-v1.z");
const untrackedListPath = path.join(outputDir, "untracked-paths.z");
const trackedManifestPath = path.join(outputDir, "tracked-worktree-manifest.json");
const untrackedRoot = path.join(outputDir, "untracked");

fs.writeFileSync(patchPath, trackedPatch, { mode: 0o600 });
fs.writeFileSync(statusPath, statusPorcelain, { mode: 0o600 });
fs.writeFileSync(untrackedListPath, Buffer.from(`${untrackedFiles.join("\0")}${untrackedFiles.length ? "\0" : ""}`), { mode: 0o600 });
const trackedManifest = trackedChanged.map((relativePath) => describePath(ROOT, relativePath));
fs.writeFileSync(trackedManifestPath, `${JSON.stringify(trackedManifest, null, 2)}\n`, { mode: 0o600 });
fs.mkdirSync(untrackedRoot, { recursive: true, mode: 0o700 });

const untrackedManifest = untrackedFiles.map((relativePath) => copyUntracked(relativePath, untrackedRoot));
const untrackedManifestPath = path.join(outputDir, "untracked-manifest.json");
fs.writeFileSync(untrackedManifestPath, `${JSON.stringify(untrackedManifest, null, 2)}\n`, { mode: 0o600 });

const manifest = {
  schema_version: 2,
  created_at: now.toISOString(),
  host: os.hostname(),
  repository_root: ROOT,
  snapshot_kind: "CURRENT_COMBINED_WORKTREE_AFTER_P0_CONTROL_PLANE_EDITS",
  reconstructs_exact_pre_aios_dirty_state: false,
  warning: "P0 control-plane edits began before this snapshot. This package preserves the current combined state, not the exact pre-AIOS dirty worktree.",
  head: gitText(["rev-parse", "HEAD"]),
  branch: gitText(["branch", "--show-current"], "DETACHED"),
  upstream: gitText(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], "NONE"),
  ahead_of_origin_main: Number(gitText(["rev-list", "--count", "origin/main..HEAD"], "0")),
  tracked_file_count: trackedFiles.length,
  tracked_changed_count: trackedChanged.length,
  untracked_file_count: untrackedFiles.length,
  staged_changed_count: stagedChanged.length,
  ignored_files_included: false,
  secret_policy: "Ignored files such as deploy/.env and runtime secrets are intentionally excluded.",
  artifacts: {
    tracked_patch: { path: "tracked.patch", sha256: sha256File(patchPath), bytes: fs.statSync(patchPath).size },
    tracked_worktree_manifest: { path: "tracked-worktree-manifest.json", sha256: sha256File(trackedManifestPath), bytes: fs.statSync(trackedManifestPath).size },
    status_porcelain_z: { path: "status.porcelain-v1.z", sha256: sha256File(statusPath), bytes: fs.statSync(statusPath).size },
    untracked_paths_z: { path: "untracked-paths.z", sha256: sha256File(untrackedListPath), bytes: fs.statSync(untrackedListPath).size },
    untracked_manifest: { path: "untracked-manifest.json", sha256: sha256File(untrackedManifestPath), bytes: fs.statSync(untrackedManifestPath).size },
    untracked_copy_root: "untracked/",
  },
  restore_outline: [
    "Create a disposable checkout at the recorded HEAD.",
    "Apply tracked.patch with git apply --binary.",
    "Copy the contents of untracked/ into the checkout without following preserved symlinks.",
    "Compare every restored untracked file or symlink against untracked-manifest.json.",
    "Do not restore ignored local secrets from this package; configure them separately.",
    "Run this script with --verify to test artifact hashes and patch reconstruction in a disposable clone.",
  ],
};

const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });

console.log(`WORKTREE_SNAPSHOT_OK ${outputDir}`);
console.log(`head=${manifest.head}`);
console.log(`tracked_changed=${manifest.tracked_changed_count}`);
console.log(`untracked=${manifest.untracked_file_count}`);
console.log(`staged=${manifest.staged_changed_count}`);
console.log(`tracked_patch_sha256=${manifest.artifacts.tracked_patch.sha256}`);
