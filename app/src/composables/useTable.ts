/**
 * 列表页通用逻辑：loading / list / total / 分页 / 关键词 / 重试。
 * 三个管理页的分页搜索行为完全一致，抽出来避免复制粘贴。
 */
import { ref, shallowRef } from 'vue'
import type { PageResult, TableQuery } from '@/api/types'

export interface UseTableOptions {
  /** 每页条数，默认 10（与后端 PageParams 默认值对齐，但仍会显式传参） */
  pageSize?: number
}

export function useTable<T>(
  fetcher: (query: TableQuery) => Promise<PageResult<T>>,
  options: UseTableOptions = {},
) {
  const loading = ref(false)
  const list = shallowRef<T[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(options.pageSize ?? 10)
  const keyword = ref('')
  /** 请求失败文案，用于表格区域内的错误占位 + 重试按钮 */
  const loadError = ref('')

  async function fetchData(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const result = await fetcher({
        page: page.value,
        page_size: pageSize.value,
        keyword: keyword.value.trim() || undefined,
      })
      list.value = result.items ?? []
      total.value = result.total ?? 0

      // 删除当前页最后一条后停在空页 → 自动回退一页再查
      if (list.value.length === 0 && page.value > 1) {
        page.value -= 1
        loading.value = false
        await fetchData()
        return
      }
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '加载失败，请稍后重试'
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /** 查询：回到第 1 页 */
  function search(): Promise<void> {
    page.value = 1
    return fetchData()
  }

  /** 重置：清空关键词、回到第 1 页，每页条数保持用户当前选择 */
  function reset(): Promise<void> {
    keyword.value = ''
    page.value = 1
    return fetchData()
  }

  function handlePageChange(next: number): Promise<void> {
    page.value = next
    return fetchData()
  }

  function handleSizeChange(size: number): Promise<void> {
    pageSize.value = size
    page.value = 1
    return fetchData()
  }

  /** 新建成功后跳到末页（列表按 id 升序，新数据在最后） */
  function goLastPage(): Promise<void> {
    page.value = Math.max(1, Math.ceil((total.value + 1) / pageSize.value))
    return fetchData()
  }

  return {
    loading,
    list,
    total,
    page,
    pageSize,
    keyword,
    loadError,
    fetchData,
    search,
    reset,
    handlePageChange,
    handleSizeChange,
    goLastPage,
  }
}
