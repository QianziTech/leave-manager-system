<template>
  <div>
    <a-page-header title="个人中心" />
    <a-card v-if="user">
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="用户名">{{ user.username }}</a-descriptions-item>
        <a-descriptions-item label="姓名">{{ user.realName }}</a-descriptions-item>
        <a-descriptions-item label="部门">{{ user.department }}</a-descriptions-item>
        <a-descriptions-item label="角色">{{ roleLabel }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="修改密码" style="margin-top: 24px">
      <a-form :model="passwordForm" @finish="handleChangePassword" style="max-width: 400px">
        <a-form-item name="password" :rules="[{ required: true, min: 6, message: '密码至少6位' }]">
          <a-input-password v-model:value="passwordForm.password" placeholder="新密码" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="submitting">更新密码</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { roleLabels } from '~/composables/useLabels'

definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const submitting = ref(false)

const passwordForm = reactive({ password: '' })

const roleLabel = computed(() => roleLabels[user.value?.role || ''] || '')

async function handleChangePassword() {
  submitting.value = true
  try {
    await $fetch(`/api/users/${user.value?.id}`, {
      method: 'PUT',
      body: { password: passwordForm.password },
    })
    message.success('密码已更新')
    passwordForm.password = ''
  } catch {
    message.error('密码更新失败')
  } finally {
    submitting.value = false
  }
}
</script>