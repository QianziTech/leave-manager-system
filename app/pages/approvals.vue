<template>
  <div>
    <a-page-header title="待审批列表" />
    <a-timeline v-if="approvalList.length">
      <a-timeline-item
        v-for="approval in approvalList"
        :key="approval.id"
        :color="approval.decision === 'approved' ? 'green' : approval.decision === 'rejected' ? 'red' : 'blue'"
      >
        <NuxtLink :to="`/records/${approval.leave_id}`">
          <a-card size="small" hoverable>
            <a-card-meta
            :title="approval.applicant_name"
            :description="`${leaveTypeLabels[approval.leave_type] || approval.leave_type} — ${approval.duration} 天`"
          />
          <p style="margin-top: 8px">{{ approval.reason }}</p>
          <p class="date-range">{{ approval.start_time }} ~ {{ approval.end_time }}</p>
          <p class="dept-info">{{ approval.applicant_department }}</p>
          <a-space style="margin-top: 8px" @click.stop>
            <a-button type="primary" size="small" @click="handleAction(approval.id, 'approve')">
              通过
            </a-button>
            <a-popconfirm title="确定拒绝此请假申请？" @confirm="handleAction(approval.id, 'reject')">
              <a-button danger size="small">拒绝</a-button>
            </a-popconfirm>
          </a-space>
        </a-card>
        </NuxtLink>
      </a-timeline-item>
    </a-timeline>
    <a-empty v-else description="暂无待审批记录" />
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
.dept-info {
  color: #999;
  font-size: 12px;
}
</style>
