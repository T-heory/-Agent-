/**
 * token 读写。项目约定：只存 localStorage，key 固定 cg_token。
 * 不放 sessionStorage（刷新即丢）、不放 Cookie（后端没有 CSRF / Cookie 方案）。
 */
const TOKEN_KEY = 'cg_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
