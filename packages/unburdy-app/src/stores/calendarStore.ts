import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CalendarEvent, CalendarSeries } from '@/types/calendar'

export const useCalendarStore = defineStore('calendar', () => {
  // --- State ---
  const events = ref<CalendarEvent[]>([])
  const series = ref<CalendarSeries[]>([])
  const currentDate = ref(new Date())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const calendarName = ref<string>('Calendar')
  const calendarColor = ref<string>('primary')
  const calendarId = ref<number | null>(null)

  // --- Getters ---
  const getEvents = computed(() => events.value)
  const getSeries = computed(() => series.value)
  const getCurrentDate = computed(() => currentDate.value)
  const getIsLoading = computed(() => isLoading.value)
  const getError = computed(() => error.value)
  const getCalendarName = computed(() => calendarName.value)
  const getCalendarColor = computed(() => calendarColor.value)
  const getCalendarId = computed(() => calendarId.value)

  // --- Actions ---
  function setEvents(newEventList: CalendarEvent[]) {
    events.value = newEventList
  }

  function setSeries(newSeriesList: CalendarSeries[]) {
    series.value = newSeriesList
  }

  function setCurrentDate(newDate: Date) {
    currentDate.value = newDate
  }

  function setIsLoading(loadingState: boolean) {
    isLoading.value = loadingState
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setCalendarInfo(name: string, color: string, id?: number) {
    calendarName.value = name
    calendarColor.value = color
    if (id !== undefined) {
      calendarId.value = id
    }
  }

  function reset() {
    events.value = []
    series.value = []
    currentDate.value = new Date()
    isLoading.value = false
    error.value = null
    calendarName.value = 'Calendar'
    calendarColor.value = 'primary'
    calendarId.value = null
  }

  return {
    // State
    events,
    series,
    currentDate,
    isLoading,
    error,
    calendarName,
    calendarColor,
    calendarId,

    // Getters
    getEvents,
    getSeries,
    getCurrentDate,
    getIsLoading,
    getError,
    getCalendarName,
    getCalendarColor,
    getCalendarId,

    // Actions
    setEvents,
    setSeries,
    setCurrentDate,
    setIsLoading,
    setError,
    setCalendarInfo,
    reset,
  }
})
