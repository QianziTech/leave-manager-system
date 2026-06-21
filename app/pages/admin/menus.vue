<template>
  <div>
    <a-page-header title="菜单管理">
      <template #extra>
        <a-button type="primary" :loading="saving" @click="handleSave">保存修改</a-button>
      </template>
    </a-page-header>

    <a-card>
      <a-table :columns="columns" :data-source="menus" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">
            <a-tag v-for="r in record.roles" :key="r" :color="roleTagColors[r]">
              {{ roleLabels[r] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'visible'">
            <a-switch v-model:checked="record.visible" :checked-value="1" :unchecked-value="0" size="small" />
            <a-tag v-if="record.visible === 0" color="orange" style="margin-left: 4px">已隐藏</a-tag>
          </template>
          <template v-if="column.key === 'enabled'">
            <a-switch v-model:checked="record.enabled" :checked-value="1" :unchecked-value="0" size="small" />
            <a-tag v-if="record.enabled === 0" color="red" style="margin-left: 4px">已禁用</a-tag>
          </template>
          <template v-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="editOpen"
      title="编辑菜单项"
      @ok="handleEditOk"
      :confirm-loading="editSaving"
    >
      <a-form :model="editForm" layout="vertical" v-if="editForm">
        <a-form-item label="菜单名称">
          <a-input v-model:value="editForm.label" />
        </a-form-item>
        <a-form-item label="路径">
          <a-input :value="editForm.path" disabled />
        </a-form-item>
        <a-form-item label="图标名称">
          <a-select v-model:value="editForm.icon" show-search>
            <a-select-option v-for="ic in iconOptions" :key="ic" :value="ic">{{ ic }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="可见角色">
          <a-checkbox-group v-model:value="editForm.roles" :options="roleOptions" />
        </a-form-item>
        <a-form-item label="排序号">
          <a-input-number v-model:value="editForm.sort_order" :min="0" :max="99" />
        </a-form-item>
        <a-form-item label="侧边栏显示">
          <a-switch v-model:checked="editForm.visible" :checked-value="1" :unchecked-value="0" />
          <span style="margin-left: 8px; color: #999; font-size: 13px">
            关闭后路由仍可访问，但不出现在侧边栏
          </span>
        </a-form-item>
        <a-form-item label="路由启用">
          <a-switch v-model:checked="editForm.enabled" :checked-value="1" :unchecked-value="0" />
          <span style="margin-left: 8px; color: #999; font-size: 13px">
            关闭后所有角色均无法访问该路由
          </span>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { roleLabels } from '~/composables/useLabels'

definePageMeta({ middleware: ['auth', 'admin'] })

const menus = ref<any[]>([])
const saving = ref(false)
const editOpen = ref(false)
const editSaving = ref(false)
const editForm = ref<any>(null)

const roleOptions = [
  { label: '员工', value: 'employee' },
  { label: '主管', value: 'supervisor' },
  { label: '部门经理', value: 'dept_head' },
  { label: '管理员', value: 'admin' },
]

const roleTagColors: Record<string, string> = {
  employee: 'blue',
  supervisor: 'green',
  dept_head: 'purple',
  admin: 'red',
}

const iconOptions = [
  'FileTextOutlined', 'FormOutlined', 'CheckCircleOutlined',
  'UserOutlined', 'TeamOutlined', 'ApartmentOutlined',
  'ControlOutlined', 'MenuOutlined',
]

const columns = [
  { title: '名称', dataIndex: 'label', key: 'label' },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: '图标', dataIndex: 'icon', key: 'icon' },
  { title: '可见角色', key: 'roles' },
  { title: '侧边栏', key: 'visible', width: 100 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'actions', width: 80 },
]

async function fetchMenus() {
  try {
    const result = await $fetch('/api/menus/config') as any[]
    menus.value = result.map((m: any) => ({
      ...m,
      visible: m.visible as number,
      enabled: m.enabled as number,
    }))
  } catch { /* ignore */ }
}

function openEdit(record: any) {
  editForm.value = { ...record, roles: [...record.roles] }
  editOpen.value = true
}

function handleEditOk() {
  const idx = menus.value.findIndex((m: any) => m.id === editForm.value.id)
  if (idx >= 0) {
    menus.value[idx] = { ...editForm.value, roles: [...editForm.value.roles] }
  }
  editOpen.value = false
}

async function handleSave() {
  saving.value = true
  try {
    await $fetch('/api/menus', {
      method: 'PUT',
      body: { menus: menus.value },
    })
    message.success('菜单配置已保存')
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(fetchMenus)
</script>
