import { http } from './request'
import type { LoginPayload, TokenResponse } from './types'

/**
 * 登录：返回 access_token（响应不含用户信息，需再调 /users/me）。
 * silent=true 时拦截器不弹全局提示，由登录页把错误文案展示在表单里。
 */
export function login(payload: LoginPayload, silent = false) {
  return http.post<TokenResponse>('/auth/login', payload, { silent })
}
