import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080'

  function writeProxyUnavailable(res: any) {
    if (!res || res.headersSent) return
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({
      code: 'BACKEND_UNAVAILABLE',
      message: `前端开发代理无法连接后端服务，请确认后端已启动: ${apiProxyTarget}`,
      data: null,
    }))
  }

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.indexOf('node_modules') === -1) {
              return undefined
            }
            if (id.indexOf('/react/') !== -1 || id.indexOf('/react-dom/') !== -1 || id.indexOf('/react-router-dom/') !== -1) {
              return 'vendor-react'
            }
            if (id.indexOf('/axios/') !== -1) {
              return 'vendor-http'
            }
            return undefined
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          proxyTimeout: 10000,
          timeout: 10000,
          configure(proxy) {
            proxy.on('error', (err, req, res) => {
              const path = req?.url || '/api'
              console.error(`[vite] API proxy unavailable: ${path} -> ${apiProxyTarget}: ${err.message}`)
              writeProxyUnavailable(res)
            })
          },
        },
      },
    },
  }
})
