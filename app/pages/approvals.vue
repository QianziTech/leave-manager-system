<template>
  <div>
    <a-page-header title="待审批列表" />
    <a-timeline>
      <a-timeline-item
        v-for="approval in approvalList"
        :key="approval.id"
        :color="approval.decision === 'approved' ? 'green' : approval.decision === 'rejected' ? 'red' : 'blue'"
      >
        <a-card size="small">
          <a-card-meta
            :title="approval.applicant_name"
            :description="`${leaveTypeLabels[approval.leave_type] || approval.leave_type} — ${approval.duration} 天`"
          />
          <p style="margin-top: 8px">{{ approval.reason }}</p>
          <p class="date-range">{{ approval.start_time }} ~ {{ approval.end_time }}</p>
          <a-space style="margin-top: 8px">
            <a-button type="primary" size="small" @click="handleAction(approval.id, 'approve')">
              通过
            </a-button>
            <a-popconfirm title="确定拒绝此请假申请？" @confirm="handleAction(approval.id, 'reject')">
              <a-button danger size="small">拒绝</a-button>
            </a-popconfirm>
          </a-space>
        </a-card>
      </a-timeline-item>
    </a-timeline>
    <a-empty v-if="!approvalList.length" description="暂无待审批记录" />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { leaveTypeLabels } from '~/composables/useLabels'

definePageMeta({ middleware: 'auth' })

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
    message.success(action === 'approve' ? '已通过审批' : '已拒绝审批')
    await fetchPending()
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '操作失败')
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