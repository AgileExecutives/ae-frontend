<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Calendar, Clock, User, Mail, MessageSquare, Repeat } from 'lucide-vue-next'
import type { TimeSlot, RecurrencePattern } from '@/types/client-booking'

const props = defineProps<{
  slot: TimeSlot | null
  isOpen: boolean
  maxSeriesCount: number
}>()

const emit = defineEmits<{
  close: []
  submit: [data: {
    name: string
    email: string
    message: string
    recurrence: RecurrencePattern
    seriesCount: number
  }]
  calculateSeries: [recurrence: RecurrencePattern]
}>()

// Form data
const name = ref('')
const email = ref('')
const message = ref('')
const recurrence = ref<RecurrencePattern>('once')
const seriesCount = ref(1)
const availableSeriesCount = ref(1)

// Validation
const isValid = computed(() => {
  return name.value.trim() !== '' && email.value.trim() !== '' && isValidEmail(email.value)
})

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Formatted display values
const formattedDate = computed(() => {
  if (!props.slot) return ''
  const date = new Date(props.slot.date)
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formatTime = (time: string) => {
  return time.slice(0, 5) // HH:mm
}

const duration = computed(() => {
  if (!props.slot) return ''
  const start = props.slot.startTime.split(':').map(Number)
  const end = props.slot.endTime.split(':').map(Number)
  const startMinutes = (start[0] || 0) * 60 + (start[1] || 0)
  const endMinutes = (end[0] || 0) * 60 + (end[1] || 0)
  const diffMinutes = endMinutes - startMinutes
  
  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }
  return `${diffMinutes}min`
})

const recurrenceOptions = [
  { value: 'once', label: 'Einmalig' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'biweekly', label: '2-wöchentlich' }
] as const

// Watch recurrence changes to calculate available series
watch(recurrence, (newRecurrence) => {
  if (newRecurrence !== 'once') {
    emit('calculateSeries', newRecurrence)
  } else {
    seriesCount.value = 1
    availableSeriesCount.value = 1
  }
})

// Update available series count when prop changes
watch(() => props.slot, (newSlot) => {
  if (newSlot) {
    availableSeriesCount.value = newSlot.availableSeriesCount || 1
    if (recurrence.value !== 'once') {
      seriesCount.value = Math.min(seriesCount.value, availableSeriesCount.value)
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  if (!isValid.value) return
  
  emit('submit', {
    name: name.value.trim(),
    email: email.value.trim(),
    message: message.value.trim(),
    recurrence: recurrence.value,
    seriesCount: recurrence.value === 'once' ? 1 : seriesCount.value
  })
  
  // Reset form
  resetForm()
}

const resetForm = () => {
  name.value = ''
  email.value = ''
  message.value = ''
  recurrence.value = 'once'
  seriesCount.value = 1
}

const handleClose = () => {
  resetForm()
  emit('close')
}

// Series count options based on available slots
const seriesCountOptions = computed(() => {
  const max = Math.min(availableSeriesCount.value, props.maxSeriesCount)
  return Array.from({ length: max }, (_, i) => i + 1)
})
</script>

<template>
  <div
    v-if="isOpen && slot"
    class="modal modal-open"
    @click.self="handleClose"
  >
    <div class="modal-box max-w-md">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-base-content">Termin buchen</h3>
          <p class="text-sm text-base-content/70 mt-1">
            Füllen Sie das Formular aus, um Ihren Termin zu buchen
          </p>
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          @click="handleClose"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Selected slot info -->
      <div class="bg-primary/10 rounded-lg p-4 mb-6 space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <Calendar class="w-4 h-4 text-primary" />
          <span class="font-medium">{{ formattedDate }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <Clock class="w-4 h-4 text-primary" />
          <span>{{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}</span>
          <span class="text-xs opacity-75">({{ duration }})</span>
        </div>
      </div>

      <!-- Form -->
      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <User class="w-4 h-4" />
              Name <span class="text-error">*</span>
            </span>
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="Ihr vollständiger Name"
            class="input input-bordered w-full"
            required
          >
        </div>

        <!-- Email -->
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Mail class="w-4 h-4" />
              E-Mail <span class="text-error">*</span>
            </span>
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="ihre.email@example.com"
            class="input input-bordered w-full"
            required
          >
          <label
            v-if="email && !isValidEmail(email)"
            class="label"
          >
            <span class="label-text-alt text-error">Bitte geben Sie eine gültige E-Mail-Adresse ein</span>
          </label>
        </div>

        <!-- Message (optional) -->
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <MessageSquare class="w-4 h-4" />
              Nachricht (optional)
            </span>
          </label>
          <textarea
            v-model="message"
            placeholder="Zusätzliche Informationen oder Anmerkungen..."
            class="textarea textarea-bordered w-full h-20 resize-none"
          />
        </div>

        <!-- Recurrence -->
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Repeat class="w-4 h-4" />
              Serientermine
            </span>
          </label>
          <select
            v-model="recurrence"
            class="select select-bordered w-full"
          >
            <option
              v-for="option in recurrenceOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Series count -->
        <div
          v-if="recurrence !== 'once'"
          class="form-control"
        >
          <label class="label">
            <span class="label-text">Anzahl der Termine</span>
            <span class="label-text-alt text-base-content/60">
              max. {{ Math.min(availableSeriesCount, maxSeriesCount) }} verfügbar
            </span>
          </label>
          <select
            v-model.number="seriesCount"
            class="select select-bordered w-full"
          >
            <option
              v-for="count in seriesCountOptions"
              :key="count"
              :value="count"
            >
              {{ count }} {{ count === 1 ? 'Termin' : 'Termine' }}
            </option>
          </select>
          <label class="label">
            <span class="label-text-alt text-info flex items-center gap-1">
              <Repeat class="w-3 h-3" />
              {{ recurrence === 'weekly' ? 'Wöchentliche' : '2-wöchentliche' }} Wiederholung
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <button
            type="button"
            class="btn btn-ghost flex-1"
            @click="handleClose"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            class="btn btn-primary flex-1"
            :disabled="!isValid"
          >
            Termin buchen
          </button>
        </div>
      </form>

      <!-- Privacy notice -->
      <div class="mt-4 pt-4 border-t border-base-200">
        <p class="text-xs text-base-content/50 text-center">
          Durch die Buchung stimmen Sie unserer Datenschutzerklärung zu.
          Sie erhalten eine Bestätigungs-E-Mail mit allen Details.
        </p>
      </div>
    </div>
  </div>
</template>
