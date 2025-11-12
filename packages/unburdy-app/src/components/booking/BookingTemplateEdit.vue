<template>
  <div class="flex flex-col h-full">
    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Basic Information -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Grundinformationen</h3>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Kalender *</span>
            </label>
            <select
              v-model.number="formData.calendar_id"
              class="select select-bordered"
              :class="{ 'input-error': errors.calendar_id }"
              :disabled="loadingCalendars"
            >
              <option :value="undefined" disabled>
                {{ loadingCalendars ? 'Laden...' : 'Kalender auswählen' }}
              </option>
              <option
                v-for="calendar in calendars"
                :key="calendar.id"
                :value="calendar.id"
              >
                {{ calendar.title }}
              </option>
            </select>
            <label
              v-if="errors.calendar_id"
              class="label"
            >
              <span class="label-text-alt text-error">{{ errors.calendar_id }}</span>
            </label>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Name *</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="z.B. Erstgespräch 30 Min"
              class="input input-bordered"
              :class="{ 'input-error': errors.name }"
            />
            <label
              v-if="errors.name"
              class="label"
            >
              <span class="label-text-alt text-error">{{ errors.name }}</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Beschreibung</span>
            </label>
            <textarea
              v-model="formData.description"
              placeholder="Beschreiben Sie diese Buchungsvorlage..."
              class="textarea textarea-bordered h-24"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Slot Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Termin-Einstellungen</h3>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Slot-Dauer *</span>
            </label>
            <select
              v-model.number="formData.slot_duration"
              class="select select-bordered"
            >
              <option
                v-for="option in SLOT_DURATION_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Pufferzeit</span>
            </label>
            <select
              v-model.number="formData.buffer_time"
              class="select select-bordered"
            >
              <option
                v-for="option in BUFFER_TIME_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Max. Termine pro Tag</span>
            </label>
            <input
              v-model.number="formData.max_bookings_per_day"
              type="number"
              min="1"
              placeholder="Unbegrenzt"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Termine ohne Puffer erlauben</span>
              <input
                v-model="formData.allow_back_to_back"
                type="checkbox"
                class="checkbox"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Booking Window -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Buchungszeitraum</h3>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Vorlaufzeit (Tage)</span>
            </label>
            <input
              v-model.number="formData.advance_booking_days"
              type="number"
              min="1"
              placeholder="90"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">Wie viele Tage im Voraus kann gebucht werden</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Mindestvorlauf (Stunden)</span>
            </label>
            <input
              v-model.number="formData.min_notice_hours"
              type="number"
              min="0"
              placeholder="24"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">Minimale Vorlaufzeit für Buchungen</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Series Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Serien-Buchungen</h3>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Max. Anzahl Serien-Termine</span>
            </label>
            <input
              v-model.number="formData.max_series_bookings"
              type="number"
              min="1"
              placeholder="10"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Erlaubte Intervalle</span>
            </label>
            <div class="space-y-2">
              <label
                v-for="(label, interval) in RECURRENCE_INTERVAL_LABELS"
                :key="interval"
                class="label cursor-pointer justify-start gap-2"
              >
                <input
                  v-model="formData.allowed_intervals"
                  type="checkbox"
                  :value="interval"
                  class="checkbox checkbox-sm"
                />
                <span class="label-text">{{ label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Timezone -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Zeitzone</h3>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Zeitzone</span>
            </label>
            <input
              v-model="formData.timezone"
              type="text"
              placeholder="Europe/Berlin"
              class="input input-bordered"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="border-t border-base-200 p-4 flex gap-2 justify-end bg-base-100">
      <button
        class="btn btn-ghost"
        @click="$emit('cancel')"
      >
        Abbrechen
      </button>
      <button
        class="btn btn-primary"
        :disabled="!isValid"
        @click="handleSave"
      >
        Speichern
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCalendarApi } from '@/composables/useCalendarApi'
import type { BookingTemplate } from '@/types/booking'
import {
  createEmptyTemplate,
  SLOT_DURATION_OPTIONS,
  BUFFER_TIME_OPTIONS,
  RECURRENCE_INTERVAL_LABELS
} from '@/types/booking'

interface Calendar {
  id: number
  title: string
  color: string
}

const props = defineProps<{
  template?: BookingTemplate | null
}>()

const emit = defineEmits<{
  save: [template: Partial<BookingTemplate>]
  cancel: []
}>()

const formData = ref<Partial<BookingTemplate>>(
  props.template ? { ...props.template } : createEmptyTemplate()
)

const errors = ref<Record<string, string>>({})
const calendars = ref<Calendar[]>([])
const loadingCalendars = ref(false)
const { getCalendarsList } = useCalendarApi()

// Fetch calendars on mount
onMounted(async () => {
  loadingCalendars.value = true
  try {
    const response = await getCalendarsList()
    if (response?.success && response.data && Array.isArray(response.data)) {
      calendars.value = response.data
      // Auto-select first calendar if no calendar is selected
      if (!formData.value.calendar_id && calendars.value.length > 0 && calendars.value[0]) {
        formData.value.calendar_id = calendars.value[0].id
      }
    }
  } catch (error) {
    console.error('Failed to load calendars:', error)
  } finally {
    loadingCalendars.value = false
  }
})

// Watch for template changes
watch(
  () => props.template,
  (newTemplate) => {
    if (newTemplate) {
      formData.value = { ...newTemplate }
    } else {
      formData.value = createEmptyTemplate()
    }
    errors.value = {}
  }
)

const isValid = computed(() => {
  return formData.value.name && formData.value.name.trim() !== ''
})

const handleSave = () => {
  errors.value = {}

  // Validate
  if (!formData.value.calendar_id) {
    errors.value.calendar_id = 'Kalender ist erforderlich'
    return
  }
  
  if (!formData.value.name || formData.value.name.trim() === '') {
    errors.value.name = 'Name ist erforderlich'
    return
  }

  // Ensure allowed_intervals is an array
  if (!Array.isArray(formData.value.allowed_intervals)) {
    formData.value.allowed_intervals = ['none']
  }

  emit('save', formData.value)
}
</script>
