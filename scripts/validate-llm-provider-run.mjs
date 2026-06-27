#!/usr/bin/env node
import fs from "node:fs";

const args = process.argv.slice(2);
const positionalArgs = [];
let allowTemplate = false;
let expectedReleaseRunId = "";
let printArtifacts = false;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--allow-template") {
    allowTemplate = true;
    continue;
  }
  if (arg === "--print-artifacts") {
    printArtifacts = true;
    continue;
  }
  if (arg === "--run-id") {
    if (!args[index + 1] || args[index + 1].startsWith("--")) {
      fail("--run-id requires a non-empty release evidence run id");
    }
    expectedReleaseRunId = args[index + 1] ?? "";
    index += 1;
    continue;
  }
  if (arg.startsWith("--")) {
    fail(`unknown option: ${arg}`);
  }
  positionalArgs.push(arg);
}
if (positionalArgs.length !== 3) {
  fail("usage: validate-llm-provider-run.mjs <provider-run> <prompt-cases> <output-cases> [--allow-template] [--run-id <release-run-id>] [--print-artifacts]");
}
const [runFile, promptCasesFile, outputCasesFile] = positionalArgs;
const artifactPathPrefix = "release-evidence/";
const artifactDirectorySegment = "llm-evals";
const safeArtifactPathSegmentPattern = /^[A-Za-z0-9._-]+$/;
const templateRunIdSegment = "<run-id>";

function fail(message) {
  console.error(`LLM PROVIDER RUN FAIL: ${message}`);
  process.exit(1);
}

function readJson(file, label) {
  if (!file) {
    fail(`${label} path is required`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`could not parse ${file}: ${error.message}`);
  }
}

function assertString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${field} must be a non-empty string`);
  }
}

function assertSafeRunId(value, field) {
  assertString(value, field);
  if (value === "." || value === ".." || !safeArtifactPathSegmentPattern.test(value)) {
    fail(`${field} must use safe artifact path segments`);
  }
}

function assertNoSecretKeys(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      assertNoSecretValue(value, path);
    }
    return;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    if (/api[_-]?key|access[_-]?token|secret|password|private[_-]?key/i.test(key)) {
      fail(`${path}.${key} must not be stored in provider eval run files`);
    }
    assertNoSecretKeys(nestedValue, `${path}.${key}`);
  }
}

function assertNoSecretValue(value, path) {
  const suspiciousPatterns = [
    /(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /Bearer\s+[A-Za-z0-9._-]{20,}/i,
  ];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(value)) {
      fail(`${path} looks like it contains a secret`);
    }
  }
}

function collectCaseDefinitions(promptCases, outputCases) {
  if (!Array.isArray(promptCases) || !Array.isArray(outputCases)) {
    fail("case definition files must be JSON arrays");
  }
  const definitions = new Map();
  for (const testCase of promptCases) {
    definitions.set(testCase.id, {
      entrypoint: testCase.entrypoint,
      caseType: "prompt_injection",
    });
  }
  for (const testCase of outputCases) {
    definitions.set(testCase.id, {
      entrypoint: testCase.entrypoint,
      caseType: "output_quality",
    });
  }
  return definitions;
}

function assertRelativeArtifactPath(value, caseId) {
  const field = `case ${caseId} rawOutputArtifact`;
  assertString(value, field);
  if (value.startsWith("/") || value.includes("\\") || /[\x00-\x1F\x7F]/.test(value)) {
    fail(`${field} must be a safe relative artifact path`);
  }
  if (!value.startsWith(artifactPathPrefix)) {
    fail(`${field} must point under release-evidence/`);
  }
  const segments = value.split("/");
  if (segments.length < 4) {
    fail(`${field} must point under release-evidence/<run-id>/${artifactDirectorySegment}/`);
  }
  if (segments[0] !== "release-evidence") {
    fail(`${field} must point under release-evidence/`);
  }
  if (segments[2] !== artifactDirectorySegment) {
    fail(`${field} must point under release-evidence/<run-id>/${artifactDirectorySegment}/`);
  }
  if (!allowTemplate && expectedReleaseRunId && segments[1] !== expectedReleaseRunId) {
    fail(`${field} must point under release-evidence/${expectedReleaseRunId}/`);
  }
  for (const segment of segments) {
    if (segment === "") {
      fail(`${field} must not contain empty path segments`);
    }
    if (segment === "." || segment === "..") {
      fail(`${field} must not contain dot path segments`);
    }
    if (allowTemplate && segment === templateRunIdSegment) {
      continue;
    }
    if (!safeArtifactPathSegmentPattern.test(segment)) {
      fail(`${field} must use safe artifact path segments`);
    }
  }
}

function validateRun(run, definitions) {
  for (const field of ["runId", "runAt", "provider", "model", "promptVersion", "operator"]) {
    assertString(run[field], field);
  }
  if (expectedReleaseRunId) {
    assertSafeRunId(expectedReleaseRunId, "expected release run id");
  }
  if (Number.isNaN(Date.parse(run.runAt))) {
    fail("runAt must be an ISO-like timestamp");
  }
  if (!Array.isArray(run.sourceCases) || !run.sourceCases.includes("prompt-injection-cases.json")
      || !run.sourceCases.includes("output-quality-cases.json")) {
    fail("sourceCases must reference both prompt and output eval files");
  }
  if (!run.environment || typeof run.environment !== "object" || Array.isArray(run.environment)) {
    fail("environment must be an object");
  }
  assertString(run.environment.baseUrlHost, "environment.baseUrlHost");
  if (typeof run.environment.temperature !== "number" || run.environment.temperature < 0) {
    fail("environment.temperature must be a non-negative number");
  }
  assertString(run.environment.toolMode, "environment.toolMode");
  if (!Array.isArray(run.cases)) {
    fail("cases must be an array");
  }
  if (run.cases.length !== definitions.size) {
    fail(`cases must cover all ${definitions.size} eval cases`);
  }

  const seen = new Set();
  const artifactPaths = new Set();
  for (const [index, result] of run.cases.entries()) {
    assertString(result.caseId, `cases[${index}].caseId`);
    if (seen.has(result.caseId)) {
      fail(`duplicate provider eval result for ${result.caseId}`);
    }
    seen.add(result.caseId);
    const expected = definitions.get(result.caseId);
    if (!expected) {
      fail(`unknown provider eval case id: ${result.caseId}`);
    }
    if (result.entrypoint !== expected.entrypoint) {
      fail(`case ${result.caseId} entrypoint must be ${expected.entrypoint}`);
    }
    if (result.caseType !== expected.caseType) {
      fail(`case ${result.caseId} caseType must be ${expected.caseType}`);
    }
    const allowedVerdicts = allowTemplate ? ["pass", "fail", "manual_review"] : ["pass", "fail"];
    if (!allowedVerdicts.includes(result.verdict)) {
      fail(`case ${result.caseId} verdict must be ${allowedVerdicts.join(" or ")}`);
    }
    if (!Array.isArray(result.assertions) || result.assertions.length === 0) {
      fail(`case ${result.caseId} must include assertion results`);
    }
    for (const [assertionIndex, assertion] of result.assertions.entries()) {
      assertString(assertion.name, `case ${result.caseId} assertions[${assertionIndex}].name`);
      if (allowTemplate) {
        if (assertion.passed !== null && typeof assertion.passed !== "boolean") {
          fail(`case ${result.caseId} assertion ${assertion.name} passed must be boolean or null`);
        }
      } else if (typeof assertion.passed !== "boolean") {
        fail(`case ${result.caseId} assertion ${assertion.name} passed must be boolean`);
      }
      assertString(assertion.evidence, `case ${result.caseId} assertion ${assertion.name} evidence`);
    }
    assertString(result.outputSummary, `case ${result.caseId} outputSummary`);
    if (Object.hasOwn(result, "rawOutput")) {
      fail(`case ${result.caseId} must not inline rawOutput; use rawOutputArtifact`);
    }
    assertRelativeArtifactPath(result.rawOutputArtifact, result.caseId);
    if (artifactPaths.has(result.rawOutputArtifact)) {
      fail(`case ${result.caseId} rawOutputArtifact must be unique`);
    }
    artifactPaths.add(result.rawOutputArtifact);
    assertString(result.notes, `case ${result.caseId} notes`);
  }

  for (const caseId of definitions.keys()) {
    if (!seen.has(caseId)) {
      fail(`missing provider eval result for ${caseId}`);
    }
  }

  return artifactPaths;
}

const run = readJson(runFile, "provider run file");
assertNoSecretKeys(run);
const artifactPaths = validateRun(
  run,
  collectCaseDefinitions(
    readJson(promptCasesFile, "prompt cases file"),
    readJson(outputCasesFile, "output cases file"),
  ),
);

if (printArtifacts) {
  for (const artifactPath of Array.from(artifactPaths).sort()) {
    console.log(artifactPath);
  }
} else {
  console.log(`Validated LLM provider eval run ${run.runId} with ${run.cases.length} cases.`);
}
