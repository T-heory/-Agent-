<script setup lang="ts">
/**
 * 后台主布局：左侧菜单 + 顶栏 + 内容区。
 * 菜单从路由表生成（单一数据源），折叠状态存 Pinia 并持久化。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { menuRoutes } from '@/router/routes'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { confirmDanger, showSuccess } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

/** 当前高亮菜单：直接用路径，与 el-menu 的 index 保持一致 */
const activeMenu = computed(() => route.path)

/** 面包屑：首页 / 系统管理 / 用户管理（只取有 title 的匹配记录） */
const breadcrumbs = computed(() =>
  route.matched
    .filter((item) => Boolean(item.meta?.title))
    .map((item) => ({ title: item.meta.title as string, path: item.path })),
)

const avatarText = computed(() => (userStore.displayName || '?').slice(0, 1).toUpperCase())

async function handleCommand(command: string): Promise<void> {
  if (command === 'profile') {
    await router.push('/profile')
    return
  }
  if (command === 'logout') {
    const confirmed = await confirmDanger('退出后需要重新登录，确认退出当前账号？', {
      title: '退出登录',
      confirmText: '退出登录',
    })
    if (!confirmed) return
    userStore.logout()
    showSuccess('已退出登录')
    await router.replace('/login')
  }
}
</script>

<template>
  <el-container class="layout">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="layout-aside">
      <div class="layout-logo">
        <el-icon :size="22" color="#409eff"><Grid /></el-icon>
        <span v-show="!appStore.sidebarCollapsed" class="layout-logo__text">辰光Agent</span>
      </div>

      <el-scrollbar class="layout-menu-wrap">
        <el-menu
          :default-active="activeMenu"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          unique-opened
          router
          class="layout-menu"
        >
          <template v-for="item in menuRoutes" :key="item.path">
            <el-sub-menu v-if="item.children && item.children.length" :index="`/${item.path}`">
              <template #title>
                <el-icon><component :is="item.meta?.icon ?? 'Menu'" /></el-icon>
                <span>{{ item.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in item.children"
                :key="child.path"
                :index="`/${item.path}/${child.path}`"
              >
                <el-icon><component :is="child.meta?.icon ?? 'Document'" /></el-icon>
                <template #title>{{ child.meta?.title }}</template>
              </el-menu-item>
            </el-sub-menu>

            <el-menu-item v-else :index="`/${item.path}`">
              <el-icon><component :is="item.meta?.icon ?? 'Document'" /></el-icon>
              <template #title>{{ item.meta?.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container class="layout-body">
      <el-header height="56px" class="layout-header">
        <div class="layout-header__left">
          <el-button text class="layout-collapse" @click="appStore.toggleSidebar">
            <el-icon :size="18">
              <Expand v-if="appStore.sidebarCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="layout-header__right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="layout-user">
              <span class="layout-user__avatar">{{ avatarText }}</span>
              <span class="layout-user__name">
                {{ userStore.displayName || '加载中…' }}
              </span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><UserFilled /></el-icon>
                  <span>个人中心</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <div class="layout-main__inner">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
}

.layout-aside {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.2s;
}

.layout-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 56px;
  flex-shrink: 0;
  border-bottom: 1px solid #e4e7ed;
  overflow: hidden;
}

.layout-logo__text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.layout-menu-wrap {
  flex: 1;
  min-height: 0;
}

.layout-menu {
  border-right: none;
}

.layout-body {
  min-width: 0;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.layout-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.layout-header__right {
  display: flex;
  align-items: center;
}

.layout-collapse {
  padding: 4px;
}

.layout-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}

.layout-user__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #409eff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.layout-user__name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.layout-main {
  padding: 16px;
  background-color: #f5f7fa;
  overflow: auto;
}

.layout-main__inner {
  min-width: 992px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
}
</style>
