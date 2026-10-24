import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginPayload, UserRead } from '@/api/types'
import { login as loginApi } from '@/api/auth'
import { getCurrentUser } from '@/api/user'
import { clearToken, getToken, setToken } from '@/utils/auth'

/**
 * 登录态 store。
 * token 是唯一真相（持久化在 localStorage.cg_token），profile 只做内存缓存，
 * 刷新页面后由路由守卫调 fetchProfile() 重新拉取。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken())
  const profile = ref<UserRead | null>(null)
  const profileLoaded = ref(false)

  /** 并发去重：守卫和 Layout 可能同时要 profile，只发一次请求 */
  let pendingProfile: Promise<UserRead> | null = null

  const isLoggedIn = computed(() => Boolean(token.value))
  const displayName = computed(() => profile.value?.username ?? '')

  async function fetchProfile(force = false): Promise<UserRead> {
    if (!force && profile.value) return profile.value
    if (pendingProfile) return pendingProfile

    pendingProfile = (async () => {
      try {
        const data = await getCurrentUser()
        profile.value = data
        profileLoaded.value = true
        return data
      } finally {
        pendingProfile = null
      }
    })()
    return pendingProfile
  }

  /** 登录：拿 token → 立即拉一次 profile（登录响应不含用户信息） */
  async function login(payload: LoginPayload, silent = false): Promise<void> {
    const res = await loginApi(payload, silent)
    token.value = res.access_token
    setToken(res.access_token)
    profileLoaded.value = false
    await fetchProfile(true)
  }

  /** 只清本地状态，不发请求（后端没有 logout 接口） */
  function reset(): void {
    token.value = ''
    profile.value = null
    profileLoaded.value = false
    clearToken()
  }

  function logout(): void {
    reset()
  }

  return {
    token,
    profile,
    profileLoaded,
    isLoggedIn,
    displayName,
    fetchProfile,
    login,
    reset,
    logout,
  }
})
