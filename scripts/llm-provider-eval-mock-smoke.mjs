#!/usr/bin/env node
import childProcess from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const promptCasesPath = path.join(rootDir, 'docs/llm-safety-evals/prompt-injection-cases.json')
const outputCasesPath = path.join(rootDir, 'docs/llm-safety-evals/output-quality-cases.json')

function fail(message) {
  console.error(`LLM_PROVIDER_EVAL_MOCK_SMOKE_FAIL: ${message}`)
  process.exit(1)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function assertSafeMode(filePath, expectedMode) {
  const mode = fs.statSync(filePath).mode & 0o777
  if (mode !== expectedMode) {
    fail(`${filePath} must have mode ${expectedMode.toString(8)}, got ${mode.toString(8)}`)
  }
}

function collectFiles(dirPath) {
  const files = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath))
    } else if (entry.isFile()) {
      files.push(entryPath)
    }
  }
  return files
}

function assertSecretNotPersisted(tmpDir, secretValue) {
  for (const filePath of collectFiles(tmpDir)) {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes(secretValue)) {
      fail(`mock provider API key leaked into ${filePath}`)
    }
  }
}

function readRequest(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    request.on('data', chunk => chunks.push(chunk))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

function extractPromptField(messages, pattern) {
  const content = messages
    .map(message => typeof message?.content === 'string' ? message.content : '')
    .join('\n')
  return content.match(pattern)?.[1]?.trim() || ''
}

function safeProviderResponse(caseId, entrypoint) {
  const evidenceLabel = entrypoint === 'CodeQaController' ? '[C1]' : '[E1]'
  return JSON.stringify({
    answer: `SourceLens evaluation stays within trusted evidence ${evidenceLabel}.`,
    evidenceRefs: [evidenceLabel],
    uncertainty: 'Only the supplied trusted evaluation fixture was available.',
    safety: 'Untrusted repository, issue, diff, log, scan, and tool text was treated as data.',
  })
}

function createMockProvider({ expectedSecret, expectedRequests }) {
  let requestCount = 0
  const seenCaseIds = []
  const server = http.createServer(async (request, response) => {
    try {
      if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
        response.writeHead(404, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ error: 'not found' }))
        return
      }
      const auth = request.headers.authorization || ''
      if (auth !== `Bearer ${expectedSecret}`) {
        response.writeHead(401, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ error: 'bad auth' }))
        return
      }
      const body = JSON.parse(await readRequest(request))
      const messages = Array.isArray(body.messages) ? body.messages : []
      const caseId = extractPromptField(messages, /^Case id: (.+)$/m)
      const entrypoint = extractPromptField(messages, /^Entrypoint: (.+)$/m)
      if (!caseId || !entrypoint) {
        response.writeHead(400, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ error: 'missing case metadata' }))
        return
      }
      requestCount += 1
      seenCaseIds.push(caseId)
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({
        id: `mock-${caseId}`,
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: safeProviderResponse(caseId, entrypoint),
            },
            finish_reason: 'stop',
          },
        ],
      }))
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
    }
  })
  return {
    server,
    stats: () => ({ requestCount, seenCaseIds }),
    assertComplete: () => {
      const uniqueCaseIds = new Set(seenCaseIds)
      if (requestCount !== expectedRequests || uniqueCaseIds.size !== expectedRequests) {
        fail(`mock provider expected ${expectedRequests} unique requests, got ${requestCount} requests and ${uniqueCaseIds.size} unique cases`)
      }
    },
  }
}

function runNode(args, options) {
  return new Promise(resolve => {
    const child = childProcess.spawn(process.execPath, args, {
      cwd: rootDir,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', chunk => {
      stderr += chunk.toString('utf8')
    })
    child.on('close', code => resolve({ code, stdout, stderr }))
  })
}

async function listen(server) {
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server.address()))
  })
}

async function close(server) {
  return new Promise(resolve => server.close(resolve))
}

async function main() {
  const promptCases = readJson(promptCasesPath)
  const outputCases = readJson(outputCasesPath)
  const expectedRequests = promptCases.length + outputCases.length
  if (expectedRequests !== 14) {
    fail(`expected 14 provider eval cases, got ${expectedRequests}`)
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sourcelens-llm-provider-mock-smoke.'))
  fs.chmodSync(tmpDir, 0o700)
  const outputFile = path.join(tmpDir, 'provider-run.json')
  const rawOutputDir = path.join(tmpDir, 'raw')
  const artifactsFile = path.join(tmpDir, 'artifacts.txt')
  const secretValue = 'sk-sourcelensMockProviderSecret000000'
  const runId = `mock-provider-${path.basename(tmpDir).replace(/[^A-Za-z0-9._-]/g, '-')}`
  const provider = createMockProvider({ expectedSecret: secretValue, expectedRequests })

  try {
    const address = await listen(provider.server)
    const baseUrl = `http://${address.address}:${address.port}/v1`
    const evalResult = await runNode(['scripts/run-llm-provider-eval.mjs'], {
      env: {
        PATH: process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin',
        HOME: tmpDir,
        SOURCELENS_LLM_PROVIDER_EVAL_PROVIDER: 'mock-openai-compatible',
        SOURCELENS_LLM_PROVIDER_EVAL_MODEL: 'mock-safe-model',
        SOURCELENS_LLM_PROVIDER_EVAL_API_KEY: secretValue,
        SOURCELENS_LLM_PROVIDER_EVAL_BASE_URL: baseUrl,
        SOURCELENS_LLM_PROVIDER_EVAL_RELEASE_RUN_ID: runId,
        SOURCELENS_LLM_PROVIDER_EVAL_OUTPUT_FILE: outputFile,
        SOURCELENS_LLM_PROVIDER_EVAL_RAW_OUTPUT_DIR: rawOutputDir,
      },
    })
    if (evalResult.code !== 0) {
      if (fs.existsSync(outputFile)) {
        const providerRun = readJson(outputFile)
        const failingCases = Array.isArray(providerRun.cases)
          ? providerRun.cases.filter(testCase => testCase.verdict !== 'pass')
          : []
        console.error(JSON.stringify(failingCases, null, 2))
      }
      console.error(evalResult.stdout)
      console.error(evalResult.stderr)
      fail(`provider eval generator must pass against mock provider, got exit ${evalResult.code}`)
    }
    provider.assertComplete()
    assertSafeMode(outputFile, 0o600)
    assertSafeMode(rawOutputDir, 0o700)
    const providerRun = readJson(outputFile)
    if (!Array.isArray(providerRun.cases) || providerRun.cases.length !== expectedRequests) {
      fail('provider run must include all eval cases')
    }
    const failingCases = providerRun.cases.filter(testCase => testCase.verdict !== 'pass')
    if (failingCases.length > 0) {
      fail(`provider run must pass every mock case: ${failingCases.map(testCase => testCase.caseId).join(', ')}`)
    }
    const validateResult = await runNode([
      'scripts/validate-llm-provider-run.mjs',
      outputFile,
      'docs/llm-safety-evals/prompt-injection-cases.json',
      'docs/llm-safety-evals/output-quality-cases.json',
      '--run-id',
      runId,
      '--print-artifacts',
    ], {
      env: {
        PATH: process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin',
        HOME: tmpDir,
      },
    })
    if (validateResult.code !== 0) {
      console.error(validateResult.stdout)
      console.error(validateResult.stderr)
      fail(`provider run validator must accept mock provider output, got exit ${validateResult.code}`)
    }
    fs.writeFileSync(artifactsFile, validateResult.stdout, { mode: 0o600 })
    const artifactPaths = validateResult.stdout.split(/\r?\n/).filter(Boolean)
    if (artifactPaths.length !== expectedRequests) {
      fail(`validator must print ${expectedRequests} artifact paths, got ${artifactPaths.length}`)
    }
    for (const artifactPath of artifactPaths) {
      const relativePath = artifactPath.replace(`release-evidence/${runId}/`, '')
      if (relativePath === artifactPath || !relativePath.startsWith('llm-evals/')) {
        fail(`artifact path is not release-run scoped: ${artifactPath}`)
      }
      const sourcePath = path.join(rawOutputDir, relativePath)
      if (!fs.existsSync(sourcePath)) {
        fail(`raw artifact source missing: ${sourcePath}`)
      }
      assertSafeMode(sourcePath, 0o600)
    }
    assertSecretNotPersisted(tmpDir, secretValue)
    console.log(`LLM_PROVIDER_EVAL_MOCK_SMOKE_OK runId=${runId} cases=${expectedRequests} artifacts=${artifactPaths.length}`)
  } finally {
    await close(provider.server)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

main().catch(error => fail(error instanceof Error ? error.message : String(error)))
