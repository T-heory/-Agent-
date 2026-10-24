<script setup lang="ts">
/**
 * 工作台：系统规模统计 + 快捷入口 + 系统信息。
 * 统计数字复用列表接口的 total（page_size 传 1 减少传输），
 * 三个请求并行发出，用 allSettled 保证单个失败不影响其它卡片。
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { searchUsers } from '@/api/user'
import { searchRoles } from '@/api/role'
import { searchPermissions } from '@/api/permission'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const stats = reactive<{ users: number | null; roles: number | null; permissions: number | null }>({
  users: null,
  roles: null,
  permissions: null,
})

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const appVersion = __APP_VERSION__

async function loadStats(): Promise<void> {
  loading.value = true
  const [users, roles, permissions] = await Promise.allSettled([
    searchUsers({ page: 1, page_size: 1 }),
    searchRoles({ page: 1, page_size: 1 }),
    searchPermissions({ page: 1, page_size: 1 }),
  ])
  stats.users = users.status === 'fulfilled' ? users.value.total : null
  stats.roles = roles.status === 'fulfilled' ? roles.value.total : null
  stats.permissions = permissions.status === 'fulfilled' ? permissions.value.total : null
  loading.value = false
}

/** 跳转到目标页并带上 action=create，由目标页 onMounted 检测后自动打开新建弹窗 */
function goCreate(path: string): void {
  void router.push({ path, query: { action: 'create' } })
}

onMounted(() => {
  void loadStats()
})
</script>

<template>
  <div class="dashboard">
    <el-card shadow="never" class="dashboard-welcome">
      <div class="welcome">
        <div>
          <h2 class="welcome__title">你好，{{ userStore.displayName || '管理员' }}</h2>
          <p class="welcome__desc">
            这里是辰光Agent 管理后台。当前版本已开放用户、角色、权限三块 RBAC 能力。
          </p>
        </div>
        <el-button :loading="loading" @click="loadStats">
          <el-icon><Refresh /></el-icon>
          <span>刷新数据</span>
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="16" class="dashboard-stats">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-skeleton :loading="loading" animated :rows="2">
            <template #default>
              <div class="stat-card__label">
                <el-icon><User /></el-icon>
                <span>用户总数</span>
              </div>
              <div class="stat-card__value">{{ stats.users ?? '-' }}</div>
              <div class="stat-card__footer">已注册账号</div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-skeleton :loading="loading" animated :rows="2">
            <template #default>
              <div class="stat-card__label">
                <el-icon><Avatar /></el-icon>
                <span>角色总数</span>
              </div>
              <div class="stat-card__value">{{ stats.roles ?? '-' }}</div>
              <div class="stat-card__footer">权限分组</div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-skeleton :loading="loading" animated :rows="2">
            <template #default>
              <div class="stat-card__label">
                <el-icon><Key /></el-icon>
                <span>权限总数</span>
              </div>
              <div class="stat-card__value">{{ stats.permissions ?? '-' }}</div>
              <div class="stat-card__footer">可分配权限点</div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-skeleton :loading="loading" animated :rows="2">
            <template #default>
              <div class="stat-card__label">
                <el-icon><UserFilled /></el-icon>
                <span>当前账号</span>
              </div>
              <div class="stat-card__value stat-card__value--text">
                {{ userStore.profile?.username ?? '-' }}
              </div>
              <div class="stat-card__footer">
                <el-tag
                  :type="userStore.profile?.is_active ? 'success' : 'danger'"
                  size="small"
                  effect="light"
                >
                  {{ userStore.profile?.is_active ? '正常' : '已禁用' }}
                </el-tag>
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" plain @click="goCreate('/system/users')">
              <el-icon><Plus /></el-icon>
              <span>新建用户</span>
            </el-button>
            <el-button type="primary" plain @click="goCreate('/system/roles')">
              <el-icon><Plus /></el-icon>
              <span>新建角色</span>
            </el-button>
            <el-button type="primary" plain @click="goCreate('/system/permissions')">
              <el-icon><Plus /></el-icon>
              <span>新建权限</span>
            </el-button>
          </div>
          <p class="quick-actions__tip">点击后直达对应管理页并自动打开新建弹窗。</p>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">系统信息</span>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="后端地址">
              <span class="code-text">{{ apiBaseUrl }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="前端版本">
              <span class="code-text">v{{ appVersion }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="登录时间">
              <el-tooltip content="后端暂未返回登录时间字段" placement="top">
                <span>-</span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item label="Token 有效期">
              <span>30 分钟（无刷新令牌）</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-welcome {
  margin-bottom: 16px;
}

.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.welcome__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.welcome__desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}

.dashboard-stats {
  margin-bottom: 16px;
}

.stat-card__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.stat-card__value {
  margin: 10px 0 6px;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
  color: #303133;
}

.stat-card__value--text {
  font-size: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card__footer {
  font-size: 12px;
  color: #a8abb2;
  min-height: 20px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-actions__tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: #a8abb2;
}
</style>
