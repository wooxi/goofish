import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_DEV_SERVER_PORT || 8002)
  const devApiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8001'

  return {
    plugins: [vue()],
    server: {
      port: Number.isFinite(devPort) ? devPort : 8002,
      host: '0.0.0.0',
      strictPort: false,
      proxy: {
        '/api': {
          target: devApiProxyTarget,
          changeOrigin: true,
        },
        '/health': {
          target: devApiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return

            if (id.includes('/node_modules/vue/') || id.includes('/node_modules/@vue/')) {
              return 'vendor-vue'
            }

            if (id.includes('/node_modules/element-plus/') || id.includes('/node_modules/@element-plus/')) {
              return 'vendor-element-plus'
            }

            if (id.includes('/node_modules/xlsx/')) {
              return 'vendor-xlsx'
            }

            if (id.includes('/node_modules/lodash') || id.includes('/node_modules/dayjs') || id.includes('/node_modules/axios')) {
              return 'vendor-utils'
            }

            return 'vendor-misc'
          },
        },
      },
    },
  }
})
