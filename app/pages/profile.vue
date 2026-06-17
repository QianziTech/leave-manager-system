<template>
  <div>
    <a-page-header title="My Profile" />
    <a-card v-if="user">
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="Username">{{ user.username }}</a-descriptions-item>
        <a-descriptions-item label="Name">{{ user.realName }}</a-descriptions-item>
        <a-descriptions-item label="Department">{{ user.department }}</a-descriptions-item>
        <a-descriptions-item label="Role">{{ roleLabel }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="Change Password" style="margin-top: 24px">
      <a-form :model="passwordForm" @finish="handleChangePassword" style="max-width: 400px">
        <a-form-item name="password" :rules="[{ required: true, min: 6 }]">
          <a-input-password v-model:value="passwordForm.password" placeholder="New password" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="submitting">Update</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const submitting = ref(false)

const passwordForm = reactive({ password: '' })

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    employee: 'Employee',
    supervisor: 'Supervisor',
    dept_head: 'Department Head',
    admin: 'Administrator',
  }
  return labels[user.value?.role || ''] || ''
})

async function handleChangePassword() {
  submitting.value = true
  try {
    await $fetch(`/api/users/${user.value?.id}`, {
      method: 'PUT',
      body: { password: passwordForm.password },
    })
    message.success('Password updated')
    passwordForm.password = ''
  } catch {
    message.error('Failed to update password')
  } finally {
    submitting.value = false
  }
}
</script>
