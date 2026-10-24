import { ref } from 'vue'
import { defineStore } from 'pinia'

const SIDEBAR_KEY = 'cg_sidebar_collapsed'

/** 纯 UI 状态：侧边栏折叠，持久化到 localStorage，刷新后保持 */
export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === '1')

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0')
  }

  return { sidebarCollapsed, toggleSidebar }
})
