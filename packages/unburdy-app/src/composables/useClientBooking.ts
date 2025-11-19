import { ref, computed, type Ref } from 'vue'
import type {
  BookingConfig,
  TimeSlot,
  DayAvailability,
  MonthData,
  Appointment,
  BookingRequest,
  TimeOfDay,
  GroupedSlots,
  SlotFilter,
  RecurrencePattern,
  TimeRange
} from '@/types/client-booking'

/**
 * Composable for client booking functionality
 */
export function useClientBooking(config: BookingConfig) {
  // State
  const appointments = ref<Appointment[]>([])
  const selectedDate = ref<string | null>(null)
  const selectedSlot = ref<TimeSlot | null>(null)
  const currentMonth = ref(new Date())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const bookingConfig = ref<BookingConfig>(config)
  const monthDataOverride = ref<MonthData | null>(null)

  /**
   * Get day name from date
   */
  const getDayName = (date: Date): keyof typeof bookingConfig.value.weeklyAvailability => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    return days[date.getDay()] as keyof typeof bookingConfig.value.weeklyAvailability
  }

  /**
   * Classify time into time of day
   */
  const getTimeOfDay = (time: string): TimeOfDay => {
    const hour = parseInt(time.split(':')[0] || '0')
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  /**
   * Add minutes to time string
   */
  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number)
    const totalMinutes = (hours || 0) * 60 + (mins || 0) + minutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }

  /**
   * Compare times (returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2)
   */
  const compareTimes = (time1: string, time2: string): number => {
    const [h1, m1] = time1.split(':').map(Number)
    const [h2, m2] = time2.split(':').map(Number)
    const minutes1 = (h1 || 0) * 60 + (m1 || 0)
    const minutes2 = (h2 || 0) * 60 + (m2 || 0)
    return minutes1 - minutes2
  }

  /**
   * Check if a slot is booked
   */
  const isSlotBooked = (date: string, startTime: string, endTime: string): boolean => {
    return appointments.value.some(apt => {
      if (apt.date !== date || apt.status === 'cancelled') return false
      
      // Check for overlap
      const aptStart = apt.startTime
      const aptEnd = apt.endTime
      
      return !(compareTimes(endTime, aptStart) <= 0 || compareTimes(startTime, aptEnd) >= 0)
    })
  }

  /**
   * Generate all possible slots for a given date
   */
  const generateSlotsForDate = (date: Date): TimeSlot[] => {
    const dateStr = date.toISOString().split('T')[0] || ''
    const dayName = getDayName(date)
    const timeRanges = bookingConfig.value.weeklyAvailability[dayName] || []
    
    const slots: TimeSlot[] = []
    
    // For each time range in the day
    for (const range of timeRanges) {
      let currentTime = range.start
      
      while (compareTimes(currentTime, range.end) < 0) {
        const slotEndTime = addMinutes(currentTime, bookingConfig.value.slotDuration)
        
        // Check if slot fits within range
        if (compareTimes(slotEndTime, range.end) <= 0) {
          const isAvailable = !isSlotBooked(dateStr, currentTime, slotEndTime)
          
          slots.push({
            id: `${dateStr}-${currentTime}`,
            date: dateStr,
            startTime: currentTime,
            endTime: slotEndTime,
            timeOfDay: getTimeOfDay(currentTime),
            isAvailable
          })
        }
        
        // Move to next slot (including buffer time)
        currentTime = addMinutes(currentTime, bookingConfig.value.slotDuration + bookingConfig.value.bufferTime)
      }
    }
    
    return slots
  }

  /**
   * Calculate availability for series bookings
   */
  const calculateSeriesAvailability = (
    slot: TimeSlot,
    recurrence: RecurrencePattern
  ): number => {
    if (recurrence === 'once') return 1
    
    const weekIncrement = recurrence === 'weekly' ? 7 : 14
    let count = 1 // Start with the initial slot
    let currentDate = new Date(slot.date)
    
    for (let i = 1; i < bookingConfig.value.maxSeriesCount; i++) {
      currentDate.setDate(currentDate.getDate() + weekIncrement)
      const dateStr = currentDate.toISOString().split('T')[0] || ''
      
      // Check if slot is available on this future date
      if (isSlotBooked(dateStr, slot.startTime, slot.endTime)) {
        break
      }
      
      count++
    }
    
    return count
  }

  /**
   * Group slots by time of day
   */
  const groupSlotsByTimeOfDay = (slots: TimeSlot[]): GroupedSlots => {
    return {
      morning: slots.filter(s => s.timeOfDay === 'morning'),
      afternoon: slots.filter(s => s.timeOfDay === 'afternoon'),
      evening: slots.filter(s => s.timeOfDay === 'evening')
    }
  }

  /**
   * Get availability for a specific day
   */
  const getDayAvailability = (date: Date): DayAvailability => {
    const slots = generateSlotsForDate(date)
    const availableSlots = slots.filter(s => s.isAvailable)
    const dateStr = date.toISOString().split('T')[0] || ''
    
    let status: 'available' | 'partial' | 'none' = 'none'
    if (availableSlots.length === slots.length && slots.length > 0) {
      status = 'available'
    } else if (availableSlots.length > 0) {
      status = 'partial'
    }
    
    return {
      date: dateStr,
      availableCount: availableSlots.length,
      totalCount: slots.length,
      status,
      slots
    }
  }

  /**
   * Get month data with all days and availability
   */
  const getMonthData = (date: Date): MonthData => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days: DayAvailability[] = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      
      // Skip past dates
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (currentDate < today) continue
      
      // Check max advance days
      if (bookingConfig.value.maxAdvanceDays) {
        const maxDate = new Date(today)
        maxDate.setDate(maxDate.getDate() + bookingConfig.value.maxAdvanceDays)
        if (currentDate > maxDate) continue
      }
      
      days.push(getDayAvailability(currentDate))
    }
    
    return {
      year,
      month: month + 1,
      days
    }
  }

  /**
   * Create a booking
   */
  const createBooking = async (request: BookingRequest): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    
    try {
      const newAppointments: Appointment[] = []
      const seriesId = request.seriesCount > 1 ? `series-${Date.now()}` : undefined
      const weekIncrement = request.recurrence === 'weekly' ? 7 : 14
      
      // Create appointments for series
      for (let i = 0; i < request.seriesCount; i++) {
        const appointmentDate = new Date(request.slot.date)
        if (i > 0) {
          appointmentDate.setDate(appointmentDate.getDate() + weekIncrement * i)
        }
        
        const dateStr = appointmentDate.toISOString().split('T')[0] || ''
        
        // Verify slot is still available
        if (isSlotBooked(dateStr, request.slot.startTime, request.slot.endTime)) {
          error.value = `Slot at ${dateStr} ${request.slot.startTime} is no longer available`
          return false
        }
        
        newAppointments.push({
          id: `apt-${Date.now()}-${i}`,
          date: dateStr,
          startTime: request.slot.startTime,
          endTime: request.slot.endTime,
          clientName: request.name,
          clientEmail: request.email,
          message: request.message,
          isSeries: request.seriesCount > 1,
          seriesId,
          recurrence: request.seriesCount > 1 ? request.recurrence : undefined,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        })
      }
      
      // Add all appointments
      appointments.value.push(...newAppointments)
      
      // TODO: Send to backend API
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create booking'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cancel a booking
   */
  const cancelBooking = async (appointmentId: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    
    try {
      const apt = appointments.value.find(a => a.id === appointmentId)
      if (!apt) {
        error.value = 'Appointment not found'
        return false
      }
      
      apt.status = 'cancelled'
      
      // TODO: Send to backend API
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to cancel booking'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Computed properties
  const monthData = computed(() => {
    // If we have override data from API, use that
    if (monthDataOverride.value) {
      return monthDataOverride.value
    }
    // Otherwise generate from config
    return getMonthData(currentMonth.value)
  })
  
  const selectedDaySlots = computed(() => {
    if (!selectedDate.value) return null
    
    const day = monthData.value.days.find(d => d.date === selectedDate.value)
    return day ? groupSlotsByTimeOfDay(day.slots.filter(s => s.isAvailable)) : null
  })

  const availableSlotsCount = computed(() => {
    return monthData.value.days.reduce((sum, day) => sum + day.availableCount, 0)
  })

  // Methods
  const selectDate = (date: string) => {
    selectedDate.value = date
    selectedSlot.value = null
  }

  const selectSlot = (slot: TimeSlot) => {
    selectedSlot.value = slot
  }

  const clearSelection = () => {
    selectedSlot.value = null
  }

  const nextMonth = () => {
    currentMonth.value = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() + 1,
      1
    )
  }

  const previousMonth = () => {
    currentMonth.value = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() - 1,
      1
    )
  }

  const goToToday = () => {
    currentMonth.value = new Date()
    const today = new Date().toISOString().split('T')[0]
    selectedDate.value = today || null
  }

  /**
   * Update booking configuration
   */
  const updateConfig = (newConfig: BookingConfig) => {
    bookingConfig.value = newConfig
  }

  /**
   * Set month data from API
   */
  const setMonthData = (data: MonthData) => {
    monthDataOverride.value = data
    // Update current month to match the data
    currentMonth.value = new Date(data.year, data.month - 1, 1)
  }

  return {
    // State
    appointments,
    selectedDate,
    selectedSlot,
    currentMonth,
    isLoading,
    error,
    
    // Computed
    monthData,
    selectedDaySlots,
    availableSlotsCount,
    
    // Methods
    selectDate,
    selectSlot,
    clearSelection,
    createBooking,
    cancelBooking,
    nextMonth,
    previousMonth,
    goToToday,
    calculateSeriesAvailability,
    groupSlotsByTimeOfDay,
    getDayAvailability,
    getMonthData,
    updateConfig,
    setMonthData
  }
}
