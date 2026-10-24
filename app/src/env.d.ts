/// <reference types="vite/client" />

/** 自定义环境变量（与 .env.development / .env.production 保持一致） */
interface ImportMetaEnv {
  /** 浏览器标题、登录页品牌文案 */
  readonly VITE_APP_TITLE: string
  /** 接口基础路径，默认 /api/v1 */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 构建期由 vite.config.ts 的 define 注入，值取自 package.json 的 version */
declare const __APP_VERSION__: string
