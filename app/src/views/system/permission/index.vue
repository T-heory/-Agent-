<script setup lang="ts">
/**
 * 权限管理：分页搜索 / 新建 / 编辑 / 删除。
 * 权限编码建议格式「模块:动作」（如 user:create），角色分配权限时按前缀分组展示。
 * 编码创建后不可修改（PermissionUpdate 无 code 字段）。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import type { PermissionRead } from '@/api/types'
import {
  createPermission,
  deletePermission,
  searchPermissions,
  updatePermission,
} from '@/api/permission'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import TablePagination from '@/components/TablePagination.vue'
import { useTable } from '@/composables/useTable'
import { confirmDanger, showSuccess } from '@/utils/message'

const route = useRoute()
const router = useRouter()

const {
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
} = useTable<PermissionRead>((query) => searchPermissions(query))

const formVisible = ref(false)
const formSubmitting = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ code: '', name: '', description: '' })

const formRules: FormRules = {
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*(:[a-z0-9_]+)+$/,
      message: '建议格式：模块:动作，如 user:create',
      trigger: 'blur',
    },
    { max: 50, message: '编码不超过 50 个字符', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { max: 50, message: '名称不超过 50 个字符', trigger: 'blur' },
  ],
  description: [{ max: 255, message: '描述不超过 255 个字符', trigger: 'blur' }],
}

const formTitle = computed(() => (formMode.value === 'create' ? '新建权限' : '编辑权限'))

function openCreate(): void {
  formMode.value = 'create'
  editingId.value = null
  form.code = ''
  form.name = ''
  form.description = ''
  formVisible.value = true
  requestAnimationFrame(() => formRef.value?.clearValidate())
}

function openEdit(row: PermissionRead): void {
  formMode.value = 'edit'
  editingId.value = row.id
  form.code = row.code
  form.name = row.name
  form.description = row.description ?? ''
  formVisible.value = true
  requestAnimationFrame(() => formRef.value?.clearValidate())
}

async function submitForm(): Promise<void> {
  if (!formRef.value || formSubmitting.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formSubmitting.value = true
  try {
    if (formMode.value === 'create') {
      await createPermission({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      showSuccess('创建成功')
      formVisible.value = false
      await goLastPage()
    } else if (editingId.value !== null) {
      // PermissionUpdate.name 是必填字段，必须始终携带
      await updatePermission(editingId.value, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      showSuccess('保存成功')
      formVisible.value = false
      await fetchData()
    }
  } catch {
    // 编码重复等错误由拦截器统一提示
  } finally {
    formSubmitting.value = false
  }
}

async function handleDelete(row: PermissionRead): Promise<void> {
  const confirmed = await confirmDanger(
    `确认删除权限「${row.name}」？该操作不可撤销，所有角色中该权限点的绑定关系将一并解除。`,
  )
  if (!confirmed) return
  try {
    await deletePermission(row.id)
    showSuccess('删除成功')
    await fetchData()
  } catch {
    // 拦截器已提示
  }
}

onMounted(async () => {
  await fetchData()
  if (route.query.action === 'create') {
    openCreate()
    const query = { ...route.query }
    delete query.action
    await router.replace({ path: route.path, query })
  }
})

function handleSearch(): void {
  void search()
}

function handleReset(): void {
  void reset()
}
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <PageHeader title="权限管理" description="维护权限点，权限点按「模块:动作」编码后可分配给角色">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span>新建权限</span>
        </el-button>
      </PageHeader>

      <SearchBar
        v-model="keyword"
        placeholder="权限名称 / 编码"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
      />

      <el-alert
        v-if="loadError"
        :title="loadError"
        type="error"
        show-icon
        :closable="false"
        class="page-alert"
      >
        <template #default>
          <el-button text type="primary" size="small" @click="fetchData">重试</el-button>
        </template>
      </el-alert>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        row-key="id"
        class="page-table"
        :empty-text="keyword ? '没有匹配的权限，试试其他关键词' : '暂无权限数据'"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="权限编码" min-width="200">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">
              <span class="code-text">{{ row.code }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="权限名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEdit(row as PermissionRead)">
              编辑
            </el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row as PermissionRead)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <TablePagination
        :total="total"
        :page="page"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog
      v-model="formVisible"
      :title="formTitle"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!formSubmitting"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="96px"
        label-position="right"
        @submit.prevent
      >
        <el-form-item label="权限编码" prop="code">
          <el-tooltip
            :disabled="formMode === 'create'"
            content="权限编码创建后不可修改"
            placement="top"
          >
            <el-input
              v-model="form.code"
              :disabled="formMode === 'edit'"
              placeholder="如 user:create"
              class="code-input"
            />
          </el-tooltip>
          <div class="form-hint">建议格式：模块:动作，如 user:create、role:list</div>
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="如 创建用户" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="可选"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button :disabled="formSubmitting" @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSubmitting" @click="submitForm">
          {{ formMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-alert {
  margin-bottom: 12px;
}

.page-table {
  width: 100%;
  min-height: 320px;
}

.code-input :deep(.el-input__inner) {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.form-hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 18px;
}
</style>
