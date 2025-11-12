<template>
  <div class="flex flex-col h-full">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Basic Information -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Grundinformationen</h3>
          
          <div class="grid grid-cols-1 gap-3">
            <div>
              <span class="text-sm text-base-content/70">Name</span>
              <p class="font-medium">{{ template?.name || '-' }}</p>
            </div>
            
            <div v-if="template?.description">
              <span class="text-sm text-base-content/70">Beschreibung</span>
              <p class="font-medium">{{ template.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Slot Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Termin-Einstellungen</h3>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="text-sm text-base-content/70">Slot-Dauer</span>
              <p class="font-medium">{{ template?.slot_duration }} Minuten</p>
            </div>
            
            <div>
              <span class="text-sm text-base-content/70">Pufferzeit</span>
              <p class="font-medium">{{ template?.buffer_time }} Minuten</p>
            </div>
            
            <div v-if="template?.max_bookings_per_day">
              <span class="text-sm text-base-content/70">Max. pro Tag</span>
              <p class="font-medium">{{ template.max_bookings_per_day }}</p>
            </div>
            
            <div>
              <span class="text-sm text-base-content/70">Back-to-Back</span>
              <p class="font-medium">{{ template?.allow_back_to_back ? 'Ja' : 'Nein' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Window -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Buchungszeitraum</h3>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="text-sm text-base-content/70">Vorlaufzeit</span>
              <p class="font-medium">{{ template?.advance_booking_days }} Tage</p>
            </div>
            
            <div>
              <span class="text-sm text-base-content/70">Mindestvorlauf</span>
              <p class="font-medium">{{ template?.min_notice_hours }} Stunden</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Series Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Serien-Buchungen</h3>
          
          <div class="grid grid-cols-1 gap-3">
            <div>
              <span class="text-sm text-base-content/70">Max. Anzahl</span>
              <p class="font-medium">{{ template?.max_series_bookings }} Termine</p>
            </div>
            
            <div v-if="template?.allowed_intervals && template.allowed_intervals.length > 0">
              <span class="text-sm text-base-content/70">Erlaubte Intervalle</span>
              <div class="flex flex-wrap gap-2 mt-1">
                <div
                  v-for="interval in template.allowed_intervals"
                  :key="interval"
                  class="badge badge-outline"
                >
                  {{ RECURRENCE_INTERVAL_LABELS[interval] }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timezone -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Zeitzone</h3>
          
          <div>
            <span class="text-sm text-base-content/70">Zeitzone</span>
            <p class="font-medium">{{ template?.timezone || 'Europe/Berlin' }}</p>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-base mb-4">Metadaten</h3>
          
          <div class="grid grid-cols-1 gap-3">
            <div v-if="template?.created_at">
              <span class="text-sm text-base-content/70">Erstellt</span>
              <p class="font-medium">{{ formatDate(template.created_at) }}</p>
            </div>
            
            <div v-if="template?.updated_at">
              <span class="text-sm text-base-content/70">Aktualisiert</span>
              <p class="font-medium">{{ formatDate(template.updated_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="border-t border-base-200 p-4 flex gap-2 justify-between bg-base-100">
      <button
        v-if="template"
        class="btn btn-error btn-outline"
        @click="$emit('delete', template)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Löschen
      </button>
      <div class="flex gap-2" :class="{ 'ml-auto': !template }">
        <button
          class="btn btn-ghost"
          @click="$emit('cancel')"
        >
          Schließen
        </button>
        <button
          class="btn btn-primary"
          @click="$emit('edit')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Bearbeiten
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BookingTemplate } from '@/types/booking'
import { RECURRENCE_INTERVAL_LABELS } from '@/types/booking'

defineProps<{
  template?: BookingTemplate | null
}>()

defineEmits<{
  edit: []
  delete: [template: BookingTemplate]
  cancel: []
}>()

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
