<template>
  <div>
    <a-timeline>
      <a-timeline-item
        v-for="approval in approvalList"
        :key="approval.id"
        :color="approval.decision === 'approved' ? 'green' : approval.decision === 'rejected' ? 'red' : 'blue'"
      >
        <a-card size="small">
          <a-card-meta
            :title="approval.applicant_name"
            :description="`${approval.leave_type} — ${approval.duration} day(s)`"
          />
          <p style="margin-top: 8px">{{ approval.reason }}</p>
          <p class="date-range">{{ approval.start_time }} ~ {{ approval.end_time }}</p>
          <a-space style="margin-top: 8px">
            <a-button type="primary" size="small" @click="handleAction(approval.id, 'approve')">
              Approve
            </a-button>
            <a-popconfirm title="Reject this leave?" @confirm="handleAction(approval.id, 'reject')">
              <a-button danger size="small">Reject</a-button>
            </a-popconfirm>
          </a-space>
        </a-card>
      </a-timeline-item>
    </a-timeline>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const route = useRoute()

const approvalList = ref<any[]>([])

async function fetchPending() {
  try {
    approvalList.value = await $fetch('/api/approvals/pending') as any[]
  } catch { /* ignore */ }
}

async function handleAction(approvalId: number, action: 'approve' | 'reject') {
  try {
    const endpoint = action === 'approve' ? 'approve' : 'reject'
    await $fetch(`/api/approvals/${approvalId}/${endpoint}`, {
      method: 'POST',
      body: { comment: '' },
    })
    message.success(action === 'approve' ? 'Approved' : 'Rejected')
    await fetchPending()
  } catch (e: any) {
    message.error(e?.data?.statusMessage || 'Action failed')
  }
}

onMounted(fetchPending)
</script>

<style scoped>
.date-range {
  color: #999;
  font-size: 13px;
}
</style>
