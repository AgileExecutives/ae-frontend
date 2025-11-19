<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Calendar Name -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Calendar Name</span>
        </label>
        <input
          v-model="localSettings.name"
          type="text"
          placeholder="Enter calendar name"
          class="input input-bordered w-full"
        />
      </div>

      <!-- Calendar Color -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Calendar Color</span>
        </label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="color in availableColors"
            :key="color"
            class="btn btn-sm h-12"
            :class="[
              `btn-${color}`,
              { 'ring-2 ring-offset-2 ring-base-content': localSettings.color === color }
            ]"
            @click="localSettings.color = color"
          >
            {{ color }}
          </button>
        </div>
      </div>

      <!-- Weekly Availability -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Weekly Availability</span>
          <span class="label-text-alt">Set your available hours for each day</span>
        </label>
        
        <div class="space-y-3">
          <div
            v-for="day in daysOfWeek"
            :key="day.key"
            class="border border-base-300 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <label class="label cursor-pointer gap-2 p-0">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="isDayEnabled(day.key)"
                  @change="toggleDay(day.key)"
                />
                <span class="label-text font-medium">{{ day.label }}</span>
              </label>
              <button
                v-if="isDayEnabled(day.key)"
                class="btn btn-xs btn-ghost"
                @click="addTimeSlot(day.key)"
              >
                + Add Slot
              </button>
            </div>

            <div
              v-if="isDayEnabled(day.key)"
              class="space-y-2 mt-2"
            >
              <div
                v-for="(slot, index) in localSettings.availability[day.key]"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="slot.start"
                  type="time"
                  class="input input-bordered input-sm flex-1"
                />
                <span class="text-sm">to</span>
                <input
                  v-model="slot.end"
                  type="time"
                  class="input input-bordered input-sm flex-1"
                />
                <button
                  class="btn btn-xs btn-ghost btn-circle"
                  @click="removeTimeSlot(day.key, index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="flex-shrink-0 border-t border-base-300 p-4 bg-base-200">
      <!-- Error Display -->
      <div v-if="errorMessage" class="alert alert-error mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Success Display -->
      <div v-if="successMessage" class="alert alert-success mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-ghost flex-1" @click="handleCancel" :disabled="isSaving">
          Cancel
        </button>
        <button class="btn btn-primary flex-1" @click="handleSave" :disabled="isSaving || !hasChanges">
          <span v-if="isSaving" class="loading loading-spinner loading-sm"></span>
          {{ isSaving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { WeeklyAvailability, TimeRange } from '@/types/client-booking'

interface CalendarSettings {
  name: string
  color: string
  availability: WeeklyAvailability
}

interface Props {
  initialName?: string
  initialColor?: string
  initialAvailability?: WeeklyAvailability
}

const props = withDefaults(defineProps<Props>(), {
  initialName: 'Calendar',
  initialColor: 'primary',
  initialAvailability: () => ({})
})

const emit = defineEmits<{
  save: [settings: CalendarSettings]
  cancel: []
}>()

const availableColors = [
  'primary', 'secondary', 'accent', 'info',
  'success', 'warning', 'error', 'neutral'
]

const daysOfWeek = [
  { key: 'monday' as const, label: 'Monday' },
  { key: 'tuesday' as const, label: 'Tuesday' },
  { key: 'wednesday' as const, label: 'Wednesday' },
  { key: 'thursday' as const, label: 'Thursday' },
  { key: 'friday' as const, label: 'Friday' },
  { key: 'saturday' as const, label: 'Saturday' },
  { key: 'sunday' as const, label: 'Sunday' }
]

const localSettings = ref<CalendarSettings>({
  name: props.initialName,
  color: props.initialColor,
  availability: {}
})

const initialSettings = ref<CalendarSettings>({
  name: props.initialName,
  color: props.initialColor,
  availability: {}
})

const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const hasChanges = computed(() => {
  return (
    localSettings.value.name !== initialSettings.value.name ||
    localSettings.value.color !== initialSettings.value.color ||
    JSON.stringify(localSettings.value.availability) !== JSON.stringify(initialSettings.value.availability)
  )
})

const isDayEnabled = (day: keyof WeeklyAvailability): boolean => {
  return !!(localSettings.value.availability[day] && localSettings.value.availability[day]!.length > 0)
}

const toggleDay = (day: keyof WeeklyAvailability) => {
  if (isDayEnabled(day)) {
    // Disable day
    delete localSettings.value.availability[day]
  } else {
    // Enable day with default slot
    localSettings.value.availability[day] = [
      { start: '09:00', end: '17:00' }
    ]
  }
}

const addTimeSlot = (day: keyof WeeklyAvailability) => {
  if (!localSettings.value.availability[day]) {
    localSettings.value.availability[day] = []
  }
  localSettings.value.availability[day]!.push({
    start: '09:00',
    end: '17:00'
  })
}

const removeTimeSlot = (day: keyof WeeklyAvailability, index: number) => {
  if (localSettings.value.availability[day]) {
    localSettings.value.availability[day]!.splice(index, 1)
    if (localSettings.value.availability[day]!.length === 0) {
      delete localSettings.value.availability[day]
    }
  }
}

const handleSave = () => {
  errorMessage.value = null
  successMessage.value = null
  emit('save', localSettings.value)
}

const handleCancel = () => {
  errorMessage.value = null
  successMessage.value = null
  emit('cancel')
}

onMounted(() => {
  // Initialize with prop values
  if (props.initialAvailability && Object.keys(props.initialAvailability).length > 0) {
    localSettings.value.availability = JSON.parse(JSON.stringify(props.initialAvailability))
    initialSettings.value.availability = JSON.parse(JSON.stringify(props.initialAvailability))
  } else {
    // Set default availability for weekdays
    const defaultAvailability = {
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '17:00' }],
      thursday: [{ start: '09:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '17:00' }]
    }
    localSettings.value.availability = JSON.parse(JSON.stringify(defaultAvailability))
    initialSettings.value.availability = JSON.parse(JSON.stringify(defaultAvailability))
  }
  
  // Store initial name and color
  initialSettings.value.name = props.initialName
  initialSettings.value.color = props.initialColor
})
</script>
