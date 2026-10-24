<script setup lang="ts">
/**
 * 用户管理：分页搜索 / 新建 / 详情 / 分配角色 / 删除。
 * 后端没有「编辑用户」「启禁用」「重置密码」接口，所以这些入口不提供，
 * is_active 仅作只读标签展示（说明书 13 章 P1-2）。
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import type { RoleRead, UserRead, UserWithRoles } from '@/api/types'
import {
  assignUserRoles,
  createUser,
  deleteUser,
  getUser,
  getUserRoles,
  searchUsers,
} from '@/api/user'
import { listRoles } from '@/api/role'
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
} = useTable<UserRead>((query) => searchUsers(query))

/* ---------------- 新建用户 ---------------- */

const createVisible = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const createRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3~20 位', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
    { max: 100, message: '邮箱不超过 100 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 72, message: '密码长度为 6~72 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== createForm.password) {
          callback(new Error('两次输入的密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

function openCreate(): void {
  createForm.username = ''
  createForm.email = ''
  createForm.password = ''
  createForm.confirmPassword = ''
  createVisible.value = true
  // 弹窗刚打开时表单还没挂载，等一帧再清校验状态
  requestAnimationFrame(() => createFormRef.value?.clearValidate())
}

async function submitCreate(): Promise<void> {
  if (!createFormRef.value || createSubmitting.value) return
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  createSubmitting.value = true
  try {
    await createUser({
      username: createForm.username.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
    })
    showSuccess('创建成功')
    createVisible.value = false
    // 列表按 id 升序，新建的排在最后 → 跳到末页才能看到
    await goLastPage()
  } catch {
    // 失败文案由拦截器统一提示（用户名/邮箱重复等），保留弹窗与已填内容
  } finally {
    createSubmitting.value = false
  }
}

/* ---------------- 用户详情 ---------------- */

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<UserWithRoles | null>(null)

async function openDetail(row: UserRead): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getUser(row.id)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

/* ---------------- 分配角色 ---------------- */

const assignVisible = ref(false)
const assignLoading = ref(false)
const assignSubmitting = ref(false)
const assignUser = ref<UserRead | null>(null)
const roleOptions = ref<RoleRead[]>([])
const selectedRoleIds = ref<number[]>([])

async function loadAssignOptions(): Promise<void> {
  if (!assignUser.value) return
  const [options, current] = await Promise.all([
    listRoles(),
    getUserRoles(assignUser.value.id),
  ])
  roleOptions.value = options
  selectedRoleIds.value = current.map((role) => role.id)
}

async function openAssign(row: UserRead): Promise<void> {
  assignUser.value = row
  assignVisible.value = true
  assignLoading.value = true
  roleOptions.value = []
  selectedRoleIds.value = []
  try {
    await loadAssignOptions()
  } catch {
    // 选项加载失败时弹窗内会显示空列表，提示已由拦截器给出
  } finally {
    assignLoading.value = false
  }
}

async function submitAssign(): Promise<void> {
  if (!assignUser.value || assignSubmitting.value) return
  assignSubmitting.value = true
  try {
    await assignUserRoles(assignUser.value.id, { role_ids: selectedRoleIds.value })
    showSuccess('角色分配成功')
    assignVisible.value = false
    await fetchData()
  } catch {
    // 30002「有部分角色不存在」时刷新一次选项，方便用户重新勾选
    await loadAssignOptions().catch(() => undefined)
  } finally {
    assignSubmitting.value = false
  }
}

/* ---------------- 删除 ---------------- */

async function handleDelete(row: UserRead): Promise<void> {
  const confirmed = await confirmDanger(
    `确认删除用户「${row.username}」？该操作不可撤销，用户与角色的绑定关系将一并删除。`,
  )
  if (!confirmed) return
  try {
    await deleteUser(row.id)
    showSuccess('删除成功')
    await fetchData()
  } catch {
    // 拦截器已提示
  }
}

/* ---------------- 生命周期 ---------------- */

onMounted(async () => {
  await fetchData()
  // 工作台「快捷操作」跳转过来时自动打开新建弹窗，并把 query 清掉避免刷新重复触发
  if (route.query.action === 'create') {
    openCreate()
    const query = { ...route.query }
    delete query.action
    await router.replace({ path: route.path, query })
  }
})

// 供模板里做「关键词为空」的判断
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
      <PageHeader title="用户管理" description="管理平台账号，并为账号分配角色">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span>新建用户</span>
        </el-button>
      </PageHeader>

      <SearchBar
        v-model="keyword"
        placeholder="用户名 / 邮箱"
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
        :empty-text="keyword ? '没有匹配的用户，试试其他关键词' : '暂无用户数据'"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small" effect="light">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDetail(row as UserRead)">
              详情
            </el-button>
            <el-button text type="primary" size="small" @click="openAssign(row as UserRead)">
              分配角色
            </el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row as UserRead)">
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

    <!-- 新建用户 -->
    <el-dialog
      v-model="createVisible"
      title="新建用户"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!createSubmitting"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="96px"
        label-position="right"
        @submit.prevent
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="3~20 位字母、数字或下划线" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" placeholder="用于登录与通知" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            show-password
            placeholder="6~72 位"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="createForm.confirmPassword"
            type="password"
            show-password
            placeholder="再次输入密码"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button :disabled="createSubmitting" @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSubmitting" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情 -->
    <el-drawer v-model="detailVisible" title="用户详情" size="480px" destroy-on-close>
      <div v-loading="detailLoading" class="detail">
        <el-empty v-if="!detailLoading && !detail" description="用户信息加载失败" />
        <el-descriptions v-else-if="detail" :column="1" border size="small">
          <el-descriptions-item label="ID">
            <span class="code-text">{{ detail.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detail.email }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detail.is_active ? 'success' : 'danger'" size="small" effect="light">
              {{ detail.is_active ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <div v-if="detail.roles.length" class="detail-roles">
              <el-tag v-for="role in detail.roles" :key="role.id" size="small" effect="plain">
                {{ role.name }}
                <span class="code-text detail-roles__code">{{ role.code }}</span>
              </el-tag>
            </div>
            <span v-else class="detail-empty">未分配角色</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 分配角色 -->
    <el-dialog
      v-model="assignVisible"
      :title="`分配角色${assignUser ? ' · ' + assignUser.username : ''}`"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!assignSubmitting"
    >
      <el-alert
        type="info"
        show-icon
        :closable="false"
        title="全量替换语义"
        description="提交后以此列表为准，未勾选的角色会被移除。"
        class="assign-tip"
      />

      <div v-loading="assignLoading" class="assign-body">
        <el-select
          v-model="selectedRoleIds"
          multiple
          filterable
          clearable
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择角色"
          class="assign-select"
          :disabled="assignLoading"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          >
            <span class="option-name">{{ role.name }}</span>
            <span class="option-code code-text">{{ role.code }}</span>
          </el-option>
          <el-option
            v-if="roleOptions.length === 100"
            disabled
            label="仅显示前 100 条，请用搜索精确定位"
            :value="-1"
          />
        </el-select>

        <p v-if="!assignLoading && roleOptions.length === 0" class="assign-empty">
          暂无可分配角色，请先在角色管理中创建
        </p>
      </div>

      <template #footer>
        <el-button :disabled="assignSubmitting" @click="assignVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="assignSubmitting"
          :disabled="assignLoading"
          @click="submitAssign"
        >
          保存
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

.detail {
  min-height: 200px;
}

.detail-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-roles__code {
  margin-left: 4px;
  opacity: 0.65;
}

.detail-empty {
  color: #909399;
}

.assign-tip {
  margin-bottom: 16px;
}

.assign-body {
  min-height: 60px;
}

.assign-select {
  width: 100%;
}

.assign-empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
}

.option-name {
  margin-right: 8px;
}

.option-code {
  font-size: 12px;
  color: #a8abb2;
}
</style>
