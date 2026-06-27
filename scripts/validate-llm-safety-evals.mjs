#!/usr/bin/env node
import fs from "node:fs";

const promptInjectionFile = process.argv[2];
const outputQualityFile = process.argv[3];

function fail(message) {
  console.error(`LLM SAFETY EVAL FAIL: ${message}`);
  process.exit(1);
}

if (!promptInjectionFile) {
  fail("prompt injection eval file path is required");
}

function readJsonArray(file, label) {
  let cases;
  try {
    cases = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`could not parse ${file}: ${error.message}`);
  }
  if (!Array.isArray(cases)) {
    fail(`${label} evals must be a JSON array`);
  }
  return cases;
}

function assertNonEmptyString(testCase, index, field) {
  if (typeof testCase[field] !== "string" || testCase[field].trim() === "") {
    fail(`case ${index} must define non-empty string field ${field}`);
  }
}

const requiredEntrypoints = new Set([
  "CodeQaController",
  "AgentRuntime",
  "CiDiagnosticService",
  "PrReviewService",
  "IssueDecompositionService",
  "AutoRepairService",
  "AgentTaskService",
]);

function assertUniqueId(ids, id) {
  if (ids.has(id)) {
    fail(`duplicate case id: ${id}`);
  }
  ids.add(id);
}

function assertStringArray(testCase, field) {
  if (!Array.isArray(testCase[field]) || testCase[field].length === 0) {
    fail(`case ${testCase.id} must define non-empty ${field}`);
  }
  for (const value of testCase[field]) {
    if (typeof value !== "string" || value.trim() === "") {
      fail(`case ${testCase.id} has invalid ${field} value`);
    }
  }
}

function assertEntrypointCoverage(seenEntrypoints, label) {
  for (const entrypoint of requiredEntrypoints) {
    if (!seenEntrypoints.has(entrypoint)) {
      fail(`missing ${label} eval case for ${entrypoint}`);
    }
  }
}

function validatePromptInjectionCases(cases) {
  if (cases.length < 7) {
    fail("prompt injection evals must contain at least seven cases");
  }

  const seenEntrypoints = new Set();
  const ids = new Set();

  for (const [index, testCase] of cases.entries()) {
    for (const field of ["id", "entrypoint", "untrustedSource", "untrustedText", "expectedBoundary"]) {
      assertNonEmptyString(testCase, index, field);
    }
    assertUniqueId(ids, testCase.id);
    seenEntrypoints.add(testCase.entrypoint);
    assertStringArray(testCase, "mustContain");
    assertStringArray(testCase, "mustNotContain");
    if (!testCase.mustContain.includes("SOURCELENS_UNTRUSTED_DATA")) {
      fail(`case ${testCase.id} must require SOURCELENS_UNTRUSTED_DATA`);
    }
  }

  assertEntrypointCoverage(seenEntrypoints, "prompt injection");
  console.log(`Validated ${cases.length} prompt injection eval cases.`);
}

function validateOutputQualityCases(cases) {
  if (cases.length < 7) {
    fail("output quality evals must contain at least seven cases");
  }

  const allowedOutputKinds = new Set([
    "grounded_answer",
    "tool_replay_reasoning",
    "ci_diagnostic_json",
    "pr_review_json",
    "issue_decomposition_json",
    "autorepair_patch_plan",
    "agent_task_analysis",
  ]);
  const requiredAssertions = [
    "schemaCompliant",
    "doesNotTreatUntrustedTextAsInstruction",
    "noSecretLeakage",
  ];
  const seenEntrypoints = new Set();
  const ids = new Set();

  for (const [index, testCase] of cases.entries()) {
    for (const field of ["id", "entrypoint", "task", "expectedOutputKind", "reviewNotes"]) {
      assertNonEmptyString(testCase, index, field);
    }
    assertUniqueId(ids, testCase.id);
    seenEntrypoints.add(testCase.entrypoint);
    if (!allowedOutputKinds.has(testCase.expectedOutputKind)) {
      fail(`case ${testCase.id} has unsupported expectedOutputKind: ${testCase.expectedOutputKind}`);
    }
    for (const field of ["requiredAssertions", "minimumEvidence", "forbiddenPatterns"]) {
      assertStringArray(testCase, field);
    }
    for (const assertion of requiredAssertions) {
      if (!testCase.requiredAssertions.includes(assertion)) {
        fail(`case ${testCase.id} must require assertion ${assertion}`);
      }
    }
  }

  assertEntrypointCoverage(seenEntrypoints, "output quality");
  console.log(`Validated ${cases.length} output quality eval cases.`);
}

validatePromptInjectionCases(readJsonArray(promptInjectionFile, "prompt injection"));

if (outputQualityFile) {
  validateOutputQualityCases(readJsonArray(outputQualityFile, "output quality"));
}
