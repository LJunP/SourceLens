import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.SL_UI_SMOKE_PORT || 5192)
const baseURL = process.env.SL_UI_SMOKE_BASE_URL || `http://127.0.0.1:${port}`
const useExternalServer = Boolean(process.env.SL_UI_SMOKE_BASE_URL)

export default defineConfig({
  testDir: './tests',
  testMatch: /audit-logs-detail-selection-smoke\.spec\.ts/,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'zh-CN',
    trace: 'retain-on-failure',
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 45_000,
      },
})
