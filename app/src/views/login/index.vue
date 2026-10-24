<script setup lang="ts">
/**
 * 登录页：账号 + 密码 + 图形验证码。
 * 关键点：
 * 1. 进入页面立即拉验证码，点击图片刷新
 * 2. 验证码提交前 toUpperCase()（服务端存的是大写码，严格字符串比较）
 * 3. 登录失败必须刷新验证码（key 一次性，错误后不删但已不可靠）
 * 4. 登录响应不含用户信息，store.login 内部会再拉一次 /users/me
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { getCaptcha } from '@/api/captcha'
import { useUserStore } from '@/stores/user'
import { showSuccess } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const appTitle = import.meta.env.VITE_APP_TITLE || '辰光Agent 管理后台'

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: '',
  captcha_code: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { max: 50, message: '用户名不超过 50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 72, message: '密码长度为 6~72 位', trigger: 'blur' },
  ],
  captcha_code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码为 4 位', trigger: 'blur' },
  ],
}

const captchaImage = ref('')
const captchaKey = ref('')
const captchaLoading = ref(false)
const captchaError = ref('')
const submitting = ref(false)
const errorText = ref('')

async function refreshCaptcha(): Promise<void> {
  captchaLoading.value = true
  captchaError.value = ''
  form.captcha_code = ''
  try {
    const data = await getCaptcha()
    captchaKey.value = data.key
    captchaImage.value = data.image
  } catch (error) {
    captchaImage.value = ''
    captchaKey.value = ''
    captchaError.value = error instanceof Error ? error.message : '验证码加载失败'
  } finally {
    captchaLoading.value = false
  }
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value || submitting.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!captchaKey.value) {
    errorText.value = '验证码未加载，请点击图片重试'
    return
  }

  submitting.value = true
  errorText.value = ''
  try {
    await userStore.login(
      {
        username: form.username.trim(),
        password: form.password,
        captcha_key: captchaKey.value,
        captcha_code: form.captcha_code.trim().toUpperCase(),
      },
      true,
    )
    showSuccess('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败，请稍后重试'
    // 验证码相关错误（10001 / 10002）后追加提示，因为下面会自动刷新
    errorText.value = message.includes('验证码') ? `${message}（验证码已刷新）` : message
    await refreshCaptcha()
    formRef.value?.clearValidate('captcha_code')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void refreshCaptcha()
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <div class="login-brand__title">
          <el-icon :size="26"><Grid /></el-icon>
          <span>辰光Agent</span>
        </div>
        <p class="login-brand__subtitle">AI Agent 应用平台 · 管理后台</p>

        <ul class="login-brand__features">
          <li>
            <el-icon><UserFilled /></el-icon>
            <span>用户与角色管理</span>
          </li>
          <li>
            <el-icon><Key /></el-icon>
            <span>细粒度权限控制</span>
          </li>
          <li>
            <el-icon><DataLine /></el-icon>
            <span>平台规模一屏掌握</span>
          </li>
        </ul>

        <p class="login-brand__footer">FastAPI · Vue 3 · Element Plus</p>
      </div>

      <!-- 右侧表单区 -->
      <div class="login-form">
        <h1 class="login-form__title">{{ appTitle }}</h1>
        <p class="login-form__tip">请使用管理员账号登录</p>

        <el-alert
          v-if="errorText"
          :title="errorText"
          type="error"
          show-icon
          :closable="false"
          class="login-form__alert"
        />

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              autocomplete="username"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              show-password
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="验证码" prop="captcha_code">
            <div class="login-captcha">
              <el-input
                v-model="form.captcha_code"
                placeholder="4 位验证码"
                maxlength="4"
                class="login-captcha__input"
                @keyup.enter="handleSubmit"
              />
              <div class="login-captcha__image" title="看不清？换一张" @click="refreshCaptcha">
                <el-skeleton v-if="captchaLoading" animated>
                  <template #template>
                    <el-skeleton-item variant="image" style="width: 120px; height: 40px" />
                  </template>
                </el-skeleton>
                <span v-else-if="captchaError" class="login-captcha__retry">
                  <el-icon><Refresh /></el-icon>
                  <span>点击重试</span>
                </span>
                <img v-else :src="captchaImage" alt="图形验证码" width="120" height="40" />
              </div>
            </div>
          </el-form-item>

          <el-button
            type="primary"
            class="login-form__submit"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '登录中…' : '登 录' }}
          </el-button>
        </el-form>

        <p class="login-form__hint">
          验证码有效期 5 分钟，登录状态保持 30 分钟，过期后会自动返回本页
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #eef4ff 0%, #f5f7fa 45%, #eaf1ff 100%);
}

.login-card {
  display: flex;
  width: 100%;
  max-width: 940px;
  min-height: 520px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(31, 45, 61, 0.12);
  overflow: hidden;
}

.login-brand {
  display: flex;
  flex-direction: column;
  width: 42%;
  padding: 40px 36px;
  color: #ffffff;
  background: linear-gradient(160deg, #409eff 0%, #2f6fd0 100%);
}

.login-brand__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
}

.login-brand__subtitle {
  margin: 10px 0 32px;
  font-size: 13px;
  opacity: 0.85;
}

.login-brand__features {
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
}

.login-brand__features li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  font-size: 14px;
  opacity: 0.95;
}

.login-brand__footer {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
  letter-spacing: 0.5px;
}

.login-form {
  flex: 1;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-form__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.login-form__tip {
  margin: 8px 0 24px;
  font-size: 13px;
  color: #909399;
}

.login-form__alert {
  margin-bottom: 16px;
}

.login-captcha {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.login-captcha__input {
  flex: 1;
}

.login-captcha__image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.login-captcha__image img {
  display: block;
  width: 120px;
  height: 40px;
}

.login-captcha__retry {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.login-form__submit {
  width: 100%;
  margin-top: 8px;
  letter-spacing: 4px;
}

.login-form__hint {
  margin: 20px 0 0;
  font-size: 12px;
  color: #a8abb2;
  line-height: 18px;
}

@media (max-width: 860px) {
  .login-brand {
    display: none;
  }

  .login-form {
    padding: 36px 28px;
  }
}
</style>
