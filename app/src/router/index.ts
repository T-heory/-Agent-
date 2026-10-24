import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * 全局前置守卫：
 * 1. 不需要登录的页面（登录页 / 404）直接放行；已登录访问登录页则回工作台
 * 2. 需要登录但没 token → /login?redirect=原目标
 * 3. 有 token 但 profile 未加载（刷新页面后）→ 先拉一次 /users/me
 * 4. 同步浏览器标题
 */
router.beforeEach(async (to) => {
  const appTitle = import.meta.env.VITE_APP_TITLE || '辰光Agent 管理后台'
  document.title = to.meta.title ? `${to.meta.title} · ${appTitle}` : appTitle

  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (!requiresAuth) {
    if (to.name === 'Login' && userStore.token) {
      return { path: '/dashboard' }
    }
    return true
  }

  if (!userStore.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!userStore.profileLoaded) {
    try {
      await userStore.fetchProfile()
    } catch {
      // token 失效 / 账号被禁用：清掉本地状态回登录页
      userStore.reset()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  return true
})

export default router
