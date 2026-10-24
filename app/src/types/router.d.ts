import 'vue-router'

/**
 * 路由 meta 类型增强。
 * perm 是预留位：后端目前没有「当前用户权限」接口，守卫不校验它（详见说明书 11.3 第 7 条）。
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 浏览器标题 / 面包屑 / 菜单文案 */
    title?: string
    /** Element Plus 图标组件名（已全局注册） */
    icon?: string
    /** 是否需要登录，默认 true */
    requiresAuth?: boolean
    /** 预留的权限编码，如 user:list */
    perm?: string
    /** 不在侧边栏菜单中展示 */
    hidden?: boolean
  }
}
