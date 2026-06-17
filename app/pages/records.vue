<template>
  <div>
    <a-page-header title="Leave Records">
      <template #extra>
        <a-button type="primary" @click="navigateTo('/apply')">
          <FormOutlined /> Apply Leave
        </a-button>
      </template>
    </a-page-header>

    <a-space direction="vertical" :size="16" style="width: 100%">
      <a-space>
        <a-select
          v-model:value="filters.status"
          placeholder="Filter by status"
          allow-clear
          style="width: 160px"
          @change="fetchData"
        >
          <a-select-option value="pending">Pending</a-select-option>
          <a-select-option value="approved">Approved</a-select-option>
          <a-select-option value="rejected">Rejected</a-select-option>
          <a-select-option value="withdrawn">Withdrawn</a-select-option>
        </a-select>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
        @row-click="handleRowClick"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <LeaveStatusTag :status="record.status" />
          </template>
          <template v-if="column.key === 'duration'">
            {{ record.duration }} day(s)
          </template>
        </template>
      </a-table>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { FormOutlined } from '@ant-design/icons-vue'

definePageMeta({ middleware: 'auth' })

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
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Applicant', dataIndex: 'applicant_name', key: 'applicant' },
  { title: 'Department', dataIndex: 'applicant_department', key: 'dept' },
  { title: 'Start', dataIndex: 'start_time', key: 'start' },
  { title: 'End', dataIndex: 'end_time', key: 'end' },
  { title: 'Duration', key: 'duration' },
  { title: 'Status', key: 'status' },
  { title: 'Created', dataIndex: 'created_at', key: 'created' },
]

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

function handleRowClick(record: any) {
  navigateTo(`/records/${record.id}`)
}

onMounted(fetchData)
</script>
