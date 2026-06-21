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
          <p class="date-range">{{ formatDateTime(approval.start_time) }} ~ {{ formatDateTime(approval.end_time) }}</p>
          <p class="dept-info">{{ approval.applicant_department }}</p>
          <a-space style="margin-top: 8px" @click.stop>
            <a-button type="primary" size="small" @click.prevent="openActionModal(approval, 'approve')">
              通过
            </a-button>
            <a-button danger size="small" @click.prevent="openActionModal(approval, 'reject')">
              拒绝
            </a-button>
          </a-space>
        </a-card>
        </NuxtLink>
      </a-timeline-item>
    </a-timeline>
    <a-empty v-else description="暂无待审批记录" />

    <a-modal
      v-model:open="actionModalVisible"
      :title="actionType === 'approve' ? '通过审批' : '拒绝审批'"
      :ok-text="actionType === 'approve' ? '确认通过' : '确认拒绝'"
      cancel-text="取消"
      :confirm-loading="actionLoading"
      @ok="handleAction"
      @cancel="resetActionModal"
    >
      <a-form layout="vertical">
        <a-form-item label="审批意见">
          <a-textarea
            v-model:value="actionComment"
            :rows="3"
            placeholder="可选填写审批意见"
            :maxlength="200"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { leaveTypeLabels } from '~/composables/useLabels'

definePageMeta({ middleware: 'auth' })

const approvalList = ref<any[]>([])
const { formatDateTime } = useDateTime()
const actionModalVisible = ref(false)
const actionLoading = ref(false)
const actionType = ref<'approve' | 'reject'>('approve')
const selectedApproval = ref<any>(null)
const actionComment = ref('')

async function fetchPending() {
  try {
    approvalList.value = await $fetch('/api/approvals/pending') as any[]
  } catch { /* ignore */ }
}

function openActionModal(approval: any, action: 'approve' | 'reject') {
  selectedApproval.value = approval
  actionType.value = action
  actionComment.value = ''
  actionModalVisible.value = true
}

function resetActionModal() {
  actionModalVisible.value = false
  selectedApproval.value = null
  actionComment.value = ''
  actionLoading.value = false
}

async function handleAction() {
  if (!selectedApproval.value) return

  actionLoading.value = true
  try {
    const endpoint = actionType.value === 'approve' ? 'approve' : 'reject'
    await $fetch(`/api/approvals/${selectedApproval.value.id}/${endpoint}`, {
      method: 'POST',
      body: { comment: actionComment.value.trim() },
    })
    message.success(actionType.value === 'approve' ? '已通过审批' : '已拒绝审批')
    resetActionModal()
    await fetchPending()
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '操作失败')
  } finally {
    actionLoading.value = false
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
