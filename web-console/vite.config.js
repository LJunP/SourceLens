import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    var apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080';
    function writeProxyUnavailable(res) {
        if (!res || res.headersSent)
            return;
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            code: 'BACKEND_UNAVAILABLE',
            message: "\u524D\u7AEF\u5F00\u53D1\u4EE3\u7406\u65E0\u6CD5\u8FDE\u63A5\u540E\u7AEF\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u542F\u52A8: ".concat(apiProxyTarget),
            data: null,
        }));
    }
    return {
        plugins: [react()],
        build: {
            rollupOptions: {
                output: {
                    manualChunks: function (id) {
                        if (id.indexOf('node_modules') === -1) {
                            return undefined;
                        }
                        if (id.indexOf('/react/') !== -1 || id.indexOf('/react-dom/') !== -1 || id.indexOf('/react-router-dom/') !== -1) {
                            return 'vendor-react';
                        }
                        if (id.indexOf('/axios/') !== -1) {
                            return 'vendor-http';
                        }
                        return undefined;
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
                    configure: function (proxy) {
                        proxy.on('error', function (err, req, res) {
                            var path = (req === null || req === void 0 ? void 0 : req.url) || '/api';
                            console.error("[vite] API proxy unavailable: ".concat(path, " -> ").concat(apiProxyTarget, ": ").concat(err.message));
                            writeProxyUnavailable(res);
                        });
                    },
                },
            },
        },
    };
});
