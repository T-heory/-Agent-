<script setup lang="ts">
/**
 * 角色管理：增删改查 + 分配权限。
 * 两个后端约束要在 UI 上体现：
 * 1. 角色编码 code 创建后不可修改（RoleUpdate 无 code 字段）
 * 2. 分配权限是「全量替换」语义，传 [] 即清空
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import type { PermissionRead, RoleRead } from '@/api/types'
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  getRole,
  searchRoles,
  updateRole,
} from '@/api/role'
import { listPermissions } from '@/api/permission'
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
} = useTable<RoleRead>((query) => searchRoles(query))

/* ---------------- 新建 / 编辑 ---------------- */

const formVisible = ref(false)
const formSubmitting = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ code: '', name: '', description: '' })

const formRules: FormRules = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]{1,49}$/,
      message: '小写字母开头，可含数字和下划线，2~50 位',
      trigger: 'blur',
    },
  ],
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 100, message: '名称不超过 100 个字符', trigger: 'blur' },
  ],
  description: [{ max: 255, message: '描述不超过 255 个字符', trigger: 'blur' }],
}

const formTitle = computed(() => (formMode.value === 'create' ? '新建角色' : '编辑角色'))

function openCreate(): void {
  formMode.value = 'create'
  editingId.value = null
  form.code = ''
  form.name = ''
  form.description = ''
  formVisible.value = true
  requestAnimationFrame(() => formRef.value?.clearValidate())
}

function openEdit(row: RoleRead): void {
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
      await createRole({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      showSuccess('创建成功')
      formVisible.value = false
      await goLastPage()
    } else if (editingId.value !== null) {
      // 只提交 name / description：code 创建后不可修改
      await updateRole(editingId.value, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      showSuccess('保存成功')
      formVisible.value = false
      await fetchData()
    }
  } catch {
    // 文案由拦截器统一提示（含 code 重复的错位兜底）
  } finally {
    formSubmitting.value = false
  }
}

/* ---------------- 分配权限 ---------------- */

const GROUP_LABELS: Record<string, string> = {
  user: '用户模块',
  role: '角色模块',
  permission: '权限模块',
  perm: '权限模块',
  order: '订单模块',
  auth: '认证模块',
}

const assignVisible = ref(false)
const assignLoading = ref(false)
const assignSubmitting = ref(false)
const assignRole = ref<RoleRead | null>(null)
const allPermissions = ref<PermissionRead[]>([])
const selectedIds = ref<number[]>([])
const permKeyword = ref('')

/** 按 code 的模块前缀分组，无前缀的归入「其他」 */
const permissionGroups = computed(() => {
  const kw = permKeyword.value.trim().toLowerCase()
  const groups = new Map<string, PermissionRead[]>()
  for (const perm of allPermissions.value) {
    if (kw && !perm.code.toLowerCase().includes(kw) && !perm.name.toLowerCase().includes(kw)) {
      continue
    }
    const key = perm.code.includes(':') ? perm.code.split(':')[0] : '其他'
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(perm)
    } else {
      groups.set(key, [perm])
    }
  }
  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: GROUP_LABELS[key] ?? key,
    items,
  }))
})

const selectedCount = computed(() => selectedIds.value.length)

function isChecked(id: number): boolean {
  return selectedIds.value.includes(id)
}

function togglePermission(id: number, checked: boolean | string | number): void {
  const next = new Set(selectedIds.value)
  if (checked) {
    next.add(id)
  } else {
    next.delete(id)
  }
  selectedIds.value = Array.from(next)
}

function groupChecked(items: PermissionRead[]): boolean {
  return items.length > 0 && items.every((item) => isChecked(item.id))
}

function groupIndeterminate(items: PermissionRead[]): boolean {
  const count = items.filter((item) => isChecked(item.id)).length
  return count > 0 && count < items.length
}

function toggleGroup(items: PermissionRead[], checked: boolean | string | number): void {
  const next = new Set(selectedIds.value)
  for (const item of items) {
    if (checked) {
      next.add(item.id)
    } else {
      next.delete(item.id)
    }
  }
  selectedIds.value = Array.from(next)
}

function selectAll(): void {
  selectedIds.value = allPermissions.value.map((item) => item.id)
}

function clearAll(): void {
  selectedIds.value = []
}

async function openAssign(row: RoleRead): Promise<void> {
  assignRole.value = row
  assignVisible.value = true
  assignLoading.value = true
  allPermissions.value = []
  selectedIds.value = []
  permKeyword.value = ''
  try {
    // 并行：全部权限（选项）+ 角色详情（回显已选）
    const [permissions, detail] = await Promise.all([listPermissions(), getRole(row.id)])
    allPermissions.value = permissions
    selectedIds.value = detail.permissions.map((item) => item.id)
  } catch {
    // 提示已由拦截器给出
  } finally {
    assignLoading.value = false
  }
}

async function submitAssign(): Promise<void> {
  if (!assignRole.value || assignSubmitting.value) return
  assignSubmitting.value = true
  try {
    await assignRolePermissions(assignRole.value.id, { permission_ids: selectedIds.value })
    showSuccess('权限分配成功')
    assignVisible.value = false
    await fetchData()
  } catch {
    // 拦截器已提示
  } finally {
    assignSubmitting.value = false
  }
}

/* ---------------- 删除 ---------------- */

async function handleDelete(row: RoleRead): Promise<void> {
  const permissionTip = row.permissions.length ? `当前包含 ${row.permissions.length} 个权限。` : ''
  const confirmed = await confirmDanger(
    `确认删除角色「${row.name}」？该操作不可撤销，绑定此角色的用户将失去该角色及其全部权限。${permissionTip}`,
  )
  if (!confirmed) return
  try {
    await deleteRole(row.id)
    showSuccess('删除成功')
    await fetchData()
  } catch {
    // 拦截器已提示
  }
}

/* ---------------- 生命周期 ---------------- */

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
      <PageHeader title="角色管理" description="维护角色，并为角色分配权限点">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span>新建角色</span>
        </el-button>
      </PageHeader>

      <SearchBar
        v-model="keyword"
        placeholder="角色名称 / 编码"
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
        :empty-text="keyword ? '没有匹配的角色，试试其他关键词' : '暂无角色数据'"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="角色编码" width="180">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">
              <span class="code-text">{{ row.code }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="角色名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '-' }}</template>
        </el-table-column>
        <el-table-column label="权限数" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'count-zero': row.permissions.length === 0 }">
              {{ row.permissions.length }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEdit(row as RoleRead)">
              编辑
            </el-button>
            <el-button text type="primary" size="small" @click="openAssign(row as RoleRead)">
              分配权限
            </el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row as RoleRead)">
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

    <!-- 新建 / 编辑 -->
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
        <el-form-item label="角色编码" prop="code">
          <el-tooltip
            :disabled="formMode === 'create'"
            content="角色编码创建后不可修改"
            placement="top"
          >
            <el-input
              v-model="form.code"
              :disabled="formMode === 'edit'"
              placeholder="如 auditor，小写字母开头"
              class="code-input"
            />
          </el-tooltip>
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="如 审计员" />
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

    <!-- 分配权限 -->
    <el-dialog
      v-model="assignVisible"
      :title="`分配权限${assignRole ? ' · ' + assignRole.name : ''}`"
      width="640px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!assignSubmitting"
    >
      <div class="assign-toolbar">
        <el-input
          v-model="permKeyword"
          placeholder="按编码或名称过滤"
          clearable
          class="assign-toolbar__search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button size="small" @click="selectAll">全选</el-button>
        <el-button size="small" @click="clearAll">清空</el-button>
      </div>

      <div v-loading="assignLoading" class="assign-list">
        <el-empty
          v-if="!assignLoading && allPermissions.length === 0"
          description="暂无权限数据，请先在权限管理中创建"
          :image-size="80"
        />
        <el-empty
          v-else-if="!assignLoading && permissionGroups.length === 0"
          description="没有匹配的权限"
          :image-size="80"
        />

        <div v-for="group in permissionGroups" :key="group.key" class="perm-group">
          <div class="perm-group__head">
            <el-checkbox
              :model-value="groupChecked(group.items)"
              :indeterminate="groupIndeterminate(group.items)"
              @change="(checked: boolean | string | number) => toggleGroup(group.items, checked)"
            >
              <span class="perm-group__title">{{ group.label }}</span>
            </el-checkbox>
            <span class="perm-group__count">
              已选 {{ group.items.filter((item) => isChecked(item.id)).length }} /
              {{ group.items.length }}
            </span>
          </div>

          <div class="perm-group__items">
            <el-checkbox
              v-for="perm in group.items"
              :key="perm.id"
              :model-value="isChecked(perm.id)"
              @change="(checked: boolean | string | number) => togglePermission(perm.id, checked)"
            >
              <span class="perm-item__name">{{ perm.name }}</span>
              <span class="perm-item__code code-text">{{ perm.code }}</span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="assign-footer">
          <span class="assign-footer__count">已选 {{ selectedCount }} 项</span>
          <div>
            <el-button :disabled="assignSubmitting" @click="assignVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="assignSubmitting"
              :disabled="assignLoading"
              @click="submitAssign"
            >
              保存
            </el-button>
          </div>
        </div>
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

.count-zero {
  color: #a8abb2;
}

.code-input :deep(.el-input__inner) {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.assign-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.assign-toolbar__search {
  flex: 1;
}

.assign-list {
  max-height: 420px;
  overflow: auto;
  min-height: 120px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px 12px;
}

.perm-group {
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.perm-group:last-child {
  border-bottom: none;
}

.perm-group__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.perm-group__title {
  font-weight: 600;
  color: #303133;
}

.perm-group__count {
  font-size: 12px;
  color: #909399;
}

.perm-group__items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 4px 0 0 22px;
}

.perm-item__name {
  margin-right: 6px;
}

.perm-item__code {
  font-size: 12px;
  color: #a8abb2;
}

.assign-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assign-footer__count {
  font-size: 13px;
  color: #606266;
}
</style>
