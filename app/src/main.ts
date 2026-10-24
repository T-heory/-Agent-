import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoading } from 'element-plus'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import type { Component } from 'vue'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/request'
import { useUserStore } from './stores/user'
import './styles/index.scss'
// v-loading 是「指令」不是组件，按需引入模式下不会被自动解析，这里显式注册
import 'element-plus/es/components/loading/style/css'

const app = createApp(App)

// 全局注册 Element Plus 图标（侧边栏菜单、按钮图标直接用 <el-icon><User /></el-icon>）
for (const [name, component] of Object.entries(ElementPlusIcons)) {
  app.component(name, component as Component)
}

app.use(createPinia())
app.use(router)
app.use(ElLoading)

// 401 处理回调：request.ts 不直接依赖 router / store（避免循环引用），
// 由这里注入「清状态 + 带 redirect 跳登录页」的具体动作
setUnauthorizedHandler(() => {
  const userStore = useUserStore()
  const current = router.currentRoute.value
  userStore.reset()
  if (current.name === 'Login') return
  void router.replace({ path: '/login', query: { redirect: current.fullPath } })
})

app.mount('#app')
