<template>
  <a-modal
    :open="visible"
    title="审批流程确认"
    @ok="$emit('confirm')"
    @cancel="$emit('cancel')"
    :confirm-loading="loading"
    ok-text="确认提交"
    cancel-text="取消"
  >
    <a-descriptions bordered :column="1" size="small" style="margin-bottom: 16px">
      <a-descriptions-item label="申请人">{{ previewData?.applicantName }}</a-descriptions-item>
      <a-descriptions-item label="部门">{{ previewData?.departmentName }}</a-descriptions-item>
      <a-descriptions-item label="请假天数">{{ formDuration }} 天</a-descriptions-item>
      <a-descriptions-item label="审批级别">
        <a-tag :color="previewData?.needMultiLevel ? 'orange' : 'blue'">
          {{ previewData?.needMultiLevel ? '二级审批' : '一级审批' }}
        </a-tag>
      </a-descriptions-item>
    </a-descriptions>

    <a-divider />

    <div v-if="previewData?.levels?.length">
      <a-timeline>
        <a-timeline-item
          v-for="(lvl, idx) in previewData.levels"
          :key="idx"
          :color="idx === 0 ? 'blue' : 'orange'"
        >
          <p>
            <strong>第{{ lvl.level }}级审批</strong>
            — {{ roleLabels[lvl.role] || lvl.role }}
          </p>
          <p class="approver-name">审批人：{{ lvl.approverName || '待分配' }}</p>
        </a-timeline-item>
      </a-timeline>
    </div>
    <a-empty v-else description="暂无需审批人" />

    <a-alert
      v-if="!previewData?.levels?.length"
      type="warning"
      message="提交后将直接生成请假记录，无需审批。"
      style="margin-top: 12px"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { roleLabels } from '~/composables/useLabels'

defineProps<{
  visible: boolean
  previewData: {
    levels: Array<{ level: number; role: string; approverName: string; approverId: number | null }>
    needMultiLevel: boolean
    threshold: number
    applicantName: string
    departmentName: string
  } | null
  loading: boolean
  formDuration: number
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.approver-name {
  color: #666;
  font-size: 13px;
}
</style>
