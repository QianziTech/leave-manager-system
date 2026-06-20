<template>
  <div>
    <a-card title="请假管理系统">
      <a-form :model="form" @finish="handleLogin">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="form.username" placeholder="用户名" size="large">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" placeholder="密码" size="large">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            登录
          </a-button>
        </a-form-item>
      </a-form>
      <p v-if="error" class="error-text">{{ error }}</p>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await login(form.username, form.password)
    await navigateTo('/records')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.error-text {
  color: #ff4d4f;
  text-align: center;
}
</style>