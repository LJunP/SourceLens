#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('..', import.meta.url).pathname)
const jsonMode = process.argv.includes('--json')
const retentionDryRunMode = process.argv.includes('--retention-dry-run')
const evidenceDirArgIndex = process.argv.indexOf('--evidence-dir')
const evidenceDir = evidenceDirArgIndex >= 0
  ? path.resolve(process.argv[evidenceDirArgIndex + 1] || '')
  : path.join(rootDir, 'release-evidence')

function readTextIfExists(file) {
  if (!existsSync(file)) return ''
  return readFileSync(file, 'utf8')
}

function parseKeyValueFile(text) {
  const values = new Map()
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/)
    if (match) values.set(match[1], match[2].trim())
  }
  return values
}

function parseSummaryCounts(text) {
  const countFor = (key) => {
    const match = text.match(new RegExp(`- ${key}: \\\`?([0-9]+)\\\`?`))
    return match ? Number(match[1]) : null
  }
  return {
    requiredFailures: countFor('required_failures'),
    optionalWarnings: countFor('optional_warnings'),
    skipped: countFor('skipped'),
  }
}

function parseStatusTsv(text) {
  if (!text.trim()) {
    return { rows: 0, fail: 0, warn: 0, skip: 0, ok: 0, pending: 0, okSlugs: [] }
  }
  const lines = text.split(/\r?\n/).filter(Boolean)
  const rows = Math.max(lines.length - 1, 0)
  const counts = { rows, fail: 0, warn: 0, skip: 0, ok: 0, pending: 0, okSlugs: [] }
  for (const line of lines.slice(1)) {
    const columns = line.split('\t')
    const status = columns[0]
    const slug = columns[1] || ''
    if (status === 'OK') {
      counts.ok += 1
      counts.okSlugs.push(slug)
    }
    if (status === 'FAIL') counts.fail += 1
    if (status === 'WARN') counts.warn += 1
    if (status === 'SKIP') counts.skip += 1
    if (status === 'PENDING') counts.pending += 1
  }
  return counts
}

function markerPayload(text, prefix) {
  const matches = text.split(/\r?\n/)
    .filter(line => line.startsWith(prefix))
    .map(line => line.slice(prefix.length))
  if (matches.length !== 1) {
    return {
      present: matches.length > 0,
      valid: false,
      reason: matches.length === 0 ? 'marker not found' : 'multiple markers found',
    }
  }
  try {
    return {
      present: true,
      valid: true,
      payload: JSON.parse(matches[0]),
      reason: 'marker parsed',
    }
  } catch (error) {
    return {
      present: true,
      valid: false,
      reason: `marker JSON invalid: ${error.message}`,
    }
  }
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
}

function includesAll(actual, expected) {
  const actualSet = new Set(actual)
  return expected.every(item => actualSet.has(item))
}

function exactStringSet(actual, expected) {
  return actual.length === expected.length && includesAll(actual, expected)
}

function parseDashboardMetricsSourceEvidence(dir) {
  const slug = 'dashboard-next-action-ui-smoke'
  const logText = readTextIfExists(path.join(dir, `${slug}.log`))
  const marker = markerPayload(logText, 'DASHBOARD_NEXT_ACTION_SMOKE_OK ')
  const expectedApiBackedCases = [
    'connect-repository',
    'watch-running-scan',
    'start-first-scan',
    'inspect-code-chunks',
    'review-risk-report',
    'ask-code-qa',
  ]
  const expectedFallbackCases = ['recover-dashboard']
  const base = {
    step: slug,
    markerPresent: marker.present,
    markerValid: marker.valid,
    sourceLabelSelector: '',
    apiBackedCases: [],
    fallbackCases: [],
    legacyStatsFallbackCase: '',
    apiBackedComplete: false,
    fallbackComplete: false,
    legacyFallbackComplete: false,
    complete: false,
    reason: marker.reason,
  }
  if (!marker.valid) return base
  const signals = marker.payload?.dashboardStatsApiSignals
  if (!signals || typeof signals !== 'object' || Array.isArray(signals)) {
    return {
      ...base,
      markerPresent: true,
      markerValid: true,
      reason: 'dashboardStatsApiSignals missing',
    }
  }
  const apiBackedCases = stringArray(signals.apiBackedCases)
  const fallbackCases = stringArray(signals.fallbackCases)
  const legacyStatsFallbackCase = typeof signals.legacyStatsFallbackCase === 'string'
    ? signals.legacyStatsFallbackCase
    : ''
  const sourceLabelSelector = typeof signals.sourceLabelSelector === 'string'
    ? signals.sourceLabelSelector
    : ''
  const apiBackedComplete = includesAll(apiBackedCases, expectedApiBackedCases)
    && apiBackedCases.length === expectedApiBackedCases.length
  const fallbackComplete = includesAll(fallbackCases, expectedFallbackCases)
    && fallbackCases.length === expectedFallbackCases.length
  const legacyFallbackComplete = legacyStatsFallbackCase === 'legacy-stats-without-api-fields'
  const selectorComplete = sourceLabelSelector === '.sl-dashboard-metrics-source'
  const complete = selectorComplete && apiBackedComplete && fallbackComplete && legacyFallbackComplete
  return {
    ...base,
    sourceLabelSelector,
    apiBackedCases,
    fallbackCases,
    legacyStatsFallbackCase,
    apiBackedComplete,
    fallbackComplete,
    legacyFallbackComplete,
    complete,
    reason: complete ? 'dashboard metrics source evidence complete' : 'dashboard metrics source evidence incomplete',
  }
}

function parseDashboardExecutiveBriefingEvidence(dir) {
  const slug = 'dashboard-next-action-ui-smoke'
  const markerName = 'DASHBOARD_NEXT_ACTION_SMOKE_OK'
  const logText = readTextIfExists(path.join(dir, `${slug}.log`))
  const marker = markerPayload(logText, `${markerName} `)
  const expectedSignals = ['阶段进度', '质量状态', '风险阻塞', '下一步投入']
  const expectedCases = [
    'recover-dashboard',
    'connect-repository',
    'watch-running-scan',
    'start-first-scan',
    'inspect-code-chunks',
    'review-risk-report',
    'ask-code-qa',
  ]
  const expectedViewports = ['1440x900', '1024x768', '768x1024', '390x844', '320x740']
  const viewportSpecs = new Map([
    ['1440x900', { width: 1440, height: 900, minBytes: 20000 }],
    ['1024x768', { width: 1024, height: 768, minBytes: 20000 }],
    ['768x1024', { width: 768, height: 1024, minBytes: 20000 }],
    ['390x844', { width: 390, height: 844, minBytes: 20000 }],
    ['320x740', { width: 320, height: 740, minBytes: 5000 }],
  ])
  const booleanFields = [
    'expectedColumnsHonored',
    'desktopColumns',
    'tabletColumns',
    'tabletPortraitColumns',
    'mobileColumns',
    'narrowColumns',
    'copyReadable',
    'actionVisible',
    'p9CompleteClaim',
    'rbacCompleteClaim',
    'productionDeploymentClaim',
    'commercializationClaim',
  ]
  const emptyFields = {
    scope: '',
    signals: [],
    signalCount: null,
    viewports: [],
    visitedCases: [],
    visualEvidence: [],
    ...Object.fromEntries(booleanFields.map(field => [field, null])),
  }
  const emptyChecks = {
    scope: false,
    signals: false,
    signalCount: false,
    expectedColumnsHonored: false,
    desktopColumns: false,
    tabletColumns: false,
    tabletPortraitColumns: false,
    mobileColumns: false,
    narrowColumns: false,
    copyReadable: false,
    actionVisible: false,
    p9CompleteClaim: false,
    rbacCompleteClaim: false,
    productionDeploymentClaim: false,
    commercializationClaim: false,
    viewportCoverageComplete: false,
    visualEvidenceCoverageComplete: false,
  }
  const base = {
    step: slug,
    marker: {
      name: markerName,
      present: marker.present,
      valid: marker.valid,
    },
    fields: emptyFields,
    checks: emptyChecks,
    viewportCoverageComplete: false,
    visualEvidenceCoverageComplete: false,
    complete: false,
    reason: marker.reason,
  }
  if (!marker.valid) return base

  const viewports = stringArray(marker.payload?.viewports)
  const visitedCases = stringArray(marker.payload?.visitedCases)
  const viewportCoverageComplete = exactStringSet(viewports, expectedViewports)
    && expectedCases.every(caseKey => expectedViewports.every(
      viewport => visitedCases.includes(`${caseKey}:${viewport}`),
    ))
  const rawVisualEvidence = Array.isArray(marker.payload?.visualEvidence)
    ? marker.payload.visualEvidence
    : []
  const visualEvidenceByViewport = new Map()
  let visualEvidenceEntriesValid = rawVisualEvidence.length === expectedViewports.length
  const visualEvidence = rawVisualEvidence.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      visualEvidenceEntriesValid = false
      return { valid: false }
    }
    const viewport = typeof item.viewport === 'string' ? item.viewport : ''
    const viewportSpec = viewportSpecs.get(viewport)
    const screenshot = typeof item.screenshot === 'string' ? item.screenshot : ''
    const artifact = typeof item.artifact === 'string' ? item.artifact : ''
    const expectedScreenshot = viewport ? `dashboard-next-action-review-risk-report-${viewport}.png` : ''
    const expectedArtifact = expectedScreenshot
      ? `dashboard-next-action-ui-smoke/${expectedScreenshot}`
      : ''
    const artifactPath = artifact ? path.resolve(dir, artifact) : ''
    const artifactSafe = Boolean(artifactPath)
      && artifactPath.startsWith(`${path.resolve(dir)}${path.sep}`)
      && artifact === expectedArtifact
    const artifactPresent = artifactSafe && existsSync(artifactPath)
    const artifactSizeMatches = artifactPresent
      && Number.isInteger(item.screenshotBytes)
      && statSync(artifactPath).size === item.screenshotBytes
    const duplicateViewport = Boolean(viewport) && visualEvidenceByViewport.has(viewport)
    const valid = Boolean(viewportSpec)
      && !duplicateViewport
      && item.caseKey === 'review-risk-report'
      && screenshot === expectedScreenshot
      && artifactSafe
      && Number.isInteger(item.screenshotBytes)
      && item.screenshotBytes > viewportSpec.minBytes
      && item.screenshotWidth === viewportSpec.width
      && item.screenshotHeight === viewportSpec.height
      && Number.isInteger(item.distinctColorCount)
      && item.distinctColorCount >= 16
      && artifactSizeMatches
    if (viewport && !duplicateViewport) visualEvidenceByViewport.set(viewport, item)
    if (!valid) visualEvidenceEntriesValid = false
    return {
      caseKey: typeof item.caseKey === 'string' ? item.caseKey : '',
      viewport,
      screenshot,
      artifact,
      screenshotBytes: Number.isInteger(item.screenshotBytes) ? item.screenshotBytes : null,
      screenshotWidth: Number.isInteger(item.screenshotWidth) ? item.screenshotWidth : null,
      screenshotHeight: Number.isInteger(item.screenshotHeight) ? item.screenshotHeight : null,
      distinctColorCount: Number.isInteger(item.distinctColorCount) ? item.distinctColorCount : null,
      artifactPresent,
      artifactSizeMatches,
      duplicateViewport,
      valid,
    }
  })
  const visualEvidenceCoverageComplete = visualEvidenceEntriesValid
    && expectedViewports.every(viewport => visualEvidenceByViewport.has(viewport))

  const briefing = marker.payload?.executiveBriefing
  if (!briefing || typeof briefing !== 'object' || Array.isArray(briefing)) {
    return {
      ...base,
      marker: { ...base.marker, present: true, valid: true },
      fields: { ...base.fields, viewports, visitedCases, visualEvidence },
      checks: { ...base.checks, viewportCoverageComplete, visualEvidenceCoverageComplete },
      viewportCoverageComplete,
      visualEvidenceCoverageComplete,
      reason: 'executiveBriefing missing',
    }
  }

  const fields = {
    scope: typeof briefing.scope === 'string' ? briefing.scope : '',
    signals: stringArray(briefing.signals),
    signalCount: Number.isInteger(briefing.signalCount) ? briefing.signalCount : null,
    viewports,
    visitedCases,
    visualEvidence,
    ...Object.fromEntries(booleanFields.map(field => [
      field,
      typeof briefing[field] === 'boolean' ? briefing[field] : null,
    ])),
  }
  const checks = {
    scope: fields.scope === 'DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY',
    signals: exactStringSet(fields.signals, expectedSignals),
    signalCount: fields.signalCount === 4,
    expectedColumnsHonored: fields.expectedColumnsHonored === true,
    desktopColumns: fields.desktopColumns === true,
    tabletColumns: fields.tabletColumns === true,
    tabletPortraitColumns: fields.tabletPortraitColumns === true,
    mobileColumns: fields.mobileColumns === true,
    narrowColumns: fields.narrowColumns === true,
    copyReadable: fields.copyReadable === true,
    actionVisible: fields.actionVisible === true,
    p9CompleteClaim: fields.p9CompleteClaim === false,
    rbacCompleteClaim: fields.rbacCompleteClaim === false,
    productionDeploymentClaim: fields.productionDeploymentClaim === false,
    commercializationClaim: fields.commercializationClaim === false,
    viewportCoverageComplete,
    visualEvidenceCoverageComplete,
  }
  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([field]) => field)
  const complete = failedChecks.length === 0
  return {
    ...base,
    fields,
    checks,
    viewportCoverageComplete,
    visualEvidenceCoverageComplete,
    complete,
    reason: complete
      ? 'dashboard executive briefing evidence complete'
      : `dashboard executive briefing evidence incomplete: ${failedChecks.join(', ')}`,
  }
}

function parseDashboardProductPlaneEvidence(dir) {
  const slug = 'dashboard-next-action-ui-smoke'
  const markerName = 'DASHBOARD_NEXT_ACTION_SMOKE_OK'
  const logText = readTextIfExists(path.join(dir, `${slug}.log`))
  const marker = markerPayload(logText, `${markerName} `)
  const expectedCases = [
    'recover-dashboard',
    'connect-repository',
    'watch-running-scan',
    'start-first-scan',
    'inspect-code-chunks',
    'review-risk-report',
    'ask-code-qa',
  ]
  const expectedColumnsByViewport = new Map([
    ['1440x900', 3],
    ['1024x768', 2],
    ['768x1024', 2],
    ['390x844', 1],
    ['320x740', 1],
  ])
  const expectedViewports = [...expectedColumnsByViewport.keys()]
  const booleanFields = [
    'visible',
    'expectedColumnsHonored',
    'desktopColumns',
    'tabletColumns',
    'tabletPortraitColumns',
    'mobileColumns',
    'narrowColumns',
    'copyReadable',
    'rbacCompleteClaim',
    'productionDeploymentClaim',
  ]
  const emptyFields = {
    scope: '',
    surface: '',
    planeCount: null,
    actionCount: null,
    proofs: [],
    ...Object.fromEntries(booleanFields.map(field => [field, null])),
  }
  const emptyChecks = {
    scope: false,
    surface: false,
    visible: false,
    planeCount: false,
    actionCount: false,
    expectedColumnsHonored: false,
    desktopColumns: false,
    tabletColumns: false,
    tabletPortraitColumns: false,
    mobileColumns: false,
    narrowColumns: false,
    copyReadable: false,
    rbacCompleteClaim: false,
    productionDeploymentClaim: false,
    proofCount: false,
    proofCombinationsUnique: false,
    proofCoverageComplete: false,
    proofVisible: false,
    proofPlaneCount: false,
    proofColumns: false,
    proofExpectedColumnsHonored: false,
    proofActionCount: false,
    proofCopyReadable: false,
    proofNoOverclaim: false,
    proofsComplete: false,
  }
  const base = {
    step: slug,
    marker: {
      name: markerName,
      present: marker.present,
      valid: marker.valid,
    },
    productPlaneMapPresent: false,
    fields: emptyFields,
    checks: emptyChecks,
    proofCoverageComplete: false,
    proofsComplete: false,
    complete: false,
    reason: marker.reason,
  }
  if (!marker.valid) return base

  const productPlaneMap = marker.payload?.productPlaneMap
  if (!productPlaneMap || typeof productPlaneMap !== 'object' || Array.isArray(productPlaneMap)) {
    return {
      ...base,
      marker: { ...base.marker, present: true, valid: true },
      reason: 'productPlaneMap missing',
    }
  }

  const expectedProofCount = expectedCases.length * expectedViewports.length
  const rawProofs = Array.isArray(productPlaneMap.proofs) ? productPlaneMap.proofs : []
  const proofKeys = new Set()
  let proofEntriesValid = rawProofs.length > 0
  let proofCombinationsUnique = rawProofs.length > 0
  const proofs = rawProofs.map((proof) => {
    if (!proof || typeof proof !== 'object' || Array.isArray(proof)) {
      proofEntriesValid = false
      proofCombinationsUnique = false
      return { valid: false }
    }
    const caseKey = typeof proof.caseKey === 'string' ? proof.caseKey : ''
    const viewport = typeof proof.viewport === 'string' ? proof.viewport : ''
    const expectedColumns = expectedColumnsByViewport.get(viewport)
    const allowedCombination = expectedCases.includes(caseKey) && expectedColumns !== undefined
    const proofKey = allowedCombination ? `${caseKey}:${viewport}` : ''
    const duplicateCombination = Boolean(proofKey) && proofKeys.has(proofKey)
    if (proofKey && !duplicateCombination) proofKeys.add(proofKey)
    if (!allowedCombination || duplicateCombination) {
      proofEntriesValid = false
      proofCombinationsUnique = false
    }
    const visibleValid = proof.visible === true
    const planeCountValid = proof.planeCount === 3
    const columnsValid = expectedColumns !== undefined
      && proof.expectedColumns === expectedColumns
      && proof.actualColumns === expectedColumns
    const expectedColumnsHonoredValid = proof.expectedColumnsHonored === true
    const actionCountValid = proof.actionCount === 3
    const copyReadableValid = proof.copyReadable === true
    const noOverclaim = proof.rbacCompleteClaim === false
      && proof.productionDeploymentClaim === false
    const valid = allowedCombination
      && !duplicateCombination
      && visibleValid
      && planeCountValid
      && columnsValid
      && expectedColumnsHonoredValid
      && actionCountValid
      && copyReadableValid
      && noOverclaim
    if (!valid) proofEntriesValid = false
    return {
      caseKey,
      viewport,
      visible: typeof proof.visible === 'boolean' ? proof.visible : null,
      planeCount: Number.isInteger(proof.planeCount) ? proof.planeCount : null,
      expectedColumns: Number.isInteger(proof.expectedColumns) ? proof.expectedColumns : null,
      actualColumns: Number.isInteger(proof.actualColumns) ? proof.actualColumns : null,
      expectedColumnsHonored: typeof proof.expectedColumnsHonored === 'boolean'
        ? proof.expectedColumnsHonored
        : null,
      copyReadable: typeof proof.copyReadable === 'boolean' ? proof.copyReadable : null,
      actionCount: Number.isInteger(proof.actionCount) ? proof.actionCount : null,
      rbacCompleteClaim: typeof proof.rbacCompleteClaim === 'boolean'
        ? proof.rbacCompleteClaim
        : null,
      productionDeploymentClaim: typeof proof.productionDeploymentClaim === 'boolean'
        ? proof.productionDeploymentClaim
        : null,
      allowedCombination,
      duplicateCombination,
      visibleValid,
      planeCountValid,
      columnsValid,
      expectedColumnsHonoredValid,
      actionCountValid,
      copyReadableValid,
      noOverclaim,
      valid,
    }
  })
  proofCombinationsUnique = proofCombinationsUnique && proofKeys.size === rawProofs.length
  const proofCount = rawProofs.length === expectedProofCount
  const proofCoverageComplete = proofCount
    && proofCombinationsUnique
    && expectedCases.every(caseKey => expectedViewports.every(
      viewport => proofKeys.has(`${caseKey}:${viewport}`),
    ))
  const completeProofSet = predicate => proofs.length > 0 && proofs.every(predicate)
  const proofChecks = {
    proofCount,
    proofCombinationsUnique,
    proofCoverageComplete,
    proofVisible: completeProofSet(proof => proof.visibleValid === true),
    proofPlaneCount: completeProofSet(proof => proof.planeCountValid === true),
    proofColumns: completeProofSet(proof => proof.columnsValid === true),
    proofExpectedColumnsHonored: completeProofSet(
      proof => proof.expectedColumnsHonoredValid === true,
    ),
    proofActionCount: completeProofSet(proof => proof.actionCountValid === true),
    proofCopyReadable: completeProofSet(proof => proof.copyReadableValid === true),
    proofNoOverclaim: completeProofSet(proof => proof.noOverclaim === true),
  }
  const proofsComplete = proofEntriesValid
    && Object.values(proofChecks).every(Boolean)

  const fields = {
    scope: typeof productPlaneMap.scope === 'string' ? productPlaneMap.scope : '',
    surface: typeof productPlaneMap.surface === 'string' ? productPlaneMap.surface : '',
    planeCount: Number.isInteger(productPlaneMap.planeCount) ? productPlaneMap.planeCount : null,
    actionCount: Number.isInteger(productPlaneMap.actionCount) ? productPlaneMap.actionCount : null,
    proofs,
    ...Object.fromEntries(booleanFields.map(field => [
      field,
      typeof productPlaneMap[field] === 'boolean' ? productPlaneMap[field] : null,
    ])),
  }
  const checks = {
    scope: fields.scope === 'DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY',
    surface: fields.surface === 'FRONT_OFFICE_DEVELOPER_CONSOLE_BACK_OFFICE',
    visible: fields.visible === true,
    planeCount: fields.planeCount === 3,
    actionCount: fields.actionCount === 3,
    expectedColumnsHonored: fields.expectedColumnsHonored === true,
    desktopColumns: fields.desktopColumns === true,
    tabletColumns: fields.tabletColumns === true,
    tabletPortraitColumns: fields.tabletPortraitColumns === true,
    mobileColumns: fields.mobileColumns === true,
    narrowColumns: fields.narrowColumns === true,
    copyReadable: fields.copyReadable === true,
    rbacCompleteClaim: fields.rbacCompleteClaim === false,
    productionDeploymentClaim: fields.productionDeploymentClaim === false,
    ...proofChecks,
    proofsComplete,
  }
  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([field]) => field)
  const complete = failedChecks.length === 0
  return {
    ...base,
    productPlaneMapPresent: true,
    fields,
    checks,
    proofCoverageComplete,
    proofsComplete,
    complete,
    reason: complete
      ? 'dashboard product plane evidence complete'
      : `dashboard product plane evidence incomplete: ${failedChecks.join(', ')}`,
  }
}

function directorySize(dir) {
  let total = 0
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name)
    const stat = statSync(abs)
    if (stat.isDirectory()) {
      total += directorySize(abs)
    } else {
      total += stat.size
    }
  }
  return total
}

function findCurrentAuthority() {
  const board = readTextIfExists(path.join(rootDir, 'docs/AGENT_STATUS_BOARD.md'))
  const explicit = board.match(/CURRENT FULL AUTHORITY[^`]*`release-evidence\/([^`]+)`/)
  if (explicit) return explicit[1]
  const matches = [...board.matchAll(/release-evidence\/(release-current-schema-[^`\s]+)/g)].map(m => m[1])
  return matches[0] || ''
}

function isFullLike(runId, profile) {
  return profile === 'release'
    || profile === 'nightly'
    || /^release-current-schema-/.test(runId)
    || /^release-p12pre-full-authority-/.test(runId)
    || /^p6-full-release-refresh-/.test(runId)
    || /authority/.test(runId)
}

function isFocusedLike(runId) {
  return /^(agent|autorepair|candidate|ci-agent|dashboard|patch|pr|public|p6|p12-pre|scan|schema2|report)/.test(runId)
    || /ui-gate|live|focused|verifier|smoke|probe|citation|source-location|governance/.test(runId)
}

function hasMeaningfulFocusedStep(item) {
  const ignored = new Set(['git-metadata', 'worktree-inventory'])
  return item.okSlugs.some(slug => slug && !ignored.has(slug))
}

function categoryFor(item, currentAuthority) {
  if (item.runId === currentAuthority) {
    return {
      category: 'current-full',
      confidence: 'high',
      reason: 'matches current full authority documented in AGENT_STATUS_BOARD',
      manualReviewRequired: false,
      archiveCandidate: false,
    }
  }
  if (item.hasInvalidMarker || item.requiredFailures > 0 || item.stepFailCount > 0 || item.stepPendingCount > 0) {
    return {
      category: 'failed-or-interrupted',
      confidence: item.hasStatusTsv || item.hasInvalidMarker ? 'high' : 'medium',
      reason: 'invalid marker, required failure, failed step or pending step detected',
      manualReviewRequired: true,
      archiveCandidate: false,
    }
  }
  if (!item.hasManifest || !item.hasSummary || !item.hasStatusTsv) {
    return {
      category: 'unknown-review',
      confidence: 'medium',
      reason: 'missing manifest, summary or status.tsv prevents safe classification',
      manualReviewRequired: true,
      archiveCandidate: false,
    }
  }
  if (isFullLike(item.runId, item.profile)) {
    return {
      category: 'historical-superseded',
      confidence: 'medium',
      reason: 'full/release-like evidence package is not current authority',
      manualReviewRequired: true,
      archiveCandidate: true,
    }
  }
  if (isFocusedLike(item.runId)) {
    return {
      category: 'retained-focused',
      confidence: 'medium',
      reason: 'focused/live/gate evidence package with no detected failure',
      manualReviewRequired: false,
      archiveCandidate: false,
    }
  }
  if (item.profile === 'local' && hasMeaningfulFocusedStep(item)) {
    return {
      category: 'retained-focused',
      confidence: 'medium',
      reason: 'legacy local evidence has completed focused or drill steps and no detected failure',
      manualReviewRequired: false,
      archiveCandidate: false,
    }
  }
  return {
    category: 'unknown-review',
    confidence: 'low',
    reason: 'name and metadata do not match known release evidence categories',
    manualReviewRequired: true,
    archiveCandidate: false,
  }
}

function inspectRun(dirName, currentAuthority) {
  const dir = path.join(evidenceDir, dirName)
  const manifestText = readTextIfExists(path.join(dir, 'manifest.txt'))
  const summaryText = readTextIfExists(path.join(dir, 'summary.md'))
  const statusText = readTextIfExists(path.join(dir, 'status.tsv'))
  const manifest = parseKeyValueFile(manifestText)
  const summary = parseSummaryCounts(summaryText)
  const status = parseStatusTsv(statusText)
  const item = {
    runId: manifest.get('run_id') || dirName,
    path: `release-evidence/${dirName}`,
    createdAt: manifest.get('created_at') || '',
    profile: manifest.get('release_evidence_profile') || '',
    profileSchema: manifest.get('release_evidence_profile_schema') || '',
    gitHead: manifest.get('git_head') || '',
    hasManifest: Boolean(manifestText),
    hasSummary: Boolean(summaryText),
    hasStatusTsv: Boolean(statusText),
    hasChecksums: existsSync(path.join(dir, 'checksums.sha256')),
    hasInvalidMarker: existsSync(path.join(dir, 'INVALID_RELEASE_EVIDENCE.txt')),
    requiredFailures: summary.requiredFailures ?? status.fail,
    optionalWarnings: summary.optionalWarnings ?? status.warn,
    skipped: summary.skipped ?? status.skip,
    stepFailCount: status.fail,
    stepSkipCount: status.skip,
    stepPendingCount: status.pending,
    okSlugs: status.okSlugs,
    dashboardMetricsSourceEvidence: parseDashboardMetricsSourceEvidence(dir),
    dashboardExecutiveBriefingEvidence: parseDashboardExecutiveBriefingEvidence(dir),
    dashboardProductPlaneEvidence: parseDashboardProductPlaneEvidence(dir),
    sizeBytes: directorySize(dir),
    isCurrentAuthority: dirName === currentAuthority,
    supersededBy: dirName === currentAuthority ? '' : currentAuthority,
    deleteAllowed: false,
  }
  return { ...item, ...categoryFor(item, currentAuthority) }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}K`
  return `${Math.round(bytes / 1024 / 1024)}M`
}

function retentionPlanFor(item) {
  const common = {
    runId: item.runId,
    path: item.path,
    category: item.category,
    confidence: item.confidence,
    sizeBytes: item.sizeBytes,
    deleteAllowed: false,
  }
  if (item.category === 'current-full') {
    return {
      ...common,
      action: 'KEEP_CURRENT_AUTHORITY',
      priority: 'blocker',
      manualReviewRequired: false,
      archiveCandidate: false,
      reason: 'current full authority must remain in place until a newer verified authority replaces it',
    }
  }
  if (item.category === 'retained-focused') {
    return {
      ...common,
      action: 'KEEP_RETAINED_FOCUSED',
      priority: 'normal',
      manualReviewRequired: false,
      archiveCandidate: false,
      reason: 'focused evidence should remain available until absorbed by a newer full authority or explicitly superseded',
    }
  }
  if (item.category === 'historical-superseded') {
    return {
      ...common,
      action: 'ARCHIVE_CANDIDATE_MANUAL_ONLY',
      priority: 'review',
      manualReviewRequired: true,
      archiveCandidate: true,
      reason: 'historical full/release-like package may be archived after manual confirmation; never delete automatically',
    }
  }
  if (item.category === 'failed-or-interrupted') {
    return {
      ...common,
      action: 'DIAGNOSE_BEFORE_ARCHIVE',
      priority: 'review',
      manualReviewRequired: true,
      archiveCandidate: false,
      reason: 'failed or interrupted evidence may contain useful diagnostics and must be reviewed before any archive decision',
    }
  }
  return {
    ...common,
    action: 'CLASSIFY_BEFORE_ACTION',
    priority: 'blocker',
    manualReviewRequired: true,
    archiveCandidate: false,
    reason: 'unknown evidence must be manually classified before archive or retention action',
  }
}

function printRetentionDryRun(items, currentAuthority) {
  const plan = items.map(retentionPlanFor)
  console.log(`release_evidence_retention_dry_run current_authority=${currentAuthority || '(not found)'} total=${items.length} delete_allowed=false`)
  console.log('action\tcount\tsize')
  const byAction = new Map()
  for (const item of plan) {
    const current = byAction.get(item.action) || { count: 0, size: 0 }
    current.count += 1
    current.size += item.sizeBytes
    byAction.set(item.action, current)
  }
  for (const [action, value] of [...byAction.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`${action}\t${value.count}\t${formatBytes(value.size)}`)
  }
  console.log('')
  console.log('run_id\taction\tcategory\tpriority\tmanual_review\tarchive_candidate\tdelete_allowed\treason')
  for (const item of plan) {
    console.log([
      item.runId,
      item.action,
      item.category,
      item.priority,
      item.manualReviewRequired,
      item.archiveCandidate,
      item.deleteAllowed,
      item.reason,
    ].join('\t'))
  }
}

function printTable(items, currentAuthority) {
  console.log(`release_evidence_inventory current_authority=${currentAuthority || '(not found)'} total=${items.length}`)
  console.log('category\tcount\tsize')
  const byCategory = new Map()
  for (const item of items) {
    const current = byCategory.get(item.category) || { count: 0, size: 0 }
    current.count += 1
    current.size += item.sizeBytes
    byCategory.set(item.category, current)
  }
  for (const [category, value] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`${category}\t${value.count}\t${formatBytes(value.size)}`)
  }
  const dashboardEvidence = items
    .map(item => item.dashboardMetricsSourceEvidence)
    .filter(evidence => evidence.markerPresent)
  const dashboardValid = dashboardEvidence.filter(evidence => evidence.markerValid)
  const dashboardComplete = dashboardEvidence.filter(evidence => evidence.complete)
  console.log('')
  console.log('dashboard_metrics_source_evidence\tcount')
  console.log(`marker_present\t${dashboardEvidence.length}`)
  console.log(`marker_missing\t${items.length - dashboardEvidence.length}`)
  console.log(`marker_valid\t${dashboardValid.length}`)
  console.log(`marker_invalid\t${dashboardEvidence.length - dashboardValid.length}`)
  console.log(`complete\t${dashboardComplete.length}`)
  console.log(`incomplete\t${dashboardValid.length - dashboardComplete.length}`)
  const executiveBriefingEvidence = items.map(item => item.dashboardExecutiveBriefingEvidence)
  const executiveBriefingPresent = executiveBriefingEvidence.filter(evidence => evidence.marker.present)
  const executiveBriefingValid = executiveBriefingPresent.filter(evidence => evidence.marker.valid)
  const executiveBriefingComplete = executiveBriefingValid.filter(evidence => evidence.complete)
  console.log('')
  console.log('dashboard_executive_briefing_evidence\tcount')
  console.log(`marker_present\t${executiveBriefingPresent.length}`)
  console.log(`marker_missing\t${items.length - executiveBriefingPresent.length}`)
  console.log(`marker_valid\t${executiveBriefingValid.length}`)
  console.log(`marker_invalid\t${executiveBriefingPresent.length - executiveBriefingValid.length}`)
  console.log(`complete\t${executiveBriefingComplete.length}`)
  console.log(`incomplete\t${executiveBriefingValid.length - executiveBriefingComplete.length}`)
  console.log(`visual_evidence_complete\t${executiveBriefingValid.filter(evidence => evidence.visualEvidenceCoverageComplete).length}`)
  console.log(`visual_evidence_incomplete\t${executiveBriefingValid.filter(evidence => !evidence.visualEvidenceCoverageComplete).length}`)
  const productPlaneEvidence = items.map(item => item.dashboardProductPlaneEvidence)
  const productPlanePresent = productPlaneEvidence.filter(evidence => evidence.marker.present)
  const productPlaneValid = productPlanePresent.filter(evidence => evidence.marker.valid)
  const productPlaneComplete = productPlaneValid.filter(evidence => evidence.complete)
  console.log('')
  console.log('dashboard_product_plane_evidence\tcount')
  console.log(`marker_present\t${productPlanePresent.length}`)
  console.log(`marker_missing\t${items.length - productPlanePresent.length}`)
  console.log(`marker_valid\t${productPlaneValid.length}`)
  console.log(`marker_invalid\t${productPlanePresent.length - productPlaneValid.length}`)
  console.log(`product_plane_map_present\t${productPlaneValid.filter(evidence => evidence.productPlaneMapPresent).length}`)
  console.log(`product_plane_map_missing\t${productPlaneValid.filter(evidence => !evidence.productPlaneMapPresent).length}`)
  console.log(`complete\t${productPlaneComplete.length}`)
  console.log(`incomplete\t${productPlaneValid.length - productPlaneComplete.length}`)
  console.log(`proofs_complete\t${productPlaneValid.filter(evidence => evidence.proofsComplete).length}`)
  console.log(`proofs_incomplete\t${productPlaneValid.filter(evidence => !evidence.proofsComplete).length}`)
  console.log('')
  console.log('run_id\tcategory\tconfidence\trequired_failures\twarnings\tskipped\tmanual_review\tarchive_candidate\tdelete_allowed\treason')
  for (const item of items) {
    console.log([
      item.runId,
      item.category,
      item.confidence,
      item.requiredFailures,
      item.optionalWarnings,
      item.skipped,
      item.manualReviewRequired,
      item.archiveCandidate,
      item.deleteAllowed,
      item.reason,
    ].join('\t'))
  }
}

if (!existsSync(evidenceDir)) {
  console.error('release-evidence directory does not exist')
  process.exit(1)
}

const currentAuthority = findCurrentAuthority()
const items = readdirSync(evidenceDir)
  .sort()
  .filter(name => statSync(path.join(evidenceDir, name)).isDirectory())
  .map(name => inspectRun(name, currentAuthority))

if (jsonMode) {
  const retentionPlan = items.map(retentionPlanFor)
  console.log(JSON.stringify({
    currentAuthority,
    total: items.length,
    deleteAllowedPolicy: false,
    retentionDryRun: retentionDryRunMode,
    retentionPlan: retentionDryRunMode ? retentionPlan : undefined,
    items,
  }, null, 2))
} else if (retentionDryRunMode) {
  printRetentionDryRun(items, currentAuthority)
} else {
  printTable(items, currentAuthority)
}
