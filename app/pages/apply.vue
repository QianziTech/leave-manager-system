<template>
  <div>
    <a-page-header title="申请请假" @back="() => $router.back()" />
    <LeaveForm
      ref="leaveFormRef"
      @submit="handlePreview"
    />
    <LeaveApprovalPreviewModal
      :visible="previewVisible"
      :preview-data="previewData"
      :loading="submitting"
      :form-duration="formDuration"
      @confirm="handleConfirmSubmit"
      @cancel="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ middleware: 'auth' })

const leaveFormRef = ref()
const previewVisible = ref(false)
const previewData = ref<any>(null)
const submitting = ref(false)
const formDuration = ref(0)
let pendingFormValues: any = null

async function handlePreview(values: any) {
  if (!values.duration || values.duration < 0.5) {
    message.error('请填写完整的请假信息')
    return
  }
  formDuration.value = values.duration
  pendingFormValues = values

  try {
    const result = await $fetch('/api/leaves/preview', {
      method: 'POST',
      body: { duration: values.duration },
    })
    previewData.value = result
    previewVisible.value = true
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '获取审批流程失败')
  }
}

async function handleConfirmSubmit() {
  if (!pendingFormValues) return
  submitting.value = true
  try {
    await $fetch('/api/leaves', {
      method: 'POST',
      body: pendingFormValues,
    })
    previewVisible.value = false
    await navigateTo('/records')
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '提交请假失败')
  } finally {
    submitting.value = false
  }
}
</script>
