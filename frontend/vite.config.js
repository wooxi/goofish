import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8002,
    host: '0.0.0.0',  // 允许远程访问
    strictPort: false // 端口被占用时自动使用下一个可用端口
  }
})
