<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarCheck, AlertCircle } from 'lucide-vue-next'
import BookingSlotView from '@/components/client-booking/BookingSlotView.vue'
import BookingModal from '@/components/client-booking/BookingModal.vue'
import { useClientBooking } from '@/composables/useClientBooking'
import { getApiClient } from '@/config/api-config'
import type { TimeSlot, RecurrencePattern, BookingConfig } from '@/types/client-booking'
import BookingMonthCalendar from '@/components/client-booking/BookingMonthCalendar.vue'

const route = useRoute()
const bookingToken = ref<string>('')
const isLoadingConfig = ref(true)
const configError = ref<string | null>(null)

// Default booking configuration (will be updated from API)
const bookingConfig = ref<BookingConfig>({
  slotDuration: 30,
  bufferTime: 5,
  maxSeriesCount: 10,
  minAdvanceHours: 24,
  maxAdvanceDays: 90,
  weeklyAvailability: {
    monday: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ],
    tuesday: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ],
    wednesday: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ],
    thursday: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ],
    friday: [
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '16:00' }
    ]
  }
})

// Fetch booking configuration from API using token
const fetchBookingConfig = async () => {
  isLoadingConfig.value = true
  configError.value = null
  
  try {
    const apiClient = getApiClient()
    
    // Call getBookingFreeSlots with token to get booking information and available slots
    const response = await apiClient.getBookingFreeSlots(bookingToken.value, {
      start: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
    })
    
    if (response?.data) {
      const freeSlotsData = response.data
      
      // Update booking config from API response
      if (freeSlotsData.config) {
        bookingConfig.value = {
          slotDuration: freeSlotsData.config.duration || 30,
          bufferTime: freeSlotsData.config.buffer_time || 5,
          maxSeriesCount: freeSlotsData.config.number_max || 10,
          minAdvanceHours: 24, // TODO: Get from template
          maxAdvanceDays: 90, // TODO: Get from template
          weeklyAvailability: freeSlotsData.config.weekly_availability || bookingConfig.value.weeklyAvailability
        }
      }
      
      // Process available slots
      if (freeSlotsData.slots && Array.isArray(freeSlotsData.slots)) {
        // TODO: Map slots to booking.monthData
        console.log('Available slots:', freeSlotsData.slots)
      }
      
      // Process month data if available
      if (freeSlotsData.monthData) {
        console.log('Month data:', freeSlotsData.monthData)
      }
    } else {
      configError.value = 'Fehler beim Laden der Buchungsinformationen'
    }
  } catch (error) {
    console.error('Failed to fetch booking config:', error)
    configError.value = 'Buchungslink ungültig oder abgelaufen'
  } finally {
    isLoadingConfig.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  // Get token from route params
  const token = route.params.token
  if (typeof token === 'string') {
    bookingToken.value = token
    await fetchBookingConfig()
  } else {
    configError.value = 'Kein Buchungstoken gefunden'
    isLoadingConfig.value = false
  }
})

// Initialize booking composable
const booking = useClientBooking(bookingConfig.value)

// Modal state
const isModalOpen = ref(false)
const showSuccessAlert = ref(false)
const showErrorAlert = ref(false)
const successMessage = ref('')

// Handle slot selection
const handleSlotSelect = (slot: TimeSlot) => {
  booking.selectSlot(slot)
  
  // Calculate series availability for current recurrence
  if (slot) {
    const count = booking.calculateSeriesAvailability(slot, 'once')
    if (booking.selectedSlot.value) {
      booking.selectedSlot.value.availableSeriesCount = count
    }
  }
  
  isModalOpen.value = true
}

// Handle series calculation when recurrence changes
const handleCalculateSeries = (recurrence: RecurrencePattern) => {
  if (booking.selectedSlot.value) {
    const count = booking.calculateSeriesAvailability(booking.selectedSlot.value, recurrence)
    booking.selectedSlot.value.availableSeriesCount = count
  }
}

// Handle booking submission
const handleBookingSubmit = async (data: {
  name: string
  email: string
  message: string
  recurrence: RecurrencePattern
  seriesCount: number
}) => {
  if (!booking.selectedSlot.value) return
  
  const success = await booking.createBooking({
    slot: booking.selectedSlot.value,
    name: data.name,
    email: data.email,
    message: data.message,
    recurrence: data.recurrence,
    seriesCount: data.seriesCount
  })
  
  if (success) {
    isModalOpen.value = false
    showSuccessAlert.value = true
    successMessage.value = data.seriesCount > 1
      ? `${data.seriesCount} Termine erfolgreich gebucht!`
      : 'Termin erfolgreich gebucht!'
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      showSuccessAlert.value = false
    }, 5000)
  } else {
    showErrorAlert.value = true
    setTimeout(() => {
      showErrorAlert.value = false
    }, 5000)
  }
}

const handleModalClose = () => {
  isModalOpen.value = false
  booking.clearSelection()
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 md:py-8">
    <!-- Loading State -->
    <div v-if="isLoadingConfig" class="flex flex-col items-center justify-center min-h-[60vh]">
      <span class="loading loading-spinner loading-lg mb-4"></span>
      <p class="text-base-content/70">Lade Buchungsinformationen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="configError" class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="alert alert-error max-w-md">
        <AlertCircle class="w-6 h-6" />
        <div>
          <h3 class="font-bold">Fehler</h3>
          <div class="text-sm">{{ configError }}</div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Header -->
      <div class="mb-6 md:mb-8">
        <div class="flex items-center gap-3 mb-2">
          <CalendarCheck class="w-8 h-8 text-primary" />
          <h1 class="text-2xl md:text-3xl font-bold text-base-content">
            Termin buchen
          </h1>
        </div>
        <p class="text-base-content/70">
          Wählen Sie einen Tag und einen verfügbaren Zeitslot für Ihren Termin
        </p>
      </div>

      <!-- Success Alert -->
      <div
        v-if="showSuccessAlert"
        class="alert alert-success mb-6"
      >
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
        <button
          class="btn btn-sm btn-ghost"
          @click="showSuccessAlert = false"
        >
          Schließen
        </button>
      </div>

      <!-- Error Alert -->
      <div
        v-if="showErrorAlert"
        class="alert alert-error mb-6"
      >
        <AlertCircle class="w-5 h-5" />
        <span>{{ booking.error }}</span>
        <button
          class="btn btn-sm btn-ghost"
          @click="showErrorAlert = false"
        >
          Schließen
        </button>
      </div>

      <!-- Calendar and Slots Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Month Calendar -->
      <div class="order-1">
        <BookingMonthCalendar
          :month-data="booking.monthData.value"
          :selected-date="booking.selectedDate.value"
          @select-date="booking.selectDate"
          @previous-month="booking.previousMonth"
          @next-month="booking.nextMonth"
          @go-to-today="booking.goToToday"
        />

      </div>

      <!-- Slot View -->
      <div class="order-2">
        <div v-if="booking.selectedDate.value && booking.selectedDaySlots.value">
          <BookingSlotView
            :selected-date="booking.selectedDate.value"
            :grouped-slots="booking.selectedDaySlots.value"
            @select-slot="handleSlotSelect"
          />
        </div>
        <div
          v-else
          class="card bg-base-100/50 shadow-lg p-12 flex flex-col items-center justify-center text-center"
        >
          <CalendarCheck class="w-16 h-16 text-base-content/20 mb-4" />
          <p class="text-base-content/70 font-medium mb-2">
            Wählen Sie einen Tag
          </p>
          <p class="text-sm text-base-content/50">
            Klicken Sie auf einen Tag im Kalender, um verfügbare Zeitslots anzuzeigen
          </p>
        </div>
      </div>
      </div>

      <!-- Booking Modal -->
      <BookingModal
        :slot="booking.selectedSlot.value"
        :is-open="isModalOpen"
        :max-series-count="bookingConfig.maxSeriesCount"
        @close="handleModalClose"
        @submit="handleBookingSubmit"
        @calculate-series="handleCalculateSeries"
      />

      <!-- Info Section -->
      <div class="mt-8 p-6 bg-info/10 rounded-lg">
        <h3 class="font-semibold text-base-content mb-2">Wichtige Informationen</h3>
        <ul class="space-y-2 text-sm text-base-content/70">
          <li>• Termine können bis zu {{ bookingConfig.maxAdvanceDays }} Tage im Voraus gebucht werden</li>
          <li>• Jeder Termin dauert {{ bookingConfig.slotDuration }} Minuten</li>
          <li>• Sie können Serientermine für wöchentliche oder 2-wöchentliche Wiederholungen buchen</li>
          <li>• Maximal {{ bookingConfig.maxSeriesCount }} Termine pro Serienbuchung</li>
          <li>• Sie erhalten eine Bestätigungs-E-Mail mit allen Details</li>
        </ul>
      </div>
    </div>
  </div>
</template>

