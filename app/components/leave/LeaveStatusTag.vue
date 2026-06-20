<template>
  <a-tag :color="color">{{ label }}</a-tag>
</template>

<script setup lang="ts">
import { leaveStatusLabels } from '~/composables/useLabels'

const props = defineProps<{ status: string }>()

const statusConfig: Record<string, { color: string }> = {
  pending: { color: 'processing' },
  approved: { color: 'success' },
  rejected: { color: 'error' },
  withdrawn: { color: 'default' },
}

const color = computed(() => statusConfig[props.status]?.color || 'default')
const label = computed(() => leaveStatusLabels[props.status] || props.status)
</script>