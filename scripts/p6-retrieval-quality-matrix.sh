#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BASE_URL="${SOURCELENS_BASE_URL:-http://localhost:8080}"
TIMEOUT_SECONDS="${SOURCELENS_P6_RETRIEVAL_MATRIX_TIMEOUT_SECONDS:-900}"
PER_REPO_MAX_SECONDS="${SOURCELENS_P6_RETRIEVAL_MATRIX_PER_REPO_MAX_SECONDS:-240}"
TOTAL_MAX_SECONDS="${SOURCELENS_P6_RETRIEVAL_MATRIX_TOTAL_MAX_SECONDS:-600}"
PRESET="${SOURCELENS_P6_RETRIEVAL_MATRIX_PRESET:-standard}"
STANDARD_CASES="default-java|https://github.com/LJunP/Pawnshop-Management-System.git|main|default-strong
spring-petclinic|https://github.com/spring-projects/spring-petclinic.git|main|generic-java
apache-commons-cli|https://github.com/apache/commons-cli.git|master|generic-java-library
express|https://github.com/expressjs/express.git|master|generic-js-ts-web
axios|https://github.com/axios/axios.git|main|generic-js-ts-library"
EXTENDED_CASES="${STANDARD_CASES}
koa|https://github.com/koajs/koa.git|master|generic-js-ts-web-koa
flask|https://github.com/pallets/flask.git|main|generic-python-web
commander|https://github.com/tj/commander.js.git|master|generic-js-ts-cli-library"

if [[ -n "${SOURCELENS_P6_RETRIEVAL_MATRIX_CASES:-}" ]]; then
  CASES="$SOURCELENS_P6_RETRIEVAL_MATRIX_CASES"
  DEFAULT_MIN_REPOS=5
elif [[ "$PRESET" == "standard" ]]; then
  CASES="$STANDARD_CASES"
  DEFAULT_MIN_REPOS=5
elif [[ "$PRESET" == "extended" ]]; then
  CASES="$EXTENDED_CASES"
  DEFAULT_MIN_REPOS=8
else
  echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: SOURCELENS_P6_RETRIEVAL_MATRIX_PRESET must be standard or extended" >&2
  exit 1
fi
MIN_REPOS="${SOURCELENS_P6_RETRIEVAL_MATRIX_MIN_REPOS:-$DEFAULT_MIN_REPOS}"

if ! [[ "$MIN_REPOS" =~ ^[0-9]+$ ]] || [[ "$MIN_REPOS" -le 0 ]]; then
  echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: SOURCELENS_P6_RETRIEVAL_MATRIX_MIN_REPOS must be a positive integer" >&2
  exit 1
fi
if ! [[ "$PER_REPO_MAX_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: SOURCELENS_P6_RETRIEVAL_MATRIX_PER_REPO_MAX_SECONDS must be a non-negative integer" >&2
  exit 1
fi
if ! [[ "$TOTAL_MAX_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: SOURCELENS_P6_RETRIEVAL_MATRIX_TOTAL_MAX_SECONDS must be a non-negative integer" >&2
  exit 1
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-p6-retrieval-matrix.XXXXXX")"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

summary_jsonl="$tmp_dir/summary.jsonl"
case_count=0

while IFS= read -r case_line; do
  [[ -z "${case_line// }" ]] && continue
  IFS='|' read -r case_id repo_url branch profile extra <<<"$case_line"
  if [[ -z "${case_id:-}" || -z "${repo_url:-}" || -z "${branch:-}" || -z "${profile:-}" || -n "${extra:-}" ]]; then
    echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: invalid case format: $case_line" >&2
    exit 1
  fi

  case_count=$((case_count + 1))
  log_file="$tmp_dir/${case_count}-${case_id}.log"
  start_seconds=$SECONDS
  echo "[${case_count}] ${case_id}: ${repo_url}@${branch} (${profile})"

  weak_keyword_mode="auto"
  weak_keyword_mock="false"
  semantic_probe_mode="auto"
  report_evidence_qa_mode="auto"
  claim_noise_mode="auto"
  role_probes="controller,service,dataAccess"
  source_role_query="controller service repository"
  code_qa_question="Controller Service Repository 业务流程"
  cross_file_proof_query=""
  cross_file_min_source_files="0"
  cross_file_min_main_source_files="0"
  language_family="mixed"
  profile_category="app"
  role_probe_policy="required"
  java_ast_required="false"
  cross_file_source_root_policy="disabled"
  if [[ "$profile" == "default-strong" ]]; then
    weak_keyword_mode="true"
    weak_keyword_mock="true"
    semantic_probe_mode="true"
    report_evidence_qa_mode="true"
    claim_noise_mode="true"
    language_family="mixed"
    profile_category="app"
    role_probe_policy="required"
  elif [[ "$profile" == "generic-java" ]]; then
    role_probes="controller,dataAccess"
    language_family="java"
    profile_category="web-app"
    role_probe_policy="profile-specific"
    java_ast_required="true"
  elif [[ "$profile" == "generic-java-library" ]]; then
    weak_keyword_mode="false"
    semantic_probe_mode="false"
    report_evidence_qa_mode="false"
    claim_noise_mode="false"
    role_probes=""
    source_role_query="src/main/java/org/apache/commons/cli/DefaultParser.java parse command line options"
    code_qa_question="DefaultParser parse command line options flow"
    cross_file_proof_query="src/main/java org.apache.commons.cli option parser commandline"
    cross_file_min_source_files="2"
    cross_file_min_main_source_files="2"
    language_family="java"
    profile_category="library"
    role_probe_policy="disabled"
    java_ast_required="true"
    cross_file_source_root_policy="src-main"
  elif [[ "$profile" == "generic-js-ts-web" ]]; then
    weak_keyword_mode="false"
    semantic_probe_mode="false"
    report_evidence_qa_mode="false"
    claim_noise_mode="false"
    role_probes=""
    source_role_query="lib/application.js router middleware route express application"
    code_qa_question="Express application router middleware flow"
    cross_file_proof_query="lib router middleware route express application"
    cross_file_min_source_files="2"
    language_family="js-ts"
    profile_category="web-framework"
    role_probe_policy="disabled"
    java_ast_required="false"
    cross_file_source_root_policy="any-source"
  elif [[ "$profile" == "generic-js-ts-library" ]]; then
    weak_keyword_mode="false"
    semantic_probe_mode="false"
    report_evidence_qa_mode="false"
    claim_noise_mode="false"
    role_probes=""
    source_role_query="lib/axios.js request interceptors dispatchRequest adapter"
    code_qa_question="Axios request interceptors dispatch adapter flow"
    cross_file_proof_query="lib axios request interceptors dispatchRequest adapter"
    cross_file_min_source_files="2"
    language_family="js-ts"
    profile_category="library"
    role_probe_policy="disabled"
    java_ast_required="false"
    cross_file_source_root_policy="any-source"
  elif [[ "$profile" == "generic-js-ts-web-koa" ]]; then
    weak_keyword_mode="false"
    semantic_probe_mode="false"
    report_evidence_qa_mode="false"
    claim_noise_mode="false"
    role_probes=""
    source_role_query="lib/application.js middleware context request response koa app"
    code_qa_question="Koa application middleware context request response flow"
    cross_file_proof_query="lib application context request response middleware koa"
    cross_file_min_source_files="2"
    language_family="js-ts"
    profile_category="web-framework"
    role_probe_policy="disabled"
    java_ast_required="false"
    cross_file_source_root_policy="any-source"
  elif [[ "$profile" == "generic-python-web" ]]; then
    weak_keyword_mode="false"
    semantic_probe_mode="false"
    report_evidence_qa_mode="false"
    claim_noise_mode="false"
    role_probes=""
    source_role_query="src/flask/app.py route request response blueprint dispatch"
    code_qa_question="Flask app route request response blueprint dispatch flow"
    cross_file_proof_query="src flask app route request response blueprint dispatch"
    cross_file_min_source_files="2"
    language_family="python"
    profile_category="web-framework"
    role_probe_policy="disabled"
    java_ast_required="false"
    cross_file_source_root_policy="any-source"
  elif [[ "$profile" == "generic-js-ts-cli-library" ]]; then
    weak_keyword_mode="false"
    semantic_probe_mode="false"
    report_evidence_qa_mode="false"
    claim_noise_mode="false"
    role_probes=""
    source_role_query="lib/command.js lib/option.js command option parser action help"
    code_qa_question="Commander command option parser action help flow"
    cross_file_proof_query="lib command option parser action help commander"
    cross_file_min_source_files="2"
    language_family="js-ts"
    profile_category="cli-library"
    role_probe_policy="disabled"
    java_ast_required="false"
    cross_file_source_root_policy="any-source"
  else
    echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: ${case_id}: unknown profile: ${profile}" >&2
    exit 1
  fi

  (
    cd "$ROOT_DIR"
    SOURCELENS_BASE_URL="$BASE_URL" \
      SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL="$repo_url" \
      SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH="$branch" \
      SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS="$TIMEOUT_SECONDS" \
      SOURCELENS_PUBLIC_REPO_SMOKE_UI=false \
      SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=true \
      SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=auto \
      SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=auto \
      SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL="$weak_keyword_mode" \
      SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK="$weak_keyword_mock" \
      SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE="$semantic_probe_mode" \
      SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION="$report_evidence_qa_mode" \
      SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE="$claim_noise_mode" \
      SOURCELENS_PUBLIC_REPO_SMOKE_REQUIRED_ROLE_PROBES="$role_probes" \
      SOURCELENS_PUBLIC_REPO_SMOKE_SOURCE_ROLE_QUERY="$source_role_query" \
      SOURCELENS_PUBLIC_REPO_SMOKE_CODE_QA_QUESTION="$code_qa_question" \
      SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_PROOF_QUERY="$cross_file_proof_query" \
      SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_SOURCE_FILES="$cross_file_min_source_files" \
      SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_MAIN_SOURCE_FILES="$cross_file_min_main_source_files" \
      ./scripts/public-repo-analysis-smoke.sh
  ) | tee "$log_file"

  duration_seconds=$((SECONDS - start_seconds))
  if [[ "$PER_REPO_MAX_SECONDS" -gt 0 && "$duration_seconds" -gt "$PER_REPO_MAX_SECONDS" ]]; then
    echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: ${case_id}: duration ${duration_seconds}s exceeded per-repo budget ${PER_REPO_MAX_SECONDS}s" >&2
    exit 1
  fi
  node - "$log_file" "$case_id" "$repo_url" "$branch" "$profile" "$duration_seconds" "$language_family" "$profile_category" "$role_probe_policy" "$java_ast_required" "$cross_file_source_root_policy" >>"$summary_jsonl" <<'NODE'
const fs = require("fs");
const [logFile, caseId, repoUrl, branch, profile, durationRaw, languageFamily, profileCategory, roleProbePolicy, javaAstRequiredRaw, crossFileSourceRootPolicy] = process.argv.slice(2);
const javaAstRequired = javaAstRequiredRaw === "true";
const text = fs.readFileSync(logFile, "utf8");
const matches = text.split(/\r?\n/).filter((line) => line.startsWith("PUBLIC_REPO_SMOKE_OK "));
function fail(message) {
  console.error(`P6_RETRIEVAL_QUALITY_MATRIX_FAIL: ${caseId}: ${message}`);
  process.exit(1);
}
if (matches.length !== 1) {
  fail(`expected exactly one PUBLIC_REPO_SMOKE_OK marker, got ${matches.length}`);
}
let payload;
try {
  payload = JSON.parse(matches[0].slice("PUBLIC_REPO_SMOKE_OK ".length));
} catch (error) {
  fail(`PUBLIC_REPO_SMOKE_OK marker is invalid JSON: ${error.message}`);
}
function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    fail(`${label} must be a positive integer`);
  }
}
function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value;
}
positiveInteger(payload.projectId, "projectId");
positiveInteger(payload.repositoryId, "repositoryId");
positiveInteger(payload.scanTaskId, "scanTaskId");
const rawScan = object(payload.rawScanContract, "rawScanContract");
positiveInteger(rawScan.symbols, "rawScanContract.symbols");
positiveInteger(rawScan.graphNodes, "rawScanContract.graphNodes");
positiveInteger(rawScan.totalFiles, "rawScanContract.totalFiles");
let javaAstDiagnostics = null;
if (rawScan.javaAstDiagnostics !== undefined && rawScan.javaAstDiagnostics !== null) {
  javaAstDiagnostics = object(rawScan.javaAstDiagnostics, "rawScanContract.javaAstDiagnostics");
  for (const field of ["totalJavaFiles", "parsedJavaFiles", "failedJavaFiles"]) {
    if (!Number.isInteger(javaAstDiagnostics[field]) || javaAstDiagnostics[field] < 0) {
      fail(`rawScanContract.javaAstDiagnostics.${field} must be a non-negative integer`);
    }
  }
  if (!Array.isArray(javaAstDiagnostics.failedFilePaths)) {
    fail("rawScanContract.javaAstDiagnostics.failedFilePaths must be an array");
  }
  if (!["OK", "PARTIAL"].includes(javaAstDiagnostics.status)) {
    fail(`rawScanContract.javaAstDiagnostics.status must be OK/PARTIAL, got ${javaAstDiagnostics.status}`);
  }
  if (javaAstDiagnostics.parsedJavaFiles + javaAstDiagnostics.failedJavaFiles !== javaAstDiagnostics.totalJavaFiles) {
    fail("rawScanContract.javaAstDiagnostics parsed+failed count must equal total");
  }
  if (javaAstDiagnostics.failedFilePaths.length !== javaAstDiagnostics.failedJavaFiles) {
    fail("rawScanContract.javaAstDiagnostics failedFilePaths length must equal failedJavaFiles");
  }
  if (javaAstDiagnostics.status !== "OK" || javaAstDiagnostics.failedJavaFiles !== 0) {
    fail(`rawScanContract.javaAstDiagnostics must be OK with zero failures, got status=${javaAstDiagnostics.status}, failed=${javaAstDiagnostics.failedJavaFiles}`);
  }
}
if (javaAstRequired) {
  object(javaAstDiagnostics, "rawScanContract.javaAstDiagnostics");
  positiveInteger(javaAstDiagnostics.totalJavaFiles, "rawScanContract.javaAstDiagnostics.totalJavaFiles");
}
const codeQa = object(payload.codeQa, "codeQa");
positiveInteger(codeQa.resultCount, "codeQa.resultCount");
if (codeQa.rawRetrievedChunkContentAbsent !== true) {
  fail("codeQa.rawRetrievedChunkContentAbsent must be true");
}
const retrievalPlan = object(codeQa.retrievalPlan, "codeQa.retrievalPlan");
if (typeof retrievalPlan.queryStrategy !== "string" || !retrievalPlan.queryStrategy.trim()) {
  fail("codeQa.retrievalPlan.queryStrategy is required");
}
if (!["NOT_APPLICABLE", "DISABLED", "UNAVAILABLE", "DEGRADED", "READY"].includes(retrievalPlan.semanticReadinessStatus)) {
  fail(`invalid semanticReadinessStatus: ${retrievalPlan.semanticReadinessStatus}`);
}
const citationCoverage = object(codeQa.citationCoverage, "codeQa.citationCoverage");
if (!["FULL", "REQUIRED_FULL"].includes(citationCoverage.status)) {
  fail(`codeQa.citationCoverage.status must be FULL or REQUIRED_FULL, got ${citationCoverage.status}`);
}
const claimCitationCoverage = object(codeQa.claimCitationCoverage, "codeQa.claimCitationCoverage");
if (claimCitationCoverage.status !== "READY") {
  fail(`codeQa.claimCitationCoverage.status must be READY, got ${claimCitationCoverage.status}`);
}
const crossFileCitationSummary = object(codeQa.crossFileCitationSummary, "codeQa.crossFileCitationSummary");
if (crossFileCitationSummary.visible !== true) {
  fail("codeQa.crossFileCitationSummary.visible must be true");
}
if (crossFileCitationSummary.currentScanOnly !== true) {
  fail("codeQa.crossFileCitationSummary.currentScanOnly must be true");
}
if (crossFileCitationSummary.citationBindingSatisfied !== true) {
  fail("codeQa.crossFileCitationSummary.citationBindingSatisfied must be true");
}
if (crossFileCitationSummary.claimBindingSatisfied !== true) {
  fail("codeQa.crossFileCitationSummary.claimBindingSatisfied must be true");
}
const weakKeyword = payload.projectQaWeakKeywordEvaluation;
const chunkSearch = object(payload.chunkSearch, "chunkSearch");
const crossFileProof = object(chunkSearch.crossFileRetrievalProof, "chunkSearch.crossFileRetrievalProof");
if (!Number.isInteger(crossFileProof.uniqueFiles) || crossFileProof.uniqueFiles < 2) {
  fail("chunkSearch.crossFileRetrievalProof.uniqueFiles must be at least 2");
}
if (!Number.isInteger(crossFileProof.sourceUniqueFiles) || crossFileProof.sourceUniqueFiles < 1) {
  fail("chunkSearch.crossFileRetrievalProof.sourceUniqueFiles must be at least 1");
}
if (languageFamily === "js-ts" && crossFileProof.sourceUniqueFiles < 2) {
  fail(`js-ts profile must expose at least two source files in cross-file proof, got ${crossFileProof.sourceUniqueFiles}`);
}
if (profile === "default-strong") {
  object(weakKeyword, "projectQaWeakKeywordEvaluation");
  if (weakKeyword.status !== "OK") {
    fail(`default-strong weak keyword evaluation must be OK, got ${weakKeyword.status}`);
  }
  const semanticProbe = object(payload.semanticWeakKeywordProbe, "semanticWeakKeywordProbe");
  if (semanticProbe.status !== "OK") {
    fail(`default-strong semanticWeakKeywordProbe must be OK, got ${semanticProbe.status}`);
  }
  const reportEvidence = object(payload.reportEvidenceQaCitationQuality, "reportEvidenceQaCitationQuality");
  if (reportEvidence.status !== "OK") {
    fail(`default-strong reportEvidenceQaCitationQuality must be OK, got ${reportEvidence.status}`);
  }
} else if (weakKeyword && !["OK", "INCONCLUSIVE", "SKIPPED", "DISABLED"].includes(weakKeyword.status)) {
  fail(`generic weak keyword evaluation status is invalid: ${weakKeyword.status}`);
}
console.log(JSON.stringify({
  caseId,
  repoUrl,
  branch,
  profile,
  languageFamily,
  profileCategory,
  roleProbePolicy,
  javaAstRequired,
  crossFileSourceRootPolicy,
  durationSeconds: Number(durationRaw),
  projectId: payload.projectId,
  repositoryId: payload.repositoryId,
  scanTaskId: payload.scanTaskId,
  rawScanContract: {
    language: rawScan.language,
    symbols: rawScan.symbols,
    graphNodes: rawScan.graphNodes,
    totalFiles: rawScan.totalFiles,
    apiRoutes: rawScan.apiRoutes,
    entities: rawScan.entities,
    javaAstDiagnostics: javaAstDiagnostics ? {
      status: javaAstDiagnostics.status,
      totalJavaFiles: javaAstDiagnostics.totalJavaFiles,
      parsedJavaFiles: javaAstDiagnostics.parsedJavaFiles,
      failedJavaFiles: javaAstDiagnostics.failedJavaFiles
    } : null
  },
  codeQa: {
    retrievalMode: codeQa.retrievalMode,
    resultCount: codeQa.resultCount,
    rawRetrievedChunkContentAbsent: codeQa.rawRetrievedChunkContentAbsent,
    citationCoverageStatus: citationCoverage.status,
    claimCitationCoverageStatus: claimCitationCoverage.status,
    crossFileCitationCurrentScanOnly: crossFileCitationSummary.currentScanOnly,
    citationBindingSatisfied: crossFileCitationSummary.citationBindingSatisfied,
    claimBindingSatisfied: crossFileCitationSummary.claimBindingSatisfied,
    queryStrategy: retrievalPlan.queryStrategy,
    semanticReadinessStatus: retrievalPlan.semanticReadinessStatus,
    semanticReadinessReason: retrievalPlan.semanticReadinessReason,
    crossFilePrimaryFileCount: retrievalPlan.crossFilePrimaryFileCount,
    crossFileEvidenceStatus: retrievalPlan.crossFileEvidenceStatus,
    graphRelationEvidencePresent: retrievalPlan.graphRelationEvidencePresent
  },
  chunkSearch: {
    crossFileRetrievalProof: {
      uniqueFiles: crossFileProof.uniqueFiles,
      sourceUniqueFiles: crossFileProof.sourceUniqueFiles,
      mainSourceUniqueFiles: crossFileProof.mainSourceUniqueFiles,
      minSourceFiles: crossFileProof.minSourceFiles,
      minMainSourceFiles: crossFileProof.minMainSourceFiles,
      retrievalMode: crossFileProof.retrievalMode,
      readiness: crossFileProof.readiness
    }
  },
  methodAnchorRetrieval: {
    status: payload.methodAnchorRetrieval ? payload.methodAnchorRetrieval.status : null
  },
  projectQaWeakKeywordEvaluation: weakKeyword ? {
    status: weakKeyword.status,
    reason: weakKeyword.reason || null
  } : null
}));
NODE
done <<<"$CASES"

if [[ "$case_count" -lt "$MIN_REPOS" ]]; then
  echo "P6_RETRIEVAL_QUALITY_MATRIX_FAIL: only $case_count case(s), expected at least $MIN_REPOS" >&2
  exit 1
fi

node - "$summary_jsonl" "$MIN_REPOS" "$PER_REPO_MAX_SECONDS" "$TOTAL_MAX_SECONDS" "$PRESET" <<'NODE'
const fs = require("fs");
const [summaryFile, minReposRaw, perRepoMaxRaw, totalMaxRaw, preset] = process.argv.slice(2);
const lines = fs.readFileSync(summaryFile, "utf8").split(/\r?\n/).filter(Boolean);
const repos = lines.map((line) => JSON.parse(line));
const minRepos = Number(minReposRaw);
const perRepoMaxSeconds = Number(perRepoMaxRaw);
const totalMaxSeconds = Number(totalMaxRaw);
function fail(message) {
  console.error(`P6_RETRIEVAL_QUALITY_MATRIX_FAIL: ${message}`);
  process.exit(1);
}
if (repos.length < minRepos) {
  fail(`expected at least ${minRepos} repositories, got ${repos.length}`);
}
const uniqueRepoUrls = new Set(repos.map((repo) => repo.repoUrl.toLowerCase()));
if (uniqueRepoUrls.size < minRepos) {
  fail(`expected at least ${minRepos} unique repository URLs, got ${uniqueRepoUrls.size}`);
}
const defaultStrongCount = repos.filter((repo) => repo.profile === "default-strong").length;
if (defaultStrongCount < 1) {
  fail("at least one default-strong repository is required");
}
const jsTsLibraryCount = repos.filter((repo) => repo.profile === "generic-js-ts-library").length;
if (jsTsLibraryCount < 1) {
  fail("at least one generic-js-ts-library repository is required");
}
const jsTsWebCount = repos.filter((repo) => repo.profile === "generic-js-ts-web").length;
if (jsTsWebCount < 1) {
  fail("at least one generic-js-ts-web repository is required");
}
const nonJavaProfiles = repos.filter((repo) => repo.languageFamily === "js-ts" && repo.javaAstRequired === false);
if (nonJavaProfiles.length < 2) {
  fail(`expected at least two js-ts non-Java profiles, got ${nonJavaProfiles.length}`);
}
const pythonProfileCount = repos.filter((repo) => repo.languageFamily === "python").length;
const cliLibraryCount = repos.filter((repo) => repo.profileCategory === "cli-library").length;
if (preset === "extended" && pythonProfileCount < 1) {
  fail("extended preset requires at least one python profile");
}
if (preset === "extended" && cliLibraryCount < 1) {
  fail("extended preset requires at least one cli-library profile");
}
const javaAstDiagnosticsRepos = repos.filter(
  (repo) => repo.rawScanContract
    && repo.rawScanContract.javaAstDiagnostics
    && repo.rawScanContract.javaAstDiagnostics.status === "OK"
    && repo.rawScanContract.javaAstDiagnostics.failedJavaFiles === 0
    && repo.rawScanContract.javaAstDiagnostics.totalJavaFiles > 0
);
if (javaAstDiagnosticsRepos.length < 1) {
  fail("at least one Java repository with OK javaAstDiagnostics is required");
}
for (const repo of repos) {
  if (!Number.isInteger(repo.durationSeconds) || repo.durationSeconds <= 0) {
    fail(`${repo.caseId} durationSeconds must be a positive integer`);
  }
  if (perRepoMaxSeconds > 0 && repo.durationSeconds > perRepoMaxSeconds) {
    fail(`${repo.caseId} duration ${repo.durationSeconds}s exceeded per-repo budget ${perRepoMaxSeconds}s`);
  }
}
const totalDurationSeconds = repos.reduce((sum, repo) => sum + repo.durationSeconds, 0);
const maxCaseDurationSeconds = repos.reduce((max, repo) => Math.max(max, repo.durationSeconds), 0);
if (totalMaxSeconds > 0 && totalDurationSeconds > totalMaxSeconds) {
  fail(`total duration ${totalDurationSeconds}s exceeded total budget ${totalMaxSeconds}s`);
}
const profileCounts = repos.reduce((accumulator, repo) => {
  accumulator[repo.profile] = (accumulator[repo.profile] || 0) + 1;
  return accumulator;
}, {});
const languageFamilyCounts = repos.reduce((accumulator, repo) => {
  accumulator[repo.languageFamily] = (accumulator[repo.languageFamily] || 0) + 1;
  return accumulator;
}, {});
const marker = {
  status: "OK",
  marker: "P6_RETRIEVAL_QUALITY_MATRIX_OK",
  preset,
  evaluationScope: "bounded_public_repo_quality_matrix",
  benchmarkClaim: false,
  providerQualityClaim: false,
  repoCount: repos.length,
  javaAstDiagnosticsRepoCount: javaAstDiagnosticsRepos.length,
  totalDurationSeconds,
  maxCaseDurationSeconds,
  performanceBudget: {
    status: "OK",
    perRepoMaxSeconds,
    totalMaxSeconds
  },
  profileCounts,
  languageFamilyCounts,
  jsTsNonJavaProfileCount: nonJavaProfiles.length,
  pythonProfileCount,
  cliLibraryCount,
  minRepos,
  repos
};
console.log("P6_RETRIEVAL_QUALITY_MATRIX_OK " + JSON.stringify(marker));
NODE
