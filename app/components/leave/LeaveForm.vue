<template>
  <a-card title="Leave Application">
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <a-form-item label="Leave Type" name="type">
        <a-select v-model:value="form.type" placeholder="Select leave type">
          <a-select-option value="sick">Sick Leave</a-select-option>
          <a-select-option value="personal">Personal Leave</a-select-option>
          <a-select-option value="annual">Annual Leave</a-select-option>
          <a-select-option value="other">Other</a-select-option>
        </a-select>
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Start Time" name="startTime">
            <a-date-picker
              v-model:value="form.startTime"
              show-time
              style="width: 100%"
              @change="calcDuration"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="End Time" name="endTime">
            <a-date-picker
              v-model:value="form.endTime"
              show-time
              style="width: 100%"
              @change="calcDuration"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Duration">
        <a-input-number v-model:value="form.duration" :min="0.5" :step="0.5" style="width: 160px" addon-after="days" />
      </a-form-item>

      <a-form-item label="Reason" name="reason">
        <a-textarea v-model:value="form.reason" :rows="4" placeholder="Enter leave reason" />
      </a-form-item>

      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">Submit</a-button>
          <a-button v-if="showCancel" @click="$emit('cancel')">Cancel</a-button>
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
  type: [{ required: true, message: 'Select leave type' }],
  startTime: [{ required: true, message: 'Select start time' }],
  endTime: [{ required: true, message: 'Select end time' }],
  reason: [{ required: true, message: 'Enter reason' }],
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
