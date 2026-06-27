#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const recordsFile = process.argv[2]
const backendContainer = process.argv[3] || ''

if (!recordsFile) {
  fail('usage: validate-artifact-quality.mjs <records-tsv> [backend-container]')
}

const records = fs.readFileSync(recordsFile, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const [artifactType, storagePath, contentType] = line.split('\t')
    return { artifactType, storagePath, contentType }
  })

if (records.length === 0) {
  fail('no artifact records found')
}

let failed = false
const summaries = []

for (const record of records) {
  if (!shouldValidateJson(record)) {
    summaries.push({ artifactType: record.artifactType, status: 'SKIP', reason: record.contentType || 'non-json' })
    continue
  }
  const text = readArtifact(record.storagePath, backendContainer)
  if (text == null) {
    failed = true
    summaries.push({ artifactType: record.artifactType, status: 'FAIL', reason: `file not readable: ${record.storagePath}` })
    continue
  }

  let data
  try {
    data = JSON.parse(text)
  } catch (error) {
    failed = true
    summaries.push({ artifactType: record.artifactType, status: 'FAIL', reason: `invalid JSON: ${error.message}` })
    continue
  }

  const checks = checksFor(record.artifactType, data)
  const qualityChecks = qualityChecksFor(record.artifactType, data)
  let invalidCount = 0
  let checkedArrays = 0
  let checkedQuality = 0
  const failures = []
  for (const check of checks) {
    if (check.value == null) continue
    checkedArrays += 1
    if (!Array.isArray(check.value)) {
      invalidCount += 1
      failures.push(`${check.path} is ${typeName(check.value)}, expected array`)
      continue
    }
    check.value.forEach((item, index) => {
      if (!isPlainObject(item)) {
        invalidCount += 1
        failures.push(`${check.path}[${index}] is ${typeName(item)}, expected object`)
      }
    })
  }
  for (const check of qualityChecks) {
    checkedQuality += 1
    if (!check.ok) {
      invalidCount += 1
      failures.push(check.message)
    }
  }

  if (invalidCount > 0) {
    failed = true
    summaries.push({
      artifactType: record.artifactType,
      status: 'FAIL',
      checkedArrays,
      checkedQuality,
      invalidCount,
      failures: failures.slice(0, 8),
    })
  } else {
    summaries.push({
      artifactType: record.artifactType,
      status: 'OK',
      checkedArrays,
      checkedQuality,
      facts: factsFor(record.artifactType, data),
    })
  }
}

for (const summary of summaries) {
  if (summary.status === 'OK') {
    const facts = summary.facts ? ` ${summary.facts}` : ''
    console.log(`ARTIFACT OK: ${summary.artifactType} checkedArrays=${summary.checkedArrays} checkedQuality=${summary.checkedQuality || 0}${facts}`)
  } else if (summary.status === 'SKIP') {
    console.log(`ARTIFACT SKIP: ${summary.artifactType} ${summary.reason}`)
  } else {
    console.error(`ARTIFACT FAIL: ${summary.artifactType} checkedArrays=${summary.checkedArrays || 0} checkedQuality=${summary.checkedQuality || 0} invalid=${summary.invalidCount || 0}`)
    for (const item of summary.failures || [summary.reason]) {
      console.error(`  - ${item}`)
    }
  }
}

if (failed) {
  process.exit(1)
}

function qualityChecksFor(artifactType, data) {
  if (artifactType !== 'ARCHITECTURE_REPORT') {
    return []
  }
  const quality = data.reportQuality
  const checks = [
    {
      ok: isPlainObject(quality),
      message: 'reportQuality is missing or not an object',
    },
  ]
  if (!isPlainObject(quality)) {
    return checks
  }
  checks.push(
    {
      ok: ['READY', 'REVIEW', 'RISK'].includes(quality.readiness),
      message: `reportQuality.readiness is ${typeName(quality.readiness)}, expected READY/REVIEW/RISK`,
    },
    {
      ok: Number.isInteger(quality.confidence) && quality.confidence >= 0 && quality.confidence <= 100,
      message: `reportQuality.confidence is ${quality.confidence}, expected integer 0..100`,
    },
    {
      ok: Array.isArray(quality.evidenceChecks) && quality.evidenceChecks.length > 0,
      message: 'reportQuality.evidenceChecks is missing or empty',
    },
    {
      ok: typeof quality.summary === 'string' && quality.summary.trim().length > 0,
      message: 'reportQuality.summary is missing or empty',
    },
    {
      ok: Array.isArray(quality.gaps) && quality.gaps.every((item) => typeof item === 'string' && item.trim().length > 0),
      message: 'reportQuality.gaps must be an array of non-empty strings',
    },
    {
      ok: Array.isArray(quality.nextActions)
        && quality.nextActions.length > 0
        && quality.nextActions.every((item) => typeof item === 'string' && item.trim().length > 0),
      message: 'reportQuality.nextActions must contain non-empty action strings',
    },
    {
      ok: Array.isArray(quality.evidenceChecks)
        && quality.evidenceChecks.every((item) => isCompleteEvidenceCheck(item)),
      message: 'reportQuality.evidenceChecks items must include key/label/status/value/detail',
    },
    {
      ok: hasEvidenceCheck(quality, 'scan_scope')
        && hasEvidenceCheck(quality, 'test_signal')
        && hasEvidenceCheck(quality, 'module_map')
        && hasEvidenceCheck(quality, 'api_data_surface')
        && hasEvidenceCheck(quality, 'fingerprint')
        && hasEvidenceCheck(quality, 'risk_signal'),
      message: 'reportQuality.evidenceChecks missing required scan_scope/test_signal/module_map/api_data_surface/fingerprint/risk_signal checks',
    },
  )
  return checks
}

function shouldValidateJson(record) {
  const contentType = (record.contentType || '').toLowerCase()
  return contentType.includes('json') || record.storagePath.endsWith('.json')
}

function isCompleteEvidenceCheck(item) {
  return isPlainObject(item)
    && typeof item.key === 'string'
    && item.key.trim().length > 0
    && typeof item.label === 'string'
    && item.label.trim().length > 0
    && ['READY', 'REVIEW', 'WARNING', 'RISK', 'GAP', 'IDLE'].includes(item.status)
    && typeof item.value === 'string'
    && item.value.trim().length > 0
    && typeof item.detail === 'string'
    && item.detail.trim().length > 0
}

function readArtifact(path, container) {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8')
  }
  if (!container) {
    return null
  }
  const result = spawnSync('docker', ['exec', '-e', `ARTIFACT_PATH=${path}`, container, 'sh', '-lc', 'cat "$ARTIFACT_PATH"'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.status !== 0) {
    return null
  }
  return result.stdout
}

function checksFor(artifactType, data) {
  switch (artifactType) {
    case 'RAW_SCAN_RESULT':
      return [
        ...structureChecks(data.structure),
        { path: 'symbols', value: data.symbols },
        { path: 'relations', value: data.relations },
        { path: 'graph.nodes', value: data.graph?.nodes },
        { path: 'graph.edges', value: data.graph?.edges },
      ]
    case 'API_CATALOG':
      return [
        { path: 'routes', value: data.routes },
        { path: 'controllers', value: data.controllers },
      ]
    case 'DB_SCHEMA':
      return [
        { path: 'entities', value: data.entities },
        { path: 'dbEntities', value: data.dbEntities },
      ]
    case 'ARCHITECTURE_REPORT':
      return [
        { path: 'apiRoutes', value: data.apiRoutes },
        { path: 'dbEntities', value: data.dbEntities },
        { path: 'codeQuality.risks', value: data.codeQuality?.risks },
        { path: 'technicalDebt', value: data.technicalDebt },
      ]
    default:
      return []
  }
}

function structureChecks(structure = {}) {
  return [
    'controllers',
    'services',
    'repositories',
    'entities',
    'mappers',
    'configurations',
    'api_routes',
    'db_entities',
  ].map((name) => ({ path: `structure.${name}`, value: structure?.[name] }))
}

function factsFor(artifactType, data) {
  switch (artifactType) {
    case 'RAW_SCAN_RESULT':
      return `apiRoutes=${data.structure?.api_routes?.length ?? '-'} entities=${data.structure?.entities?.length ?? '-'} symbols=${data.symbols?.length ?? '-'}`
    case 'API_CATALOG':
      return `routes=${data.routes?.length ?? '-'} controllers=${data.controllers?.length ?? '-'}`
    case 'DB_SCHEMA':
      return `entities=${data.entities?.length ?? '-'} dbEntities=${data.dbEntities?.length ?? '-'}`
    case 'ARCHITECTURE_REPORT':
      return `apiRoutes=${data.apiRoutes?.length ?? '-'} dbEntities=${data.dbEntities?.length ?? '-'} risks=${data.codeQuality?.risks?.length ?? '-'} reportQuality=${data.reportQuality?.readiness ?? '-'}`
    default:
      return ''
  }
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function hasEvidenceCheck(quality, key) {
  return Array.isArray(quality.evidenceChecks)
    && quality.evidenceChecks.some((item) => isPlainObject(item) && item.key === key)
}

function typeName(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function fail(message) {
  console.error(`ARTIFACT QUALITY FAIL: ${message}`)
  process.exit(1)
}
