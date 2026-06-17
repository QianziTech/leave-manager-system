<template>
  <div>
    <a-page-header title="User Management">
      <template #extra>
        <a-button type="primary" @click="openCreateModal">
          <PlusOutlined /> Add User
        </a-button>
      </template>
    </a-page-header>

    <a-table :columns="columns" :data-source="users" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag>{{ roleLabels[record.role] }}</a-tag>
        </template>
        <template v-if="column.key === 'active'">
          <a-tag :color="record.active ? 'green' : 'red'">
            {{ record.active ? 'Active' : 'Inactive' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="openEditModal(record)">Edit</a-button>
            <a-popconfirm title="Deactivate this user?" @confirm="handleDelete(record.id)">
              <a-button size="small" danger :disabled="!record.active">Deactivate</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editingUser ? 'Edit User' : 'New User'"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="Username" required>
          <a-input v-model:value="form.username" :disabled="!!editingUser" />
        </a-form-item>
        <a-form-item label="Password" :required="!editingUser">
          <a-input-password v-model:value="form.password" />
        </a-form-item>
        <a-form-item label="Real Name" required>
          <a-input v-model:value="form.realName" />
        </a-form-item>
        <a-form-item label="Department" required>
          <a-input v-model:value="form.department" />
        </a-form-item>
        <a-form-item label="Role" required>
          <a-select v-model:value="form.role">
            <a-select-option value="employee">Employee</a-select-option>
            <a-select-option value="supervisor">Supervisor</a-select-option>
            <a-select-option value="dept_head">Department Head</a-select-option>
            <a-select-option value="admin">Admin</a-select-option>
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

const roleLabels: Record<string, string> = {
  employee: 'Employee',
  supervisor: 'Supervisor',
  dept_head: 'Dept Head',
  admin: 'Admin',
}

const users = ref<any[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editingUser = ref<any>(null)

const form = reactive({
  username: '',
  password: '',
  realName: '',
  department: '',
  role: 'employee',
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: 'Username', dataIndex: 'username', key: 'username' },
  { title: 'Name', dataIndex: 'real_name', key: 'name' },
  { title: 'Department', dataIndex: 'department', key: 'dept' },
  { title: 'Role', key: 'role' },
  { title: 'Status', key: 'active' },
  { title: 'Actions', key: 'actions', width: 200 },
]

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await $fetch('/api/users') as any[]
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingUser.value = null
  form.username = ''
  form.password = ''
  form.realName = ''
  form.department = ''
  form.role = 'employee'
  modalVisible.value = true
}

function openEditModal(user: any) {
  editingUser.value = user
  form.username = user.username
  form.password = ''
  form.realName = user.real_name
  form.department = user.department
  form.role = user.role
  modalVisible.value = true
}

async function handleSave() {
  try {
    if (editingUser.value) {
      await $fetch(`/api/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: {
          realName: form.realName,
          department: form.department,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        },
      })
    } else {
      await $fetch('/api/users', { method: 'POST', body: { ...form } })
    }
    modalVisible.value = false
    await fetchUsers()
  } catch (e: any) {
    message.error(e?.data?.statusMessage || 'Failed to save user')
  }
}

async function handleDelete(id: number) {
  await $fetch(`/api/users/${id}`, { method: 'DELETE' })
  await fetchUsers()
}

function resetForm() {
  editingUser.value = null
}

onMounted(fetchUsers)
</script>
