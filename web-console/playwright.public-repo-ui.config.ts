import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.SL_PUBLIC_REPO_UI_PORT || 5184)
const baseURL = process.env.SL_PUBLIC_REPO_UI_BASE_URL || `http://127.0.0.1:${port}`
const apiProxyTarget = (process.env.SL_PUBLIC_REPO_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
const useExternalServer = Boolean(process.env.SL_PUBLIC_REPO_UI_BASE_URL)

export default defineConfig({
  testDir: './tests',
  testMatch: /public-repo-ui-smoke\.spec\.ts/,
  timeout: 300_000,
  expect: {
    timeout: 30_000,
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
        command: `VITE_API_PROXY_TARGET=${apiProxyTarget} npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 45_000,
      },
})
