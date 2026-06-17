<template>
  <div>
    <a-card title="Leave Management System">
      <a-form :model="form" @finish="handleLogin">
        <a-form-item name="username" :rules="[{ required: true, message: 'Enter username' }]">
          <a-input v-model:value="form.username" placeholder="Username" size="large">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item name="password" :rules="[{ required: true, message: 'Enter password' }]">
          <a-input-password v-model:value="form.password" placeholder="Password" size="large">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            Login
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
    error.value = e?.data?.statusMessage || 'Login failed'
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
