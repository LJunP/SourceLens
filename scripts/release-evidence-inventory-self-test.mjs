#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname)
const tmpRoot = mkdtempSync(path.join(tmpdir(), 'sourcelens-release-evidence-inventory-'))
const requiredDashboardCases = [
  'recover-dashboard',
  'connect-repository',
  'watch-running-scan',
  'start-first-scan',
  'inspect-code-chunks',
  'review-risk-report',
  'ask-code-qa',
]
const requiredDashboardViewports = ['1440x900', '1024x768', '768x1024', '390x844', '320x740']
const dashboardColumnsByViewport = new Map([
  ['1440x900', 3],
  ['1024x768', 2],
  ['768x1024', 2],
  ['390x844', 1],
  ['320x740', 1],
])
const validProductPlaneProofs = requiredDashboardCases.flatMap(caseKey => (
  requiredDashboardViewports.map(viewport => {
    const columns = dashboardColumnsByViewport.get(viewport)
    return {
      caseKey,
      viewport,
      visible: true,
      planeCount: 3,
      expectedColumns: columns,
      actualColumns: columns,
      expectedColumnsHonored: true,
      copyReadable: true,
      actionCount: 3,
      rbacCompleteClaim: false,
      productionDeploymentClaim: false,
    }
  })
))
const validProductPlaneMap = {
  scope: 'DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY',
  surface: 'FRONT_OFFICE_DEVELOPER_CONSOLE_BACK_OFFICE',
  visible: true,
  planeCount: 3,
  actionCount: 3,
  expectedColumnsHonored: true,
  desktopColumns: true,
  tabletColumns: true,
  tabletPortraitColumns: true,
  mobileColumns: true,
  narrowColumns: true,
  copyReadable: true,
  rbacCompleteClaim: false,
  productionDeploymentClaim: false,
  proofs: validProductPlaneProofs,
}
const dashboardViewportSpecs = [
  { viewport: '1440x900', width: 1440, height: 900, screenshotBytes: 224148 },
  { viewport: '1024x768', width: 1024, height: 768, screenshotBytes: 118292 },
  { viewport: '768x1024', width: 768, height: 1024, screenshotBytes: 125131 },
  { viewport: '390x844', width: 390, height: 844, screenshotBytes: 65892 },
  { viewport: '320x740', width: 320, height: 740, screenshotBytes: 43525 },
]
const validVisualEvidence = dashboardViewportSpecs.map((spec) => {
  const screenshot = `dashboard-next-action-review-risk-report-${spec.viewport}.png`
  return {
    caseKey: 'review-risk-report',
    viewport: spec.viewport,
    screenshot,
    artifact: `dashboard-next-action-ui-smoke/${screenshot}`,
    screenshotBytes: spec.screenshotBytes,
    screenshotWidth: spec.width,
    screenshotHeight: spec.height,
    distinctColorCount: 64,
    panelTop: 80,
    panelLeft: 16,
    panelRight: spec.width - 16,
    panelBottom: spec.height - 16,
    titleTop: 100,
    titleBottom: 160,
    primaryButtonTop: 180,
    primaryButtonBottom: 228,
    primaryButtonTextColor: 'rgb(255, 255, 255)',
  }
})

const validDashboardMarker = {
  viewports: requiredDashboardViewports,
  visitedCases: requiredDashboardCases.flatMap(caseKey => (
    requiredDashboardViewports.map(viewport => `${caseKey}:${viewport}`)
  )),
  productPlaneMap: validProductPlaneMap,
  visualEvidence: validVisualEvidence,
  dashboardStatsApiSignals: {
    sourceLabelSelector: '.sl-dashboard-metrics-source',
    apiBackedCases: [
      'connect-repository',
      'watch-running-scan',
      'start-first-scan',
      'inspect-code-chunks',
      'review-risk-report',
      'ask-code-qa',
    ],
    fallbackCases: ['recover-dashboard'],
    legacyStatsFallbackCase: 'legacy-stats-without-api-fields',
  },
  executiveBriefing: {
    scope: 'DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY',
    signals: ['阶段进度', '质量状态', '风险阻塞', '下一步投入'],
    signalCount: 4,
    expectedColumnsHonored: true,
    desktopColumns: true,
    tabletColumns: true,
    tabletPortraitColumns: true,
    mobileColumns: true,
    narrowColumns: true,
    copyReadable: true,
    actionVisible: true,
    p9CompleteClaim: false,
    rbacCompleteClaim: false,
    productionDeploymentClaim: false,
    commercializationClaim: false,
  },
}

function writeRun(runId, markerPayload) {
  const dir = path.join(tmpRoot, runId)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'manifest.txt'), [
    `run_id: ${runId}`,
    'created_at: 2026-07-07T00:00:00Z',
    'release_evidence_profile: local',
    'release_evidence_profile_schema: 2',
    '',
  ].join('\n'))
  writeFileSync(path.join(dir, 'summary.md'), [
    '# Summary',
    '',
    '- required_failures: `0`',
    '- optional_warnings: `0`',
    '- skipped: `0`',
    '',
  ].join('\n'))
  writeFileSync(path.join(dir, 'status.tsv'), [
    'status\tslug',
    'OK\tdashboard-next-action-ui-smoke',
    '',
  ].join('\n'))
  if (markerPayload) {
    writeFileSync(
      path.join(dir, 'dashboard-next-action-ui-smoke.log'),
      `DASHBOARD_NEXT_ACTION_SMOKE_OK ${JSON.stringify(markerPayload)}\n`,
    )
    for (const item of Array.isArray(markerPayload.visualEvidence) ? markerPayload.visualEvidence : []) {
      if (!item || typeof item.artifact !== 'string' || !Number.isInteger(item.screenshotBytes)) continue
      const artifactPath = path.join(dir, item.artifact)
      mkdirSync(path.dirname(artifactPath), { recursive: true })
      writeFileSync(artifactPath, Buffer.alloc(item.screenshotBytes, 1))
    }
  }
}

function writeDuplicateMarkerRun(runId) {
  writeRun(runId, null)
  const dir = path.join(tmpRoot, runId)
  const marker = `DASHBOARD_NEXT_ACTION_SMOKE_OK ${JSON.stringify(validDashboardMarker)}`
  writeFileSync(path.join(dir, 'dashboard-next-action-ui-smoke.log'), `${marker}\n${marker}\n`)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

try {
  writeRun('dashboard-source-complete', validDashboardMarker)
  writeRun('dashboard-source-incomplete', {
    ...validDashboardMarker,
    dashboardStatsApiSignals: {
      ...validDashboardMarker.dashboardStatsApiSignals,
      legacyStatsFallbackCase: '',
    },
  })
  writeRun('dashboard-source-no-signals', {
    executiveBriefing: validDashboardMarker.executiveBriefing,
  })
  writeRun('dashboard-source-missing-api-cases', {
    ...validDashboardMarker,
    dashboardStatsApiSignals: {
      ...validDashboardMarker.dashboardStatsApiSignals,
      apiBackedCases: undefined,
    },
  })
  writeRun('dashboard-source-missing-selector', {
    ...validDashboardMarker,
    dashboardStatsApiSignals: {
      ...validDashboardMarker.dashboardStatsApiSignals,
      sourceLabelSelector: '',
    },
  })
  writeRun('executive-briefing-missing', {
    dashboardStatsApiSignals: validDashboardMarker.dashboardStatsApiSignals,
  })
  writeRun('executive-briefing-wrong-scope', {
    ...validDashboardMarker,
    executiveBriefing: {
      ...validDashboardMarker.executiveBriefing,
      scope: 'WRONG_SCOPE',
    },
  })
  writeRun('executive-briefing-missing-signal', {
    ...validDashboardMarker,
    executiveBriefing: {
      ...validDashboardMarker.executiveBriefing,
      signals: ['阶段进度', '质量状态', '风险阻塞'],
    },
  })
  writeRun('executive-briefing-tablet-portrait-false', {
    ...validDashboardMarker,
    executiveBriefing: {
      ...validDashboardMarker.executiveBriefing,
      tabletPortraitColumns: false,
    },
  })
  writeRun('executive-briefing-action-hidden', {
    ...validDashboardMarker,
    executiveBriefing: {
      ...validDashboardMarker.executiveBriefing,
      actionVisible: false,
    },
  })
  writeRun('executive-briefing-overclaim', {
    ...validDashboardMarker,
    executiveBriefing: {
      ...validDashboardMarker.executiveBriefing,
      p9CompleteClaim: true,
    },
  })
  writeRun('executive-briefing-missing-viewport', {
    ...validDashboardMarker,
    viewports: requiredDashboardViewports.filter(viewport => viewport !== '768x1024'),
  })
  writeRun('executive-briefing-missing-middle-screenshot', {
    ...validDashboardMarker,
    visualEvidence: validVisualEvidence.filter(item => item.viewport !== '768x1024'),
  })
  writeRun('executive-briefing-duplicate-screenshot', {
    ...validDashboardMarker,
    visualEvidence: [
      ...validVisualEvidence.filter(item => item.viewport !== '768x1024'),
      validVisualEvidence.find(item => item.viewport === '1024x768'),
    ],
  })
  writeRun('product-plane-missing', {
    ...validDashboardMarker,
    productPlaneMap: undefined,
  })
  writeRun('product-plane-wrong-scope', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      scope: 'WRONG_SCOPE',
    },
  })
  writeRun('product-plane-wrong-surface', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      surface: 'WRONG_SURFACE',
    },
  })
  writeRun('product-plane-not-visible', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      visible: false,
    },
  })
  writeRun('product-plane-wrong-plane-count', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      planeCount: 2,
    },
  })
  writeRun('product-plane-wrong-action-count', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      actionCount: 2,
    },
  })
  writeRun('product-plane-layout-false', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      tabletPortraitColumns: false,
    },
  })
  writeRun('product-plane-copy-unreadable', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      copyReadable: false,
    },
  })
  writeRun('product-plane-rbac-overclaim', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      rbacCompleteClaim: true,
    },
  })
  writeRun('product-plane-production-overclaim', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      productionDeploymentClaim: true,
    },
  })
  writeRun('product-plane-missing-proof', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      proofs: validProductPlaneProofs.slice(0, -1),
    },
  })
  writeRun('product-plane-duplicate-proof', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      proofs: [
        ...validProductPlaneProofs.slice(0, -1),
        { ...validProductPlaneProofs[0] },
      ],
    },
  })
  writeRun('product-plane-proof-action-count', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      proofs: validProductPlaneProofs.map((proof, index) => (
        index === 0 ? { ...proof, actionCount: 2 } : proof
      )),
    },
  })
  writeRun('product-plane-proof-columns', {
    ...validDashboardMarker,
    productPlaneMap: {
      ...validProductPlaneMap,
      proofs: validProductPlaneProofs.map(proof => (
        proof.caseKey === 'recover-dashboard' && proof.viewport === '1024x768'
          ? { ...proof, actualColumns: 3 }
          : proof
      )),
    },
  })
  writeRun('dashboard-source-missing', null)
  writeDuplicateMarkerRun('dashboard-source-duplicate')

  const result = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, 'scripts/release-evidence-inventory.mjs'),
      '--evidence-dir',
      tmpRoot,
      '--json',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  assert(result.status === 0, `inventory command failed: ${result.stderr || result.stdout}`)
  const payload = JSON.parse(result.stdout)
  const tableResult = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, 'scripts/release-evidence-inventory.mjs'),
      '--evidence-dir',
      tmpRoot,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  assert(tableResult.status === 0, `inventory table command failed: ${tableResult.stderr || tableResult.stdout}`)
  assert(
    tableResult.stdout.includes('dashboard_executive_briefing_evidence\tcount'),
    'inventory table should include an independent dashboard executive briefing summary',
  )
  assert(
    tableResult.stdout.includes('dashboard_product_plane_evidence\tcount'),
    'inventory table should include an independent dashboard product plane summary',
  )
  const byRunId = new Map(payload.items.map(item => [item.runId, item.dashboardMetricsSourceEvidence]))
  const executiveByRunId = new Map(payload.items.map(item => [item.runId, item.dashboardExecutiveBriefingEvidence]))
  const productPlaneByRunId = new Map(payload.items.map(item => [item.runId, item.dashboardProductPlaneEvidence]))

  const complete = byRunId.get('dashboard-source-complete')
  assert(complete?.markerPresent === true, 'complete run should report markerPresent=true')
  assert(complete?.markerValid === true, 'complete run should report markerValid=true')
  assert(complete?.complete === true, 'complete run should report complete=true')
  assert(complete?.apiBackedCases?.length === 6, 'complete run should report six API-backed cases')
  assert(complete?.fallbackCases?.includes('recover-dashboard'), 'complete run should report recover-dashboard fallback')
  assert(
    complete?.legacyStatsFallbackCase === 'legacy-stats-without-api-fields',
    'complete run should report legacy stats fallback case',
  )

  const productPlaneComplete = productPlaneByRunId.get('dashboard-source-complete')
  assert(productPlaneComplete?.marker?.name === 'DASHBOARD_NEXT_ACTION_SMOKE_OK', 'product plane evidence should name its marker')
  assert(productPlaneComplete?.marker?.present === true, 'product plane complete run should report marker present')
  assert(productPlaneComplete?.marker?.valid === true, 'product plane complete run should report marker valid')
  assert(productPlaneComplete?.productPlaneMapPresent === true, 'product plane complete run should report map present')
  assert(productPlaneComplete?.fields?.planeCount === 3, 'product plane complete run should expose planeCount=3')
  assert(productPlaneComplete?.fields?.actionCount === 3, 'product plane complete run should expose numeric actionCount=3')
  assert(productPlaneComplete?.fields?.proofs?.length === 35, 'product plane complete run should expose 35 proofs')
  assert(
    new Set(productPlaneComplete.fields.proofs.map(proof => `${proof.caseKey}:${proof.viewport}`)).size === 35,
    'product plane complete run should expose 35 unique case/viewport proofs',
  )
  assert(
    productPlaneComplete.fields.proofs.every(proof => (
      proof.expectedColumns === dashboardColumnsByViewport.get(proof.viewport)
      && proof.actualColumns === dashboardColumnsByViewport.get(proof.viewport)
    )),
    'product plane complete run should preserve the 3/2/2/1/1 viewport column contract',
  )
  assert(productPlaneComplete?.proofCoverageComplete === true, 'product plane complete run should cover every case/viewport proof')
  assert(productPlaneComplete?.proofsComplete === true, 'product plane complete run should report proofsComplete=true')
  assert(Object.values(productPlaneComplete?.checks || {}).every(Boolean), 'product plane complete run should pass every field and proof check')
  assert(productPlaneComplete?.complete === true, 'product plane complete run should report complete=true')
  assert(
    productPlaneComplete?.reason === 'dashboard product plane evidence complete',
    'product plane complete run should report its explicit completion reason',
  )

  const incomplete = byRunId.get('dashboard-source-incomplete')
  assert(incomplete?.markerPresent === true, 'incomplete run should report markerPresent=true')
  assert(incomplete?.complete === false, 'incomplete run should report complete=false')
  assert(incomplete?.legacyFallbackComplete === false, 'incomplete run should report legacyFallbackComplete=false')

  const noSignals = byRunId.get('dashboard-source-no-signals')
  assert(noSignals?.markerPresent === true, 'no-signals run should report markerPresent=true')
  assert(noSignals?.markerValid === true, 'no-signals run should report markerValid=true')
  assert(noSignals?.complete === false, 'no-signals run should report complete=false')
  assert(noSignals?.reason === 'dashboardStatsApiSignals missing', 'no-signals run should report missing signals reason')

  const missingApiCases = byRunId.get('dashboard-source-missing-api-cases')
  assert(missingApiCases?.markerPresent === true, 'missing API cases run should report markerPresent=true')
  assert(missingApiCases?.apiBackedComplete === false, 'missing API cases run should report apiBackedComplete=false')
  assert(missingApiCases?.fallbackComplete === true, 'missing API cases run should preserve fallbackComplete=true')
  assert(missingApiCases?.legacyFallbackComplete === true, 'missing API cases run should preserve legacyFallbackComplete=true')
  assert(missingApiCases?.complete === false, 'missing API cases run should report complete=false')

  const missingSelector = byRunId.get('dashboard-source-missing-selector')
  assert(missingSelector?.markerPresent === true, 'missing selector run should report markerPresent=true')
  assert(missingSelector?.sourceLabelSelector === '', 'missing selector run should expose empty selector')
  assert(missingSelector?.apiBackedComplete === true, 'missing selector run should preserve apiBackedComplete=true')
  assert(missingSelector?.complete === false, 'missing selector run should report complete=false')

  const missing = byRunId.get('dashboard-source-missing')
  assert(missing?.markerPresent === false, 'missing run should report markerPresent=false')
  assert(missing?.complete === false, 'missing run should report complete=false')

  const duplicate = byRunId.get('dashboard-source-duplicate')
  assert(duplicate?.markerPresent === true, 'duplicate run should report markerPresent=true')
  assert(duplicate?.markerValid === false, 'duplicate run should report markerValid=false')
  assert(duplicate?.reason === 'multiple markers found', 'duplicate run should report multiple markers reason')

  const executiveComplete = executiveByRunId.get('dashboard-source-complete')
  assert(executiveComplete?.marker?.name === 'DASHBOARD_NEXT_ACTION_SMOKE_OK', 'executive evidence should name its marker')
  assert(executiveComplete?.marker?.present === true, 'executive complete run should report marker present')
  assert(executiveComplete?.marker?.valid === true, 'executive complete run should report marker valid')
  assert(executiveComplete?.fields?.signalCount === 4, 'executive complete run should expose signalCount=4')
  assert(executiveComplete?.fields?.tabletPortraitColumns === true, 'executive complete run should expose tablet portrait evidence')
  assert(executiveComplete?.viewportCoverageComplete === true, 'executive complete run should prove all five viewport visits')
  assert(executiveComplete?.checks?.viewportCoverageComplete === true, 'viewport coverage should be an explicit passing check')
  assert(executiveComplete?.visualEvidenceCoverageComplete === true, 'executive complete run should prove five archived screenshots')
  assert(executiveComplete?.checks?.visualEvidenceCoverageComplete === true, 'screenshot coverage should be an explicit passing check')
  assert(executiveComplete?.fields?.visualEvidence?.length === 5, 'executive complete run should expose five screenshot records')
  assert(executiveComplete.fields.visualEvidence.every(item => item.valid), 'every valid screenshot record should pass inventory checks')
  assert(Object.values(executiveComplete?.checks || {}).every(Boolean), 'executive complete run should pass every field check')
  assert(executiveComplete?.complete === true, 'executive complete run should report complete=true')

  const executiveMissing = executiveByRunId.get('executive-briefing-missing')
  assert(executiveMissing?.marker?.valid === true, 'missing executiveBriefing should preserve marker validity')
  assert(executiveMissing?.complete === false, 'missing executiveBriefing must be incomplete')
  assert(executiveMissing?.reason === 'executiveBriefing missing', 'missing executiveBriefing should report an explicit reason')

  const wrongScope = executiveByRunId.get('executive-briefing-wrong-scope')
  assert(wrongScope?.checks?.scope === false, 'wrong scope should fail scope check')
  assert(wrongScope?.complete === false, 'wrong scope must be incomplete')

  const missingSignal = executiveByRunId.get('executive-briefing-missing-signal')
  assert(missingSignal?.checks?.signals === false, 'missing signal should fail signals check')
  assert(missingSignal?.complete === false, 'missing signal must be incomplete')

  const tabletPortraitFalse = executiveByRunId.get('executive-briefing-tablet-portrait-false')
  assert(tabletPortraitFalse?.checks?.tabletPortraitColumns === false, 'tablet portrait false should fail its field check')
  assert(tabletPortraitFalse?.complete === false, 'tablet portrait false must be incomplete')

  const actionHidden = executiveByRunId.get('executive-briefing-action-hidden')
  assert(actionHidden?.checks?.actionVisible === false, 'hidden action should fail actionVisible check')
  assert(actionHidden?.complete === false, 'hidden action must be incomplete')

  const overclaim = executiveByRunId.get('executive-briefing-overclaim')
  assert(overclaim?.fields?.p9CompleteClaim === true, 'overclaim run should expose the forged claim')
  assert(overclaim?.checks?.p9CompleteClaim === false, 'overclaim should fail the p9CompleteClaim check')
  assert(overclaim?.complete === false, 'overclaim must be incomplete')

  const missingViewport = executiveByRunId.get('executive-briefing-missing-viewport')
  assert(missingViewport?.viewportCoverageComplete === false, 'missing viewport should fail viewport coverage')
  assert(missingViewport?.checks?.viewportCoverageComplete === false, 'missing viewport should fail its field check')
  assert(missingViewport?.complete === false, 'missing viewport must be incomplete')

  const missingMiddleScreenshot = executiveByRunId.get('executive-briefing-missing-middle-screenshot')
  assert(missingMiddleScreenshot?.viewportCoverageComplete === true, 'missing screenshot should preserve visited-case viewport coverage')
  assert(missingMiddleScreenshot?.visualEvidenceCoverageComplete === false, 'missing middle screenshot should fail screenshot coverage')
  assert(missingMiddleScreenshot?.checks?.visualEvidenceCoverageComplete === false, 'missing middle screenshot should fail its explicit check')
  assert(missingMiddleScreenshot?.complete === false, 'missing middle screenshot must be incomplete')

  const duplicateScreenshot = executiveByRunId.get('executive-briefing-duplicate-screenshot')
  assert(duplicateScreenshot?.viewportCoverageComplete === true, 'duplicate screenshot should preserve visited-case viewport coverage')
  assert(duplicateScreenshot?.visualEvidenceCoverageComplete === false, 'duplicate screenshot should fail screenshot coverage')
  assert(duplicateScreenshot?.fields?.visualEvidence?.some(item => item.duplicateViewport), 'duplicate screenshot should be exposed in inventory fields')
  assert(duplicateScreenshot?.complete === false, 'duplicate screenshot must be incomplete')

  const missingProductPlaneMap = productPlaneByRunId.get('product-plane-missing')
  assert(missingProductPlaneMap?.marker?.valid === true, 'missing productPlaneMap should preserve marker validity')
  assert(missingProductPlaneMap?.productPlaneMapPresent === false, 'missing productPlaneMap should report map absent')
  assert(missingProductPlaneMap?.complete === false, 'missing productPlaneMap must be incomplete')
  assert(missingProductPlaneMap?.reason === 'productPlaneMap missing', 'missing productPlaneMap should report an explicit reason')

  const assertProductPlaneCheckFailure = (runId, check, expectedReason) => {
    const evidence = productPlaneByRunId.get(runId)
    assert(evidence?.productPlaneMapPresent === true, `${runId} should preserve productPlaneMap presence`)
    assert(evidence?.checks?.[check] === false, `${runId} should fail ${check}`)
    assert(evidence?.complete === false, `${runId} must be incomplete`)
    assert(evidence?.reason === expectedReason, `${runId} should report exact incomplete reason`)
    return evidence
  }

  assertProductPlaneCheckFailure(
    'product-plane-wrong-scope',
    'scope',
    'dashboard product plane evidence incomplete: scope',
  )
  assertProductPlaneCheckFailure(
    'product-plane-wrong-surface',
    'surface',
    'dashboard product plane evidence incomplete: surface',
  )
  assertProductPlaneCheckFailure(
    'product-plane-not-visible',
    'visible',
    'dashboard product plane evidence incomplete: visible',
  )
  assertProductPlaneCheckFailure(
    'product-plane-wrong-plane-count',
    'planeCount',
    'dashboard product plane evidence incomplete: planeCount',
  )
  assertProductPlaneCheckFailure(
    'product-plane-wrong-action-count',
    'actionCount',
    'dashboard product plane evidence incomplete: actionCount',
  )
  assertProductPlaneCheckFailure(
    'product-plane-layout-false',
    'tabletPortraitColumns',
    'dashboard product plane evidence incomplete: tabletPortraitColumns',
  )
  assertProductPlaneCheckFailure(
    'product-plane-copy-unreadable',
    'copyReadable',
    'dashboard product plane evidence incomplete: copyReadable',
  )
  const rbacOverclaim = assertProductPlaneCheckFailure(
    'product-plane-rbac-overclaim',
    'rbacCompleteClaim',
    'dashboard product plane evidence incomplete: rbacCompleteClaim',
  )
  assert(rbacOverclaim?.fields?.rbacCompleteClaim === true, 'RBAC overclaim should remain visible in inventory fields')
  const productionOverclaim = assertProductPlaneCheckFailure(
    'product-plane-production-overclaim',
    'productionDeploymentClaim',
    'dashboard product plane evidence incomplete: productionDeploymentClaim',
  )
  assert(
    productionOverclaim?.fields?.productionDeploymentClaim === true,
    'production overclaim should remain visible in inventory fields',
  )

  const missingProof = productPlaneByRunId.get('product-plane-missing-proof')
  assert(missingProof?.checks?.proofCount === false, 'missing proof should fail proofCount')
  assert(missingProof?.checks?.proofCoverageComplete === false, 'missing proof should fail proof coverage')
  assert(missingProof?.checks?.proofsComplete === false, 'missing proof should fail proofsComplete')
  assert(missingProof?.complete === false, 'missing proof must be incomplete')
  assert(
    missingProof?.reason === 'dashboard product plane evidence incomplete: proofCount, proofCoverageComplete, proofsComplete',
    'missing proof should report exact incomplete reasons',
  )

  const duplicateProof = productPlaneByRunId.get('product-plane-duplicate-proof')
  assert(duplicateProof?.checks?.proofCount === true, 'duplicate proof fixture should preserve the expected proof count')
  assert(duplicateProof?.checks?.proofCombinationsUnique === false, 'duplicate proof should fail uniqueness')
  assert(duplicateProof?.checks?.proofCoverageComplete === false, 'duplicate proof should fail proof coverage')
  assert(duplicateProof?.fields?.proofs?.some(proof => proof.duplicateCombination), 'duplicate proof should be exposed in inventory fields')
  assert(duplicateProof?.complete === false, 'duplicate proof must be incomplete')
  assert(
    duplicateProof?.reason === 'dashboard product plane evidence incomplete: proofCombinationsUnique, proofCoverageComplete, proofsComplete',
    'duplicate proof should report exact incomplete reasons',
  )

  assertProductPlaneCheckFailure(
    'product-plane-proof-action-count',
    'proofActionCount',
    'dashboard product plane evidence incomplete: proofActionCount, proofsComplete',
  )
  assertProductPlaneCheckFailure(
    'product-plane-proof-columns',
    'proofColumns',
    'dashboard product plane evidence incomplete: proofColumns, proofsComplete',
  )

  const executiveMarkerMissing = executiveByRunId.get('dashboard-source-missing')
  assert(executiveMarkerMissing?.marker?.present === false, 'executive evidence should detect a missing marker')
  assert(executiveMarkerMissing?.complete === false, 'missing marker must be incomplete')

  const executiveMarkerDuplicate = executiveByRunId.get('dashboard-source-duplicate')
  assert(executiveMarkerDuplicate?.marker?.present === true, 'executive evidence should detect duplicate marker presence')
  assert(executiveMarkerDuplicate?.marker?.valid === false, 'duplicate marker must be invalid')
  assert(executiveMarkerDuplicate?.complete === false, 'duplicate marker must be incomplete')
  assert(executiveMarkerDuplicate?.reason === 'multiple markers found', 'duplicate marker should report an explicit reason')

  const productPlaneMarkerMissing = productPlaneByRunId.get('dashboard-source-missing')
  assert(productPlaneMarkerMissing?.marker?.present === false, 'product plane evidence should detect a missing marker')
  assert(productPlaneMarkerMissing?.complete === false, 'missing product plane marker must be incomplete')

  const productPlaneMarkerDuplicate = productPlaneByRunId.get('dashboard-source-duplicate')
  assert(productPlaneMarkerDuplicate?.marker?.present === true, 'product plane evidence should detect duplicate marker presence')
  assert(productPlaneMarkerDuplicate?.marker?.valid === false, 'duplicate product plane marker must be invalid')
  assert(productPlaneMarkerDuplicate?.complete === false, 'duplicate product plane marker must be incomplete')
  assert(productPlaneMarkerDuplicate?.reason === 'multiple markers found', 'duplicate product plane marker should report an explicit reason')

  console.log('RELEASE_EVIDENCE_INVENTORY_SELF_TEST_OK dashboardMetricsSourceEvidence=covered dashboardExecutiveBriefingEvidence=covered dashboardProductPlaneEvidence=covered')
} finally {
  rmSync(tmpRoot, { recursive: true, force: true })
}
