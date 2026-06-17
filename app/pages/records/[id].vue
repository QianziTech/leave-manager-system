<template>
  <div v-if="leave">
    <a-page-header :title="`Leave #${leave.id}`" @back="() => $router.back()">
      <template #extra>
        <a-space v-if="canWithdraw">
          <a-button @click="handleWithdraw">Withdraw</a-button>
        </a-space>
        <a-space v-if="canEdit">
          <a-button type="primary" @click="editing = true">Edit</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-descriptions bordered :column="2" style="margin-bottom: 24px">
      <a-descriptions-item label="Type">{{ leave.type }}</a-descriptions-item>
      <a-descriptions-item label="Status">
        <LeaveStatusTag :status="leave.status" />
      </a-descriptions-item>
      <a-descriptions-item label="Applicant">{{ leave.applicant_name }}</a-descriptions-item>
      <a-descriptions-item label="Department">{{ leave.applicant_department }}</a-descriptions-item>
      <a-descriptions-item label="Start">{{ leave.start_time }}</a-descriptions-item>
      <a-descriptions-item label="End">{{ leave.end_time }}</a-descriptions-item>
      <a-descriptions-item label="Duration">{{ leave.duration }} day(s)</a-descriptions-item>
      <a-descriptions-item label="Created">{{ leave.created_at }}</a-descriptions-item>
    </a-descriptions>

    <a-card title="Reason" style="margin-bottom: 24px">
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

    <a-card title="Approval History" style="margin-bottom: 24px">
      <a-timeline>
        <a-timeline-item
          v-for="approval in approvals"
          :key="approval.id"
          :color="approval.decision === 'approved' ? 'green' : approval.decision === 'rejected' ? 'red' : 'blue'"
        >
          <p>Level {{ approval.level }} — {{ approval.approver_name }}</p>
          <p v-if="approval.decision">
            Decision: <strong>{{ approval.decision }}</strong>
          </p>
          <p v-if="approval.comment">Comment: {{ approval.comment }}</p>
          <p v-if="!approval.decision" class="pending-text">Awaiting decision</p>
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
