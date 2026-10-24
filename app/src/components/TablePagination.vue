<script setup lang="ts">
/**
 * 统一分页器：参数名固定 page / page_size（不是 current / pageSize）。
 * 切换每页条数时由父组件把 page 重置为 1。
 */
interface Props {
  total: number
  page: number
  pageSize: number
  pageSizes?: number[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSizes: () => [10, 20, 50, 100],
  disabled: false,
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
  'page-change': [value: number]
  'size-change': [value: number]
}>()

function onPageChange(value: number): void {
  emit('update:page', value)
  emit('page-change', value)
}

function onSizeChange(value: number): void {
  emit('update:pageSize', value)
  emit('size-change', value)
}
</script>

<template>
  <div class="table-pagination">
    <el-pagination
      background
      :total="props.total"
      :current-page="props.page"
      :page-size="props.pageSize"
      :page-sizes="props.pageSizes"
      :disabled="props.disabled"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="onPageChange"
      @size-change="onSizeChange"
    />
  </div>
</template>

<style scoped>
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
