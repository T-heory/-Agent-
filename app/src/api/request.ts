/**
 * axios 实例 + 拦截器。
 *
 * 本项目后端有四种响应形态，必须分别处理（详见说明书 9.4）：
 *   A 成功        HTTP 200 + {code:200,...}
 *   B 业务异常    HTTP 200 + {code:400/401/10001,...}   ← 状态码仍是 200！
 *   C 参数校验    HTTP 422 + {detail:[{loc,msg,type}]}
 *   D 未捕获异常  HTTP 500 + {code:500,message:"服务器内部错误"}
 *
 * 因此：判断成功只能看 body.code === 200；成功时只把 data 抛给业务层。
 */
import axios, { AxiosError } from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { clearToken, getToken } from '@/utils/auth'
import { resolveMessage, showError } from '@/utils/message'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * 为 true 时拦截器不弹全局错误提示，由调用方自己在页面上展示。
     * 用于登录页这类「错误要展示在表单里」的场景，避免同时弹 toast 和页面提示。
     */
    silent?: boolean
  }
}

/** 422 校验错误里字段名 → 中文标签，用于拼「用户名: 不能为空」这种可读文案 */
const FIELD_LABELS: Record<string, string> = {
  username: '用户名',
  email: '邮箱',
  password: '密码',
  captcha_key: '验证码标识',
  captcha_code: '验证码',
  code: '编码',
  name: '名称',
  description: '描述',
  page: '页码',
  page_size: '每页条数',
  role_ids: '角色',
  permission_ids: '权限',
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

/* ---------------- 401 统一处理 ---------------- */

/** 由 main.ts 注入，避免 request.ts 反向依赖 router / store 造成循环引用 */
let unauthorizedHandler: (() => void) | null = null
/** 防抖：并发 3 个请求同时 401 时，只提示一次、只跳一次 */
let handlingUnauthorized = false

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

function handleUnauthorized(): void {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  clearToken()
  showError('登录状态已失效，请重新登录')
  unauthorizedHandler?.()
  window.setTimeout(() => {
    handlingUnauthorized = false
  }, 1500)
}

/* ---------------- 请求拦截 ---------------- */

service.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* ---------------- 响应拦截 ---------------- */

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data
    // 非统一响应体（例如文件流、纯文本）直接放行，避免误判
    if (!body || typeof body !== 'object' || !('code' in body)) {
      return body as unknown as AxiosResponse
    }
    if (body.code === 200) {
      // 只把业务数据抛给业务层：页面拿到的直接是 data
      return body.data as unknown as AxiosResponse
    }
    if (body.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error('未登录或登录已过期'))
    }
    const message = resolveMessage(body)
    if (!response.config.silent) {
      showError(message)
    }
    return Promise.reject(new Error(message))
  },
  (error: AxiosError) => {
    // 主动取消 / 组件卸载时的取消请求不提示
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const silent = Boolean(error.config?.silent)
    const status = error.response?.status
    const payload = error.response?.data as
      | { detail?: Array<{ loc?: Array<string | number>; msg?: string }>; code?: number; message?: string }
      | undefined

    if (status === 401) {
      handleUnauthorized()
      return Promise.reject(new Error('未登录或登录已过期'))
    }

    if (status === 422) {
      const first = payload?.detail?.[0]
      const loc = (first?.loc ?? []).filter(
        (item, index) => !(index === 0 && (item === 'body' || item === 'query' || item === 'path')),
      )
      const field = loc.map((item) => FIELD_LABELS[String(item)] ?? String(item)).join('.')
      const message = field ? `${field}: ${first?.msg ?? '参数不合法'}` : (first?.msg ?? '参数校验失败')
      if (!silent) showError(message)
      return Promise.reject(new Error(message))
    }

    if (status === 500) {
      const message = '服务器内部错误，请稍后重试'
      if (!silent) showError(message)
      return Promise.reject(new Error(message))
    }

    if (payload?.code) {
      const message = resolveMessage(payload)
      if (!silent) showError(message)
      return Promise.reject(new Error(message))
    }

    const message =
      error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        ? '请求超时，请检查网络或后端服务'
        : '网络异常，请检查后端服务是否启动'
    if (!silent) showError(message)
    return Promise.reject(new Error(message))
  },
)

/* ---------------- 对外泛型封装 ---------------- */

/**
 * 拦截器已经把 {code,message,data} 解包成 data，
 * 所以这里的返回类型直接是业务数据类型 T，而不是 AxiosResponse<T>。
 */
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config) as unknown as Promise<T>
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config) as unknown as Promise<T>
  },
}

export default service
