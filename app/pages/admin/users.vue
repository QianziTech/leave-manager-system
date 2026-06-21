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
        <template v-if="column.key === 'department'">
          {{ record.department_name || '-' }}
        </template>
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
          <a-select
            v-model:value="form.departmentId"
            placeholder="请选择部门"
            show-search
            :filter-option="filterDeptOption"
          >
            <a-select-option
              v-for="d in departments"
              :key="d.id"
              :value="d.id"
            >
              {{ d.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="直属上级">
          <a-select
            v-model:value="form.supervisorId"
            placeholder="请选择直属上级（可选）"
            allow-clear
            show-search
            :filter-option="filterUserOption"
          >
            <a-select-option
              v-for="u in supervisorCandidates"
              :key="u.id"
              :value="u.id"
            >
              {{ u.real_name }} ({{ u.username }})
            </a-select-option>
          </a-select>
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
const departments = ref<any[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editingUser = ref<any>(null)

const form = reactive({
  username: '',
  password: '',
  realName: '',
  departmentId: undefined as number | undefined,
  role: 'employee',
  supervisorId: undefined as number | undefined,
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'real_name', key: 'name' },
  { title: '部门', key: 'department' },
  { title: '角色', key: 'role' },
  { title: '状态', key: 'active', width: 80 },
  { title: '操作', key: 'actions', width: 200 },
]

const supervisorCandidates = computed(() => {
  if (!form.departmentId) {
    return []
  }

  return users.value.filter((u: any) =>
    u.active
    && u.role === 'supervisor'
    && u.department_id === form.departmentId
    && u.id !== editingUser.value?.id,
  )
})

watch(
  () => [form.departmentId, form.role, users.value] as const,
  () => {
    if (!form.supervisorId) {
      return
    }

    const exists = supervisorCandidates.value.some((u: any) => u.id === form.supervisorId)
    if (!exists) {
      form.supervisorId = undefined
    }
  },
)

function filterDeptOption(input: string, option: any) {
  return option.children?.toString().toLowerCase().includes(input.toLowerCase())
}

function filterUserOption(input: string, option: any) {
  return option.children?.toString().toLowerCase().includes(input.toLowerCase())
}

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await $fetch('/api/users') as any[]
  } finally {
    loading.value = false
  }
}

async function fetchDepartments() {
  departments.value = await $fetch('/api/departments/list') as any[]
}

async function openCreateModal() {
  await fetchUsers()
  editingUser.value = null
  form.username = ''
  form.password = ''
  form.realName = ''
  form.departmentId = undefined
  form.role = 'employee'
  form.supervisorId = undefined
  modalVisible.value = true
}

async function openEditModal(user: any) {
  await fetchUsers()
  const latestUser = users.value.find((u: any) => u.id === user.id) || user
  editingUser.value = latestUser
  form.username = latestUser.username
  form.password = ''
  form.realName = latestUser.real_name
  form.departmentId = latestUser.department_id
  form.role = latestUser.role
  form.supervisorId = latestUser.supervisor_id
  modalVisible.value = true
}

async function handleSave() {
  if (!form.departmentId) {
    message.error('请选择部门')
    return
  }
  try {
    if (editingUser.value) {
      await $fetch(`/api/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: {
          realName: form.realName,
          departmentId: form.departmentId,
          role: form.role,
          supervisorId: form.supervisorId ?? null,
          ...(form.password ? { password: form.password } : {}),
        },
      })
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: {
          username: form.username,
          password: form.password,
          realName: form.realName,
          departmentId: form.departmentId,
          role: form.role,
          supervisorId: form.supervisorId ?? null,
        },
      })
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

onMounted(() => {
  fetchUsers()
  fetchDepartments()
})
</script>
