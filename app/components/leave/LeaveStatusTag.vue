<template>
  <a-tag :color="color">{{ label }}</a-tag>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'processing', label: 'Pending' },
  approved: { color: 'success', label: 'Approved' },
  rejected: { color: 'error', label: 'Rejected' },
  withdrawn: { color: 'default', label: 'Withdrawn' },
}

const color = computed(() => statusMap[props.status]?.color || 'default')
const label = computed(() => statusMap[props.status]?.label || props.status)
</script>
