<script setup lang="ts">
/**
 * 个人中心：账号基本信息 + 我的角色。
 * 后端没有「修改密码」接口，所以该入口按约定置灰并给出 tooltip 说明。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { RoleRead } from '@/api/types'
import { getUserRoles } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { confirmDanger, showSuccess } from '@/utils/message'

const router = useRouter()
const userStore = useUserStore()

const roles = ref<RoleRead[]>([])
const rolesLoading = ref(false)
const rolesError = ref('')

const profile = computed(() => userStore.profile)
const avatarText = computed(() => (profile.value?.username || '?').slice(0, 1).toUpperCase())

async function loadRoles(): Promise<void> {
  if (!profile.value) return
  rolesLoading.value = true
  rolesError.value = ''
  try {
    roles.value = await getUserRoles(profile.value.id)
  } catch (error) {
    rolesError.value = error instanceof Error ? error.message : '角色加载失败'
    roles.value = []
  } finally {
    rolesLoading.value = false
  }
}

async function handleLogout(): Promise<void> {
  const confirmed = await confirmDanger('退出后需要重新登录，确认退出当前账号？', {
    title: '退出登录',
    confirmText: '退出登录',
  })
  if (!confirmed) return
  userStore.logout()
  showSuccess('已退出登录')
  await router.replace('/login')
}

onMounted(async () => {
  if (!userStore.profile) {
    try {
      await userStore.fetchProfile()
    } catch {
      return
    }
  }
  await loadRoles()
})
</script>

<template>
  <div class="profile">
    <el-row :gutter="16">
      <el-col :span="9">
        <el-card shadow="never" class="profile-card">
          <div class="profile-card__head">
            <div class="profile-card__avatar">{{ avatarText }}</div>
            <div class="profile-card__name">
              <h3>{{ profile?.username ?? '-' }}</h3>
              <p>{{ profile?.email ?? '-' }}</p>
            </div>
          </div>

          <el-descriptions :column="1" size="small" border class="profile-card__desc">
            <el-descriptions-item label="用户 ID">
              <span class="code-text">{{ profile?.id ?? '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ profile?.email ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="profile?.is_active ? 'success' : 'danger'" size="small" effect="light">
                {{ profile?.is_active ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="角色数量">{{ roles.length }}</el-descriptions-item>
          </el-descriptions>

          <div class="profile-card__actions">
            <el-tooltip content="后端暂未提供修改密码接口" placement="top">
              <span>
                <el-button disabled>
                  <el-icon><Lock /></el-icon>
                  <span>修改密码</span>
                </el-button>
              </span>
            </el-tooltip>
            <el-button type="danger" plain @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="15">
        <el-card shadow="never">
          <template #header>
            <div class="profile-roles__header">
              <span class="card-title">我的角色</span>
              <el-button text :loading="rolesLoading" @click="loadRoles">
                <el-icon><Refresh /></el-icon>
                <span>刷新</span>
              </el-button>
            </div>
          </template>

          <el-alert
            v-if="rolesError"
            :title="rolesError"
            type="error"
            show-icon
            :closable="false"
            class="profile-roles__error"
          />

          <div v-loading="rolesLoading" class="profile-roles">
            <el-empty
              v-if="!rolesLoading && roles.length === 0"
              description="暂未分配角色，请联系管理员"
              :image-size="90"
            />

            <div v-for="role in roles" :key="role.id" class="role-item">
              <div class="role-item__head">
                <span class="role-item__name">{{ role.name }}</span>
                <el-tag size="small" type="info" effect="plain">
                  <span class="code-text">{{ role.code }}</span>
                </el-tag>
                <span class="role-item__count">{{ role.permissions.length }} 个权限</span>
              </div>
              <p class="role-item__desc">{{ role.description || '-' }}</p>
              <div v-if="role.permissions.length" class="role-item__perms">
                <el-tag
                  v-for="perm in role.permissions"
                  :key="perm.id"
                  size="small"
                  effect="plain"
                >
                  <span class="code-text">{{ perm.code }}</span>
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.profile-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.profile-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(160deg, #409eff 0%, #2f6fd0 100%);
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
}

.profile-card__name h3 {
  margin: 0;
  font-size: 17px;
  color: #303133;
}

.profile-card__name p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}

.profile-card__desc {
  margin-bottom: 16px;
}

.profile-card__actions {
  display: flex;
  gap: 8px;
}

.profile-roles__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.profile-roles__error {
  margin-bottom: 12px;
}

.profile-roles {
  min-height: 200px;
}

.role-item {
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #fafbfc;
}

.role-item:last-child {
  margin-bottom: 0;
}

.role-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-item__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.role-item__count {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.role-item__desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: #606266;
  line-height: 20px;
}

.role-item__perms {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
</style>
