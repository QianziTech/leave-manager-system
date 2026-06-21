<template>
  <div>
    <a-page-header title="系统设置" />

    <a-card title="请假审批策略" style="max-width: 600px">
      <a-form :model="form" layout="vertical" @finish="handleSave">
        <a-form-item label="多级审批天数阈值" help="超过此天数的请假需要二级审批">
          <a-input-number
            v-model:value="form.threshold"
            :min="0.5"
            :step="0.5"
            style="width: 200px"
            addon-after="天"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="saving">保存设置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ middleware: ['auth', 'admin'] })

const form = reactive({ threshold: 3 })
const saving = ref(false)

async function fetchSettings() {
  try {
    const settings = await $fetch('/api/settings') as Record<string, string>
    form.threshold = Number(settings.leave_multi_level_threshold) || 3
  } catch { /* ignore */ }
}

async function handleSave() {
  saving.value = true
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: { leave_multi_level_threshold: form.threshold },
    })
    message.success('设置已保存')
  } catch (e: any) {
    message.error(e?.data?.statusMessage || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>
