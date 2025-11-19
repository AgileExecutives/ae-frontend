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

// Initialize booking composable (will be updated after API load)
const booking = useClientBooking(bookingConfig.value)

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
      
      console.log('API Response:', {
        hasConfig: !!freeSlotsData.config,
        hasMonthData: !!freeSlotsData.monthData,
        hasSlots: !!freeSlotsData.slots,
        slotsCount: freeSlotsData.slots?.length || 0,
        monthDataDays: freeSlotsData.monthData?.days?.length || 0,
        monthDataSample: freeSlotsData.monthData?.days?.[0],
        slotsSample: freeSlotsData.slots?.slice(0, 2)
      })
      
      // Update booking config from API response
      if (freeSlotsData.config) {
        const newConfig: BookingConfig = {
          slotDuration: freeSlotsData.config.duration || 30,
          bufferTime: freeSlotsData.config.buffer_time || 5,
          maxSeriesCount: freeSlotsData.config.number_max || 10,
          minAdvanceHours: 24, // TODO: Get from template
          maxAdvanceDays: 90, // TODO: Get from template
          weeklyAvailability: freeSlotsData.config.weekly_availability || bookingConfig.value.weeklyAvailability
        }
        
        bookingConfig.value = newConfig
        
        // Update the booking composable config
        booking.updateConfig(newConfig)
      }
      
      // Process month data if available
      if (freeSlotsData.monthData) {
        // If we have both monthData and slots array, we need to populate the days with slots
        let daysWithSlots = freeSlotsData.monthData.days || []
        
        // If there's also a slots array, group them by date and add to days
        if (freeSlotsData.slots && Array.isArray(freeSlotsData.slots)) {
          const slotsByDate = new Map<string, any[]>()
          
          // Helper function to extract time from ISO datetime string
          const extractTime = (isoString: string): string => {
            if (!isoString) return ''
            const timePart = isoString.split('T')[1]
            if (!timePart) return ''
            // Return HH:MM (remove seconds if present)
            return timePart.substring(0, 5)
          }
          
          freeSlotsData.slots.forEach((slot: any) => {
            const date = slot.date || slot.start_time?.split('T')[0] || ''
            if (!slotsByDate.has(date)) {
              slotsByDate.set(date, [])
            }
            slotsByDate.get(date)?.push({
              id: slot.id || '',
              time: slot.time || extractTime(slot.start_time),
              date: date,
              startTime: extractTime(slot.start_time),
              endTime: extractTime(slot.end_time),
              duration: slot.duration || freeSlotsData.config?.duration || 30,
              available: slot.available ?? true,
              isAvailable: slot.available ?? true,
              timeOfDay: (slot.time_of_day as 'morning' | 'afternoon' | 'evening') || 'morning',
              timezone: slot.timezone || 'Europe/Berlin'
            })
          })
          
          console.log(`Slots grouped by date: ${slotsByDate.size} days`)
          
          // Update the monthData days with the slots
          daysWithSlots = (freeSlotsData.monthData.days || []).map((day: any) => {
            const daySlots = slotsByDate.get(day.date) || []
            return {
              ...day,
              slots: daySlots
            }
          })
        }
        
        // Map API monthData to booking monthData format
        booking.setMonthData({
          year: freeSlotsData.monthData.year || new Date().getFullYear(),
          month: freeSlotsData.monthData.month || new Date().getMonth() + 1,
          days: daysWithSlots.map((day: any) => {
            const daySlots = (day.slots || []).map((slot: any) => ({
              id: slot.id || '',
              time: slot.time || slot.startTime || '',
              date: slot.date || day.date || '',
              startTime: slot.startTime || '',
              endTime: slot.endTime || '',
              duration: slot.duration || freeSlotsData.config?.duration || 30,
              available: slot.available ?? slot.isAvailable ?? true,
              isAvailable: slot.available ?? slot.isAvailable ?? true,
              timeOfDay: (slot.time_of_day || slot.timeOfDay) as 'morning' | 'afternoon' | 'evening' || 'morning',
              timezone: slot.timezone || 'Europe/Berlin'
            }))
            
            // A slot is available if the 'available' field is true OR undefined (default to true)
            const availableSlots = daySlots.filter((s: any) => s.available !== false)
            
            console.log(`MonthData day ${day.date}: ${daySlots.length} total, ${availableSlots.length} available`)
            
            return {
              date: day.date || '',
              dayOfWeek: day.dayOfWeek || 0,
              isCurrentMonth: day.isCurrentMonth ?? true,
              isToday: day.isToday ?? false,
              slots: daySlots,
              availableCount: availableSlots.length,
              totalCount: daySlots.length,
              status: (availableSlots.length === daySlots.length && daySlots.length > 0 
                ? 'available' 
                : availableSlots.length > 0 
                  ? 'partial' 
                  : 'none') as 'available' | 'partial' | 'none'
            }
          })
        })
        
        console.log('MonthData days with status:', freeSlotsData.monthData.days?.map((d: any) => ({
          date: d.date,
          slots: d.slots?.length || 0,
          status: d.status || 'calculated in mapping'
        })).slice(0, 5))
      } else if (freeSlotsData.slots && Array.isArray(freeSlotsData.slots)) {
        // If only slots array is provided, group by date
        console.log('Processing flat slots array')
        console.log('First 3 slots sample:', freeSlotsData.slots.slice(0, 3))
        
        const slotsByDate = new Map<string, any[]>()
        
        freeSlotsData.slots.forEach((slot: any) => {
          const date = slot.date || slot.start_time?.split('T')[0] || ''
          if (!slotsByDate.has(date)) {
            slotsByDate.set(date, [])
          }
          slotsByDate.get(date)?.push({
            id: slot.id || '',
            time: slot.time || '',
            date: date,
            startTime: slot.start_time || '',
            endTime: slot.end_time || '',
            duration: slot.duration || freeSlotsData.config?.duration || 30,
            available: slot.available ?? true,
            isAvailable: slot.available ?? true,
            timeOfDay: (slot.time_of_day as 'morning' | 'afternoon' | 'evening') || 'morning',
            timezone: slot.timezone || 'Europe/Berlin'
          })
        })
        
        // Create monthData from grouped slots
        // Group days by month and create separate monthData for the earliest month with slots
        const allDays = Array.from(slotsByDate.entries())
          .map(([date, slots]) => {
            const dateObj = new Date(date)
            // A slot is available if the 'available' field is true OR undefined (default to true)
            const availableSlots = slots.filter((s: any) => s.available !== false)
            
            console.log(`Date ${date}: ${slots.length} total, ${availableSlots.length} available, first slot:`, slots[0])
            
            return {
              date,
              dateObj,
              year: dateObj.getFullYear(),
              month: dateObj.getMonth() + 1,
              dayOfWeek: dateObj.getDay(),
              isToday: date === new Date().toISOString().split('T')[0],
              slots,
              availableCount: availableSlots.length,
              totalCount: slots.length,
              status: (availableSlots.length === slots.length && slots.length > 0 
                ? 'available' 
                : availableSlots.length > 0 
                  ? 'partial' 
                  : 'none') as 'available' | 'partial' | 'none'
            }
          })
          .sort((a, b) => a.date.localeCompare(b.date))
        
        if (allDays.length > 0) {
          // Find the first month with available slots
          const firstDayWithSlots = allDays[0]!
          const targetYear = firstDayWithSlots.year
          const targetMonth = firstDayWithSlots.month
          
          // Filter days for the target month
          const monthDays = allDays
            .filter(d => d.year === targetYear && d.month === targetMonth)
            .map(d => ({
              date: d.date,
              dayOfWeek: d.dayOfWeek,
              isCurrentMonth: true,
              isToday: d.isToday,
              slots: d.slots,
              availableCount: d.availableCount,
              totalCount: d.totalCount,
              status: d.status
            }))
          
          console.log(`Showing month ${targetYear}-${targetMonth}: ${monthDays.length} days, ${monthDays.filter(d => d.availableCount > 0).length} with available slots`)
          console.log(`Total slots across all days: ${allDays.reduce((sum, d) => sum + d.totalCount, 0)}`)
          
          booking.setMonthData({
            year: targetYear,
            month: targetMonth,
            days: monthDays
          })
        }
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

