<template>
  <a-card title="审批操作">
    <a-form layout="vertical" @finish="handleApprove">
      <a-form-item label="审批意见">
        <a-textarea v-model:value="comment" :rows="2" placeholder="可选填写审批意见" />
      </a-form-item>
      <a-space>
        <a-button type="primary" html-type="submit" :loading="loading">通过</a-button>
        <a-button danger :loading="loading" @click="handleReject">拒绝</a-button>
      </a-space>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const props = defineProps<{ leaveId: number }>()
const emit = defineEmits<{ done: [] }>()

const comment = ref('')
const loading = ref(false)

async function handleApprove() {
  loading.value = true
  try {
    const pendingList = await $fetch('/api/approvals/pending') as any[]
    const myApproval = pendingList.find(
      (a: any) => a.leave_id === props.leaveId,
    )

    if (myApproval) {
      await $fetch(`/api/approvals/${myApproval.id}/approve`, {
        method: 'POST',
        body: { comment: comment.value },
      })
      message.success('已通过审批')
      comment.value = ''
      emit('done')
    }
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '审批操作失败')
  } finally {
    loading.value = false
  }
}

async function handleReject() {
  loading.value = true
  try {
    const pendingList = await $fetch('/api/approvals/pending') as any[]
    const myApproval = pendingList.find(
      (a: any) => a.leave_id === props.leaveId,
    )

    if (myApproval) {
      await $fetch(`/api/approvals/${myApproval.id}/reject`, {
        method: 'POST',
        body: { comment: comment.value },
      })
      message.success('已拒绝审批')
      comment.value = ''
      emit('done')
    }
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '审批操作失败')
  } finally {
    loading.value = false
  }
}
</script>