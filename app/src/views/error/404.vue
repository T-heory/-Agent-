<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome(): void {
  void router.replace('/dashboard')
}

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.replace('/dashboard')
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__code">404</div>
    <h2 class="not-found__title">页面不存在或已被移除</h2>
    <p class="not-found__desc">请检查地址是否正确，或返回工作台继续操作。</p>
    <div class="not-found__actions">
      <el-button type="primary" @click="goHome">
        <el-icon><HomeFilled /></el-icon>
        <span>返回工作台</span>
      </el-button>
      <el-button @click="goBack">返回上一页</el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  text-align: center;
  background-color: #f5f7fa;
}

.not-found__code {
  font-size: 96px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 4px;
  color: #409eff;
  opacity: 0.85;
}

.not-found__title {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #303133;
}

.not-found__desc {
  margin: 0 0 24px;
  font-size: 13px;
  color: #909399;
}

.not-found__actions {
  display: flex;
  gap: 12px;
}
</style>
