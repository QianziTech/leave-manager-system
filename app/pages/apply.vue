<template>
  <div>
    <a-page-header title="申请请假" @back="() => $router.back()" />
    <LeaveForm @submit="handleSubmit" />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ middleware: 'auth' })

async function handleSubmit(values: any) {
  try {
    await $fetch('/api/leaves', {
      method: 'POST',
      body: values,
    })
    await navigateTo('/records')
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '提交请假失败')
  }
}
</script>