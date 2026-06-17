<template>
  <a-card title="Approval Actions">
    <a-form layout="vertical" @finish="handleApprove">
      <a-form-item label="Comment">
        <a-textarea v-model:value="comment" :rows="2" placeholder="Optional comment" />
      </a-form-item>
      <a-space>
        <a-button type="primary" html-type="submit" :loading="loading">Approve</a-button>
        <a-button danger :loading="loading" @click="handleReject">Reject</a-button>
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
    // Find the pending approval ID for this user on this leave
    const pendingList = await $fetch('/api/approvals/pending') as any[]
    const myApproval = pendingList.find(
      (a: any) => a.leave_id === props.leaveId,
    )

    if (myApproval) {
      await $fetch(`/api/approvals/${myApproval.id}/approve`, {
        method: 'POST',
        body: { comment: comment.value },
      })
      message.success('Approved')
      comment.value = ''
      emit('done')
    }
  } catch (e: any) {
    message.error(e?.data?.statusMessage || 'Approval failed')
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
      message.success('Rejected')
      comment.value = ''
      emit('done')
    }
  } catch (e: any) {
    message.error(e?.data?.statusMessage || 'Rejection failed')
  } finally {
    loading.value = false
  }
}
</script>
