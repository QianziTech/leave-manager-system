<template>
  <div v-if="leave">
    <a-page-header :title="`请假详情 #${leave.id}`" @back="() => $router.back()">
      <template #extra>
        <a-space v-if="canWithdraw">
          <a-button danger @click="handleWithdraw">撤回</a-button>
        </a-space>
        <a-space v-if="canEdit">
          <a-button type="primary" @click="editing = true">编辑</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-descriptions bordered :column="2" style="margin-bottom: 24px">
      <a-descriptions-item label="请假类型">{{ leaveTypeLabels[leave.type] || leave.type }}</a-descriptions-item>
      <a-descriptions-item label="状态">
        <LeaveStatusTag :status="leave.status" />
      </a-descriptions-item>
      <a-descriptions-item label="申请人">{{ leave.applicant_name }}</a-descriptions-item>
      <a-descriptions-item label="部门">{{ leave.applicant_department }}</a-descriptions-item>
      <a-descriptions-item label="开始时间">{{ leave.start_time }}</a-descriptions-item>
      <a-descriptions-item label="结束时间">{{ leave.end_time }}</a-descriptions-item>
      <a-descriptions-item label="天数">{{ leave.duration }} 天</a-descriptions-item>
      <a-descriptions-item label="提交时间">{{ leave.created_at }}</a-descriptions-item>
    </a-descriptions>

    <a-card title="请假原因" style="margin-bottom: 24px">
      <p>{{ leave.reason }}</p>
    </a-card>

    <LeaveForm
      v-if="editing"
      :initial-values="{
        type: leave.type,
        startTime: leave.start_time,
        endTime: leave.end_time,
        duration: leave.duration,
        reason: leave.reason,
      }"
      @submit="handleEdit"
      @cancel="editing = false"
    />

    <a-card title="审批记录" style="margin-bottom: 24px">
      <a-timeline>
        <a-timeline-item
          v-for="approval in approvals"
          :key="approval.id"
          :color="approval.decision === 'approved' ? 'green' : approval.decision === 'rejected' ? 'red' : 'blue'"
        >
          <p>{{ approvalLevelLabels[approval.level] || `第${approval.level}级审批` }} — {{ approval.approver_name }}</p>
          <p v-if="approval.decision">
            审批结果: <strong>{{ decisionLabels[approval.decision] || approval.decision }}</strong>
          </p>
          <p v-if="approval.comment">审批意见: {{ approval.comment }}</p>
          <p v-if="!approval.decision" class="pending-text">等待审批中</p>
        </a-timeline-item>
      </a-timeline>
    </a-card>

    <ApprovalActions
      v-if="canApprove"
      :leave-id="leave.id"
      @done="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { leaveTypeLabels, decisionLabels, approvalLevelLabels } from '~/composables/useLabels'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { user } = useAuth()
const leave = ref<any>(null)
const approvals = ref<any[]>([])
const editing = ref(false)

const canEdit = computed(() =>
  user.value?.id === leave.value?.user_id && leave.value?.status === 'pending',
)
const canWithdraw = computed(() => canEdit.value)

const canApprove = computed(() => {
  if (!['supervisor', 'dept_head', 'admin'].includes(user.value?.role || '')) return false
  return approvals.value.some(
    (a: any) => a.approver_id === user.value?.id && a.decision === null,
  )
})

async function fetchDetail() {
  const result = await $fetch(`/api/leaves/${route.params.id}`) as any
  leave.value = result
  approvals.value = result.approvals || []
}

async function handleEdit(values: any) {
  await $fetch(`/api/leaves/${route.params.id}`, {
    method: 'PUT',
    body: values,
  })
  editing.value = false
  await fetchDetail()
}

async function handleWithdraw() {
  await $fetch(`/api/leaves/${route.params.id}`, { method: 'DELETE' })
  await fetchDetail()
}

async function refresh() {
  await fetchDetail()
}

onMounted(fetchDetail)
</script>

<style scoped>
.pending-text {
  color: #1677ff;
}
</style>