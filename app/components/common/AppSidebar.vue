<template>
  <a-layout-sider v-model:collapsed="collapsed" collapsible class="sidebar">
    <div class="logo">
      <span v-if="!collapsed">请假管理</span>
      <span v-else>请假</span>
    </div>
    <a-menu
      theme="dark"
      mode="inline"
      :selected-keys="[currentMenuKey]"
      @click="handleMenuClick"
    >
      <template v-for="item in displayItems" :key="item.id">
        <a-menu-divider v-if="item._type === 'divider'" />
        <a-menu-item v-else :key="item.path">
          <component :is="getIcon(item.icon)" />
          <span>{{ item.label }}</span>
        </a-menu-item>
      </template>
    </a-menu>
  </a-layout-sider>
</template>

<script setup lang="ts">
import {
  FileTextOutlined,
  FormOutlined,
  CheckCircleOutlined,
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ControlOutlined,
  MenuOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const collapsed = ref(false)
const menuItems = ref<any[]>([])

const iconMap: Record<string, any> = {
  FileTextOutlined, FormOutlined, CheckCircleOutlined,
  UserOutlined, TeamOutlined, ApartmentOutlined,
  ControlOutlined, MenuOutlined,
}

const displayItems = computed(() => {
  const result: any[] = []
  for (let i = 0; i < menuItems.value.length; i++) {
    const item = menuItems.value[i]
    const prev = menuItems.value[i - 1]
    if (item.path.startsWith('/admin/') && (!prev || !prev.path.startsWith('/admin/'))) {
      result.push({ _type: 'divider', id: 'divider' })
    }
    result.push({ _type: 'item', ...item })
  }
  return result
})

function getIcon(name: string) {
  return iconMap[name]
}

function handleMenuClick({ key }: { key: string }) {
  if (key) router.push(key)
}

const currentMenuKey = computed(() => {
  const p = route.path
  const match = menuItems.value.find((m: any) => p === m.path || p.startsWith(m.path + '/'))
  return match?.path || p
})

onMounted(async () => {
  try {
    menuItems.value = await $fetch('/api/menus') as any[]
  } catch { /* keep empty on error */ }
})
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
