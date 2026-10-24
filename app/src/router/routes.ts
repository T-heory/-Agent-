import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由表（唯一数据源：侧边栏菜单、面包屑都从这里生成，不另外维护菜单文件）。
 * meta 约定见 src/types/router.d.ts。
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Odometer', requiresAuth: true },
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/users',
        meta: { title: '系统管理', icon: 'Setting', requiresAuth: true },
        children: [
          {
            path: 'users',
            name: 'UserManage',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理', icon: 'User', perm: 'user:list' },
          },
          {
            path: 'roles',
            name: 'RoleManage',
            component: () => import('@/views/system/role/index.vue'),
            meta: { title: '角色管理', icon: 'Avatar', perm: 'role:list' },
          },
          {
            path: 'permissions',
            name: 'PermissionManage',
            component: () => import('@/views/system/permission/index.vue'),
            meta: { title: '权限管理', icon: 'Key', perm: 'permission:list' },
          },
        ],
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'UserFilled', hidden: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', requiresAuth: false },
  },
]

/** 布局路由的子路由 = 侧边栏菜单数据（hidden 的不进菜单） */
const layoutRoute = routes.find((route) => route.path === '/')
export const menuRoutes = (layoutRoute?.children ?? []).filter((route) => !route.meta?.hidden)
