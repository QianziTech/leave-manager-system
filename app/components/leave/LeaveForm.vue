<template>
  <a-card title="请假申请">
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <a-form-item label="请假类型" name="type">
        <a-select v-model:value="form.type" placeholder="请选择请假类型">
          <a-select-option value="sick">病假</a-select-option>
          <a-select-option value="personal">事假</a-select-option>
          <a-select-option value="annual">年假</a-select-option>
          <a-select-option value="other">其他</a-select-option>
        </a-select>
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="开始时间" name="startTime">
            <a-date-picker
              v-model:value="form.startTime"
              show-time
              style="width: 100%"
              @change="calcDuration"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="结束时间" name="endTime">
            <a-date-picker
              v-model:value="form.endTime"
              show-time
              style="width: 100%"
              @change="calcDuration"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="请假天数">
        <a-input-number v-model:value="form.duration" :min="0.5" :step="0.5" style="width: 160px" addon-after="天" />
      </a-form-item>

      <a-form-item label="请假原因" name="reason">
        <a-textarea v-model:value="form.reason" :rows="4" placeholder="请输入请假原因" />
      </a-form-item>

      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">提交</a-button>
          <a-button v-if="showCancel" @click="$emit('cancel')">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const props = defineProps<{
  initialValues?: Record<string, any>
  showCancel?: boolean
}>()

const emit = defineEmits<{
  submit: [values: Record<string, any>]
  cancel: []
}>()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  type: props.initialValues?.type || undefined,
  startTime: props.initialValues?.startTime ? dayjs(props.initialValues.startTime) : undefined,
  endTime: props.initialValues?.endTime ? dayjs(props.initialValues.endTime) : undefined,
  duration: props.initialValues?.duration || undefined,
  reason: props.initialValues?.reason || '',
})

const rules = {
  type: [{ required: true, message: '请选择请假类型' }],
  startTime: [{ required: true, message: '请选择开始时间' }],
  endTime: [{ required: true, message: '请选择结束时间' }],
  reason: [{ required: true, message: '请输入请假原因' }],
}

function calcDuration() {
  if (form.startTime && form.endTime) {
    const diff = dayjs(form.endTime).diff(dayjs(form.startTime), 'hour') / 24
    form.duration = Math.max(0.5, Math.round(diff * 2) / 2)
  }
}

async function handleSubmit() {
  submitting.value = true
  try {
    emit('submit', {
      type: form.type,
      startTime: form.startTime?.toISOString(),
      endTime: form.endTime?.toISOString(),
      duration: form.duration,
      reason: form.reason,
    })
  } finally {
    submitting.value = false
  }
}
</script>