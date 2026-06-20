<template>
  <a-layout-sider v-model:collapsed="collapsed" collapsible class="sidebar">
    <div class="logo">
      <span v-if="!collapsed">请假管理</span>
      <span v-else>请假</span>
    </div>
    <a-menu
      theme="dark"
      mode="inline"
      :selected-keys="[route.path]"
      @click="handleMenuClick"
    >
      <a-menu-item key="/records">
        <FileTextOutlined />
        <span>请假记录</span>
      </a-menu-item>
      <a-menu-item key="/apply">
        <FormOutlined />
        <span>申请请假</span>
      </a-menu-item>
      <a-menu-item v-if="canApprove" key="/approvals">
        <CheckCircleOutlined />
        <span>待审批</span>
      </a-menu-item>
      <a-menu-item key="/profile">
        <UserOutlined />
        <span>个人中心</span>
      </a-menu-item>
      <a-menu-item v-if="isAdmin" key="/admin/users">
        <SettingOutlined />
        <span>用户管理</span>
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script setup lang="ts">
import {
  FileTextOutlined,
  FormOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const collapsed = ref(false)

const isAdmin = computed(() => user.value?.role === 'admin')
const canApprove = computed(() =>
  ['supervisor', 'dept_head', 'admin'].includes(user.value?.role || ''),
)

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}
</script>

<style scoped>
.sidebar {
  overflow: auto;
}
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}
</style>