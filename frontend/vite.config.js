import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8002,
    host: '0.0.0.0',
    strictPort: false,
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

          if (id.includes('/node_modules/ant-design-vue/') || id.includes('/node_modules/@ant-design/')) {
            return 'vendor-antdv'
          }

          if (id.includes('/node_modules/lodash') || id.includes('/node_modules/dayjs') || id.includes('/node_modules/axios')) {
            return 'vendor-utils'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})
