<template>
  <ViewCard title="Buchungsvorlagen">
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Vorlagen durchsuchen..."
          class="input input-sm lg:input-md input-bordered w-full lg:w-64"
        />
      </div>
    </template>

    <template #content>
      <div class="flex flex-col h-full">
        <!-- Empty State -->
        <div
          v-if="filteredTemplates.length === 0 && !isLoading"
          class="flex flex-col items-center justify-center h-full text-center p-8"
        >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-24 w-24 text-base-content/20 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
          <h3 class="text-xl font-semibold text-base-content/70 mb-2">
            {{ searchQuery ? 'Keine Vorlagen gefunden' : 'Keine Vorlagen vorhanden' }}
          </h3>
          <p class="text-base-content/50 mb-4">
            {{
              searchQuery
                ? 'Versuchen Sie eine andere Suche'
                : 'Erstellen Sie Ihre erste Buchungsvorlage'
            }}
          </p>
          <button
            v-if="!searchQuery"
            class="btn btn-primary"
            @click="$emit('add-template')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Vorlage erstellen
          </button>
        </div>

        <!-- Template List -->
        <div
          v-else
          class="flex-1 min-h-0 overflow-hidden"
        >
          <div class="overflow-auto h-full">
            <div class="space-y-2 p-1">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-200"
                @click="$emit('template-click', template)"
              >
                <div class="card-body p-4">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <h3 class="card-title text-base mb-1 truncate">
                        {{ template.name }}
                      </h3>
                      <p
                        v-if="template.description"
                        class="text-sm text-base-content/70 line-clamp-2"
                      >
                        {{ template.description }}
                      </p>
                      <div class="mt-2 flex flex-wrap gap-2 text-xs">
                        <div class="badge badge-outline">
                          {{ template.slot_duration }} Min
                        </div>
                        <div
                          v-if="template.max_series_bookings > 1"
                          class="badge badge-outline"
                        >
                          Max {{ template.max_series_bookings }} Serien
                        </div>
                        <div
                          v-if="template.advance_booking_days"
                          class="badge badge-outline"
                        >
                          {{ template.advance_booking_days }} Tage voraus
                        </div>
                      </div>
                    </div>
                    <div class="dropdown dropdown-end">
                      <button
                        tabindex="0"
                        class="btn btn-ghost btn-sm btn-circle"
                        @click.stop
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                      <ul
                        tabindex="0"
                        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                      >
                        <li>
                          <a @click.stop="$emit('template-edit', template)">
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
                          </a>
                        </li>
                        <li>
                          <a
                            class="text-error"
                            @click.stop="$emit('template-delete', template)"
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
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center bg-base-100/50"
        >
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    </template>
  </ViewCard>
</template>

<script setup lang="ts">
import { useBooking } from '@/composables/useBooking'
import type { BookingTemplate } from '@/types/booking'
import ViewCard from '@/components/ViewCard.vue'

defineEmits<{
  'template-click': [template: BookingTemplate]
  'template-edit': [template: BookingTemplate]
  'template-delete': [template: BookingTemplate]
  'add-template': []
}>()

const {
  filteredTemplates,
  isLoading,
  searchQuery
} = useBooking()
</script>
