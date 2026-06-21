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

      <a-form-item label="请假时间" name="timeRange">
        <a-range-picker
          v-model:value="form.timeRange"
          :show-time="{ format: 'HH:mm' }"
          format="YYYY-MM-DD HH:mm"
          style="width: 100%"
          :disabled-date="disabledDate"
          :disabled-time="disabledTime"
          :placeholder="['开始时间', '结束时间']"
          @change="calcDuration"
        />
      </a-form-item>

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
  timeRange: props.initialValues?.startTime && props.initialValues?.endTime
    ? [dayjs(props.initialValues.startTime), dayjs(props.initialValues.endTime)]
    : undefined,
  duration: props.initialValues?.duration || undefined,
  reason: props.initialValues?.reason || '',
})

const rules = {
  type: [{ required: true, message: '请选择请假类型' }],
  timeRange: [{ required: true, validator: validateTimeRange, trigger: 'change' }],
  reason: [{ required: true, message: '请输入请假原因' }],
}

function calcDuration() {
  const [startTime, endTime] = form.timeRange || []
  if (startTime && endTime) {
    const diff = dayjs(endTime).diff(dayjs(startTime), 'hour') / 24
    form.duration = Math.max(0.5, Math.round(diff * 2) / 2)
  }
}

function validateTimeRange(_rule: any, value: any) {
  const [startTime, endTime] = value || []

  if (!startTime || !endTime) {
    return Promise.reject(new Error('请选择请假时间段'))
  }
  if (dayjs(startTime).isBefore(dayjs().startOf('day'))) {
    return Promise.reject(new Error('开始日期不能早于今天'))
  }
  if (dayjs(endTime).isBefore(dayjs(startTime))) {
    return Promise.reject(new Error('结束时间不能早于开始时间'))
  }

  return Promise.resolve()
}

function disabledDate(current: any) {
  return current && dayjs(current).isBefore(dayjs().startOf('day'))
}

function disabledTime(current: any, type: 'start' | 'end') {
  const startTime = form.timeRange?.[0]
  if (type !== 'end' || !current || !startTime || !dayjs(current).isSame(startTime, 'day')) {
    return {}
  }

  const minTime = dayjs(startTime)
  const minHour = minTime.hour()
  const minMinute = minTime.minute()
  return {
    disabledHours: () => range(0, minHour),
    disabledMinutes: (selectedHour: number) => (
      selectedHour === minHour ? range(0, minMinute) : []
    ),
  }
}

function range(start: number, end: number) {
  return Array.from({ length: end - start }, (_item, index) => start + index)
}

async function handleSubmit() {
  submitting.value = true
  try {
    const [startTime, endTime] = form.timeRange || []
    emit('submit', {
      type: form.type,
      startTime: startTime?.toISOString(),
      endTime: endTime?.toISOString(),
      duration: form.duration,
      reason: form.reason,
    })
  } finally {
    submitting.value = false
  }
}
</script>
