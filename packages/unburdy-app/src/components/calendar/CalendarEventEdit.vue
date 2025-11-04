<template>
  <div class="flex flex-col h-full">
        
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto space-y-4">
        <div class="p-4">
      <!-- Title -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Title <span class="text-error">*</span></span>
        </label>
        <input
          v-model="formData.title"
          type="text"
          placeholder="Event title"
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.title }"
          required
        />
        <label v-if="errors.title" class="label">
          <span class="label-text-alt text-error">{{ errors.title }}</span>
        </label>
      </div>

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Start Date <span class="text-error">*</span></span>
          </label>
          <input
            v-model="formData.date"
            type="date"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.date }"
            required
          />
          <label v-if="errors.date" class="label">
            <span class="label-text-alt text-error">{{ errors.date }}</span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">End Date</span>
          </label>
          <input
            v-model="formData.endDate"
            type="date"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.endDate }"
            :min="formData.date"
          />
          <label v-if="errors.endDate" class="label">
            <span class="label-text-alt text-error">{{ errors.endDate }}</span>
          </label>
        </div>
      </div>

      <!-- All Day Toggle -->
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-3">
          <input
            v-model="formData.isAllDay"
            type="checkbox"
            class="checkbox checkbox-primary"
          />
          <span class="label-text font-semibold">All-day event</span>
        </label>
      </div>

      <!-- Time Range (only if not all-day) -->
      <div v-if="!formData.isAllDay" class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Start Time <span class="text-error">*</span></span>
          </label>
          <input
            v-model="formData.startTime"
            type="time"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.startTime }"
          />
          <label v-if="errors.startTime" class="label">
            <span class="label-text-alt text-error">{{ errors.startTime }}</span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">End Time <span class="text-error">*</span></span>
          </label>
          <input
            v-model="formData.endTime"
            type="time"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.endTime }"
          />
          <label v-if="errors.endTime" class="label">
            <span class="label-text-alt text-error">{{ errors.endTime }}</span>
          </label>
        </div>
      </div>

      <!-- Type -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Event Type</span>
        </label>
        <select
          v-model="formData.type"
          class="select select-bordered w-full"
        >
          <option value="appointment">Appointment</option>
          <option value="meeting">Meeting</option>
          <option value="call">Call</option>
          <option value="personal">Personal</option>
          <option value="holiday">Holiday</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <!-- Classification -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Color</span>
        </label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="classification in classifications"
            :key="classification.value"
            class="cursor-pointer"
          >
            <input
              v-model="formData.classification"
              type="radio"
              :value="classification.value"
              class="hidden"
            />
            <div
              class="badge badge-lg gap-2 transition-all"
              :class="[
                classification.class,
                formData.classification === classification.value
                  ? 'ring-2 ring-offset-2 ring-primary'
                  : 'opacity-60 hover:opacity-100'
              ]"
            >
              {{ classification.label }}
            </div>
          </label>
        </div>
      </div>

      <!-- Description -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Description</span>
        </label>
        <textarea
          v-model="formData.description"
          class="textarea textarea-bordered h-24 resize-none"
          placeholder="Add event details..."
        ></textarea>
      </div>

      <!-- Attendees -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Attendees</span>
        </label>
        <div class="flex gap-2 mb-2">
          <input
            v-model="newAttendee"
            type="text"
            placeholder="Add attendee name"
            class="input input-bordered flex-1"
            @keyup.enter="addAttendee"
          />
          <button
            type="button"
            @click="addAttendee"
            class="btn btn-primary"
            :disabled="!newAttendee.trim()"
          >
            Add
          </button>
        </div>
        <div v-if="formData.attendees && formData.attendees.length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="(attendee, index) in formData.attendees"
            :key="index"
            class="badge badge-lg gap-2"
          >
            {{ attendee }}
            <button
              type="button"
              @click="removeAttendee(index)"
              class="btn btn-ghost btn-xs btn-circle"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      </div>
    </form>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-base-300 mt-4">
      <div class="flex gap-2">
        <button
          type="button"
          @click="handleSubmit"
          class="btn btn-primary flex-1"
          :disabled="isSaving"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-sm"></span>
          <span v-else>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          {{ isNew ? 'Create Event' : 'Save Changes' }}
        </button>
        <button
          type="button"
          @click="$emit('cancel')"
          class="btn btn-ghost"
          :disabled="isSaving"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Meeting } from '@/types/calendar'

const props = defineProps<{
  event?: Meeting
  initialDate?: string
  initialTime?: string
}>()

const emit = defineEmits<{
  save: [Meeting]
  cancel: []
}>()

const isNew = computed(() => !props.event?.id)
const isSaving = ref(false)
const newAttendee = ref('')

const formData = ref<Partial<Meeting>>({
  id: props.event?.id || '',
  title: props.event?.title || '',
  date: props.event?.date || props.initialDate || new Date().toISOString().split('T')[0],
  endDate: props.event?.endDate || '',
  startTime: props.event?.startTime || props.initialTime || '09:00',
  endTime: props.event?.endTime || '10:00',
  isAllDay: props.event?.isAllDay || false,
  type: props.event?.type || 'appointment',
  classification: props.event?.classification || 'primary',
  description: props.event?.description || '',
  attendees: props.event?.attendees ? [...props.event.attendees] : []
})

const errors = ref<Record<string, string>>({})

const classifications = [
  { value: 'primary', label: 'Primary', class: 'badge-primary' },
  { value: 'secondary', label: 'Secondary', class: 'badge-secondary' },
  { value: 'accent', label: 'Accent', class: 'badge-accent' },
  { value: 'info', label: 'Info', class: 'badge-info' },
  { value: 'success', label: 'Success', class: 'badge-success' },
  { value: 'warning', label: 'Warning', class: 'badge-warning' },
  { value: 'error', label: 'Error', class: 'badge-error' }
]

// Auto-adjust end time when start time changes
watch(() => formData.value.startTime, (newStartTime) => {
  if (!formData.value.isAllDay && newStartTime) {
    const [hours, minutes] = newStartTime.split(':').map(Number)
    if (hours !== undefined && minutes !== undefined) {
      const endHours = (hours + 1) % 24
      formData.value.endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }
})

// Clear time errors when switching to all-day
watch(() => formData.value.isAllDay, (isAllDay) => {
  if (isAllDay) {
    delete errors.value.startTime
    delete errors.value.endTime
    formData.value.startTime = '00:00'
    formData.value.endTime = '23:59'
  }
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.title?.trim()) {
    errors.value.title = 'Title is required'
  }

  if (!formData.value.date) {
    errors.value.date = 'Start date is required'
  }

  if (formData.value.endDate && formData.value.date && formData.value.endDate < formData.value.date) {
    errors.value.endDate = 'End date must be after start date'
  }

  // Only validate times for non-all-day events
  if (!formData.value.isAllDay) {
    if (!formData.value.startTime) {
      errors.value.startTime = 'Start time is required'
    }

    if (!formData.value.endTime) {
      errors.value.endTime = 'End time is required'
    }

    // Only validate time order if it's a single-day event
    if (!formData.value.endDate || formData.value.endDate === formData.value.date) {
      if (formData.value.startTime && formData.value.endTime && formData.value.startTime >= formData.value.endTime) {
        errors.value.endTime = 'End time must be after start time'
      }
    }
  }

  return Object.keys(errors.value).length === 0
}

const addAttendee = () => {
  const attendee = newAttendee.value.trim()
  if (attendee && !formData.value.attendees?.includes(attendee)) {
    formData.value.attendees = [...(formData.value.attendees || []), attendee]
    newAttendee.value = ''
  }
}

const removeAttendee = (index: number) => {
  formData.value.attendees = formData.value.attendees?.filter((_, i) => i !== index) || []
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSaving.value = true

  try {
    // Create the meeting object with all required fields
    const meeting: Meeting = {
      id: formData.value.id || '',
      title: formData.value.title || '',
      date: formData.value.date,
      endDate: formData.value.endDate || formData.value.date,
      startTime: formData.value.startTime || '00:00',
      endTime: formData.value.endTime || '23:59',
      isAllDay: formData.value.isAllDay || false,
      isMultiDay: !!(formData.value.endDate && formData.value.endDate !== formData.value.date),
      type: formData.value.type || 'appointment',
      classification: (formData.value.classification || 'primary') as Meeting['classification'],
      description: formData.value.description || '',
      attendees: formData.value.attendees || []
    }

    emit('save', meeting)
  } finally {
    isSaving.value = false
  }
}
</script>
