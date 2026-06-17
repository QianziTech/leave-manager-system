<template>
  <a-layout-header class="header">
    <div class="header-right">
      <a-dropdown>
        <a-space class="user-info">
          <UserOutlined />
          {{ user?.realName }}
          <span class="role-tag">{{ roleLabel }}</span>
        </a-space>
        <template #overlay>
          <a-menu>
            <a-menu-item key="profile" @click="navigateTo('/profile')">
              <UserOutlined /> Profile
            </a-menu-item>
            <a-menu-item key="logout" @click="handleLogout">
              <LogoutOutlined /> Logout
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { UserOutlined, LogoutOutlined } from '@ant-design/icons-vue'

const { user, logout } = useAuth()

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    employee: 'Employee',
    supervisor: 'Supervisor',
    dept_head: 'Dept Head',
    admin: 'Admin',
  }
  return labels[user.value?.role || ''] || ''
})

async function handleLogout() {
  await logout()
}
</script>

<style scoped>
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.user-info {
  cursor: pointer;
}
.role-tag {
  color: #999;
  font-size: 12px;
}
</style>
