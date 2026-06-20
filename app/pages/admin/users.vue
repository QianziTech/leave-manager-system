<template>
  <div>
    <a-page-header title="用户管理">
      <template #extra>
        <a-button type="primary" @click="openCreateModal">
          <PlusOutlined /> 新增用户
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
            {{ record.active ? '在职' : '离职' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="openEditModal(record)">编辑</a-button>
            <a-popconfirm title="确定停用该用户？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger :disabled="!record.active">停用</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editingUser ? '编辑用户' : '新增用户'"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model:value="form.username" :disabled="!!editingUser" />
        </a-form-item>
        <a-form-item label="密码" :required="!editingUser">
          <a-input-password v-model:value="form.password" />
        </a-form-item>
        <a-form-item label="姓名" required>
          <a-input v-model:value="form.realName" />
        </a-form-item>
        <a-form-item label="部门" required>
          <a-input v-model:value="form.department" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model:value="form.role">
            <a-select-option value="employee">员工</a-select-option>
            <a-select-option value="supervisor">主管</a-select-option>
            <a-select-option value="dept_head">部门经理</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { roleLabels } from '~/composables/useLabels'

definePageMeta({ middleware: ['auth', 'admin'] })

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
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'real_name', key: 'name' },
  { title: '部门', dataIndex: 'department', key: 'dept' },
  { title: '角色', key: 'role' },
  { title: '状态', key: 'active' },
  { title: '操作', key: 'actions', width: 200 },
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
    message.error(e?.data?.statusMessage || '保存用户失败')
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