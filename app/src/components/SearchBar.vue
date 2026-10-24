<script setup lang="ts">
/** 关键词搜索条：单输入框 + 查询/重置，回车即查询 */
interface Props {
  modelValue: string
  placeholder?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入关键词搜索',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
  reset: []
}>()
</script>

<template>
  <div class="search-bar">
    <el-input
      :model-value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.loading"
      clearable
      class="search-bar__input"
      @update:model-value="(value: string) => emit('update:modelValue', value)"
      @keyup.enter="emit('search')"
      @clear="emit('search')"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <el-button type="primary" :loading="props.loading" @click="emit('search')">
      <el-icon v-if="!props.loading"><Search /></el-icon>
      <span>查询</span>
    </el-button>

    <el-button :disabled="props.loading" @click="emit('reset')">
      <el-icon><Refresh /></el-icon>
      <span>重置</span>
    </el-button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.search-bar__input {
  width: 280px;
}
</style>
