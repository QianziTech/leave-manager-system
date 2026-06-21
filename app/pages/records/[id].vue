<template>
  <div>
    <a-result
      v-if="notFound"
      status="404"
      title="记录不存在"
      sub-title="该请假记录不存在或已被删除"
    >
      <template #extra>
        <a-button type="primary" @click="$router.back()">返回</a-button>
      </template>
    </a-result>

    <a-result
      v-else-if="fetchError"
      status="error"
      title="加载失败"
      :sub-title="fetchError"
    >
      <template #extra>
        <a-space>
          <a-button @click="$router.back()">返回</a-button>
          <a-button type="primary" @click="fetchDetail">重试</a-button>
        </a-space>
      </template>
    </a-result>

    <a-spin v-else-if="!leave" :spinning="spinning" tip="加载中..." />

    <div v-else>
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

    <a-card title="状态流转记录" style="margin-bottom: 24px">
      <a-timeline v-if="statusLogs.length">
        <a-timeline-item
          v-for="log in statusLogs"
          :key="log.id"
          :color="statusLogColors[log.to_status] || 'blue'"
        >
          <p>
            <strong>{{ statusLogLabels[log.to_status] || log.to_status }}</strong>
          </p>
          <p class="log-meta">
            {{ log.operator_name }} · {{ log.created_at }}
          </p>
          <p v-if="log.comment" class="log-comment">备注：{{ log.comment }}</p>
        </a-timeline-item>
      </a-timeline>
      <a-empty v-else description="暂无状态记录" />
    </a-card>

    <a-card title="审批记录" style="margin-bottom: 24px">
      <a-timeline v-if="approvals.length">
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
      <a-empty v-else description="暂无审批记录" />
    </a-card>

    <ApprovalActions
      v-if="canApprove"
      :leave-id="leave.id"
      @done="refresh"
    />
  </div>
  </div>
</template>

<script setup lang="ts">
import { leaveTypeLabels, decisionLabels, approvalLevelLabels, statusLogLabels, statusLogColors } from '~/composables/useLabels'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { user } = useAuth()
const leave = ref<any>(null)
const approvals = ref<any[]>([])
const statusLogs = ref<any[]>([])
const editing = ref(false)
const notFound = ref(false)
const fetchError = ref<string | null>(null)
const spinning = ref(false)

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
  notFound.value = false
  fetchError.value = null
  spinning.value = true
  try {
    const result = await $fetch(`/api/leaves/${route.params.id}`) as any
    leave.value = result
    approvals.value = result.approvals || []
    statusLogs.value = result.statusLogs || []
  } catch (e: any) {
    if (e?.statusCode === 404) {
      notFound.value = true
    } else if (e?.statusCode === 403) {
      fetchError.value = '您没有权限查看该请假记录'
    } else {
      fetchError.value = e?.data?.statusMessage || '加载请假记录失败，请稍后重试'
    }
  } finally {
    spinning.value = false
  }
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
.log-meta {
  color: #999;
  font-size: 13px;
}
.log-comment {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}
</style>
