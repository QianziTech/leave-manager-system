<template>
  <div>
    <a-page-header title="请假记录">
      <template #extra>
        <a-button type="primary" @click="router.push('/apply')">
          <FormOutlined /> 申请请假
        </a-button>
      </template>
    </a-page-header>

    <a-space direction="vertical" :size="16" style="width: 100%">
      <a-space>
        <a-select
          v-model:value="filters.status"
          placeholder="按状态筛选"
          allow-clear
          style="width: 160px"
          @change="fetchData"
        >
          <a-select-option value="pending">待审批</a-select-option>
          <a-select-option value="approved">已通过</a-select-option>
          <a-select-option value="rejected">已拒绝</a-select-option>
          <a-select-option value="withdrawn">已撤回</a-select-option>
        </a-select>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :custom-row="customRow"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            {{ leaveTypeLabels[record.type] || record.type }}
          </template>
          <template v-if="column.key === 'status'">
            <LeaveStatusTag :status="record.status" />
          </template>
          <template v-if="column.key === 'duration'">
            {{ record.duration }} 天
          </template>
          <template v-if="column.key === 'actions'">
            <NuxtLink :to="`/records/${record.id}`">查看详情</NuxtLink>
          </template>
        </template>
      </a-table>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { FormOutlined } from '@ant-design/icons-vue'
import { leaveTypeLabels } from '~/composables/useLabels'

definePageMeta({ middleware: 'auth' })

const router = useRouter()

const data = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const filters = reactive({
  status: undefined as string | undefined,
})

const columns = [
  { title: '请假类型', key: 'type', width: 80 },
  { title: '申请人', dataIndex: 'applicant_name', key: 'applicant', width: 100 },
  { title: '部门', dataIndex: 'applicant_department', key: 'dept', width: 100 },
  { title: '开始时间', dataIndex: 'start_time', key: 'start', width: 160 },
  { title: '结束时间', dataIndex: 'end_time', key: 'end', width: 160 },
  { title: '天数', key: 'duration', width: 70 },
  { title: '状态', key: 'status', width: 80 },
  { title: '提交时间', dataIndex: 'created_at', key: 'created', width: 160 },
  { title: '操作', key: 'actions', width: 80 },
]

function customRow() {
  return { style: { cursor: 'pointer' } }
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    }
    if (filters.status) params.status = filters.status

    const result = await $fetch('/api/leaves', { params }) as any
    data.value = result.list
    pagination.total = result.total
  } finally {
    loading.value = false
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

onMounted(fetchData)
</script>
