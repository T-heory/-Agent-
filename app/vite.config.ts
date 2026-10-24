import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'

// 工作台「系统信息」要展示前端版本，构建期从 package.json 注入，避免在页面里硬编码
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue(),
    // 自动导入 Vue / Vue Router / Pinia 的 API（ref、computed、useRouter 等），
    // 同时自动导入 ElMessage、ElMessageBox 这类"函数式"组件的样式
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts',
      eslintrc: { enabled: false },
    }),
    // 组件按需注册：模板里写 <el-button> 会自动引入并带上对应样式，
    // 同时自动注册 src/components 下的自有组件
    Components({
      resolvers: [ElementPlusResolver()],
      dirs: ['src/components'],
      dts: 'src/types/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 后端 src/main.py 没有配 CORS，浏览器直连会被拦，
    // 所以开发期统一走代理，把 /api 转发到 FastAPI
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // 预览构建产物（npm run preview）时同样需要代理，否则 /api 会打到 4173 自己身上
  preview: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
