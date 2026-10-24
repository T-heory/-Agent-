<script setup lang="ts">
/** 页面标题 + 右侧操作区。所有管理页统一用它，保证标题字号/间距一致 */
interface Props {
  title: string
  description?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="page-header">
    <div class="page-header__text">
      <h2 class="page-header__title">{{ props.title }}</h2>
      <p v-if="props.description" class="page-header__desc">{{ props.description }}</p>
    </div>
    <div class="page-header__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 28px;
}

.page-header__desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 20px;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
