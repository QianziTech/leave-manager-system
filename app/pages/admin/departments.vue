<template>
  <div>
    <a-page-header title="部门管理">
      <template #extra>
        <a-button type="primary" @click="openCreateModal">
          <PlusOutlined /> 新增部门
        </a-button>
      </template>
    </a-page-header>

    <a-table :columns="columns" :data-source="departments" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'manager'">
          {{ record.manager_name || '未指定' }}
        </template>
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="openEditModal(record)">编辑</a-button>
            <a-popconfirm
              title="确定删除该部门？请确保部门下无在职员工"
              @confirm="handleDelete(record.id)"
            >
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editingDept ? '编辑部门' : '新增部门'"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="部门名称" required>
          <a-input v-model:value="form.name" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item label="部门经理">
          <a-select
            v-model:value="form.managerId"
            placeholder="请选择部门经理（可选）"
            allow-clear
            show-search
            :filter-option="filterUserOption"
          >
            <a-select-option
              v-for="u in managerCandidates"
              :key="u.id"
              :value="u.id"
            >
              {{ u.real_name }} ({{ u.username }})
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

definePageMeta({ middleware: ['auth', 'admin'] })

const departments = ref<any[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editingDept = ref<any>(null)
const managerCandidates = ref<any[]>([])

const form = reactive({
  name: '',
  managerId: undefined as number | undefined,
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '部门名称', dataIndex: 'name', key: 'name' },
  { title: '部门经理', key: 'manager' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  { title: '操作', key: 'actions', width: 200 },
]

function filterUserOption(input: string, option: any) {
  return option.children?.toString().toLowerCase().includes(input.toLowerCase())
}

async function fetchDepartments() {
  loading.value = true
  try {
    departments.value = await $fetch('/api/departments') as any[]
  } finally {
    loading.value = false
  }
}

async function fetchManagerCandidates() {
  const users = await $fetch('/api/users') as any[]
  managerCandidates.value = users.filter(
    (u: any) => ['supervisor', 'dept_head', 'admin'].includes(u.role) && u.active,
  )
}

function openCreateModal() {
  editingDept.value = null
  form.name = ''
  form.managerId = undefined
  modalVisible.value = true
}

function openEditModal(dept: any) {
  editingDept.value = dept
  form.name = dept.name
  form.managerId = dept.manager_id
  modalVisible.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    message.error('请输入部门名称')
    return
  }
  try {
    if (editingDept.value) {
      await $fetch(`/api/departments/${editingDept.value.id}`, {
        method: 'PUT',
        body: { name: form.name.trim(), managerId: form.managerId ?? null },
      })
    } else {
      await $fetch('/api/departments', {
        method: 'POST',
        body: { name: form.name.trim(), managerId: form.managerId ?? null },
      })
    }
    modalVisible.value = false
    await fetchDepartments()
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '保存部门失败')
  }
}

async function handleDelete(id: number) {
  try {
    await $fetch(`/api/departments/${id}`, { method: 'DELETE' })
    await fetchDepartments()
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '删除部门失败')
  }
}

function resetForm() {
  editingDept.value = null
}

onMounted(() => {
  fetchDepartments()
  fetchManagerCandidates()
})
</script>
