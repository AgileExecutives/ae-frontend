import { computed, ref } from 'vue'
import { useCalendarStore } from '@/stores/calendarStore'
import { useCalendarApi } from '@/composables/useCalendarApi'
import type { CalendarEvent, Meeting } from '@/types/calendar'

export function useCalendar() {
  const store = useCalendarStore()
  const { fetchCalendarData } = useCalendarApi()

  // Caching logic
  const cache = ref({
    lastFetch: null as Date | null,
    isValid: false,
  })
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const isCacheValid = () => {
    if (!cache.value.lastFetch || !cache.value.isValid)
      return false
    const now = new Date()
    return (now.getTime() - cache.value.lastFetch.getTime()) < CACHE_DURATION
  }

  async function loadAllCalendarData(forceRefresh = false) {
    if (!forceRefresh && isCacheValid())
      return
    const result = await fetchCalendarData()
    if (result && result.success) {
      cache.value = {
        lastFetch: new Date(),
        isValid: true,
      }
    }
  }

  // Event conversion logic
  const convertApiEventToMeeting = (event: CalendarEvent): Meeting => {
    const eventId = event.id?.toString() || ''
    const eventTitle = event.title || 'Untitled Event'
    const eventDateFrom = event.date_from || new Date().toISOString().split('T')[0]
    const eventTimeFrom = event.time_from || '09:00'
    const eventTimeTo = event.time_to || '10:00'
    const eventType = event.type || 'appointment'

    const date = eventDateFrom.split('T')[0]
    const timeFromMatch = eventTimeFrom.match(/T(\d{2}):(\d{2})/)
    const timeToMatch = eventTimeTo.match(/T(\d{2}):(\d{2})/)
    const startTime = timeFromMatch ? `${timeFromMatch[1]}:${timeFromMatch[2]}` : eventTimeFrom
    const endTime = timeToMatch ? `${timeToMatch[1]}:${timeToMatch[2]}` : eventTimeTo

    const classificationMap: Record<string, Meeting['classification']> = {
      'appointment': 'primary',
      'meeting': 'secondary',
      'call': 'accent',
      'personal': 'info',
      'holiday': 'success',
      'public_holiday': 'error',
      'school_holiday': 'school_holiday',
      'urgent': 'warning',
      'cancelled': 'error',
    }

    const meetingClassification: Meeting['classification'] = classificationMap[eventType] || 'primary'

    const eventDateTo = event.date_to || eventDateFrom
    const endDate = eventDateTo ? eventDateTo.split('T')[0] : date
    const isMultiDay = !!(event.is_all_day && eventDateFrom !== eventDateTo)

    return {
      id: eventId,
      title: eventTitle,
      date,
      endDate,
      startTime,
      endTime,
      classification: meetingClassification,
      type: eventType,
      description: event.description,
      attendees: [],
      isAllDay: event.is_all_day || false,
      isMultiDay,
    }
  }

  const expandMultiDayEvent = (meeting: Meeting): Meeting[] => {
    if (!meeting.isMultiDay || !meeting.date || !meeting.endDate)
      return [meeting]

    const startDate = new Date(meeting.date)
    const endDate = new Date(meeting.endDate)
    const expanded: Meeting[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      expanded.push({
        ...meeting,
        id: `${meeting.id}-${dateStr}`,
        date: dateStr,
        endDate: meeting.endDate,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return expanded
  }

  const convertAndExpandEvents = (apiEvents: CalendarEvent[]): Meeting[] => {
    return apiEvents.flatMap(event => expandMultiDayEvent(convertApiEventToMeeting(event)))
  }

  // Computed properties for events
  const currentWeekEvents = computed(() => getWeekEvents(store.currentDate))
  const currentDayEvents = computed(() => getDayEvents(store.currentDate))

  // Navigation
  const navigate = (dateUpdater: (d: Date) => void) => {
    const newDate = new Date(store.currentDate)
    dateUpdater(newDate)
    store.setCurrentDate(newDate)
  }
  const prevWeek = () => navigate(d => d.setDate(d.getDate() - 7))
  const nextWeek = () => navigate(d => d.setDate(d.getDate() + 7))
  const prevMonth = () => navigate(d => d.setMonth(d.getMonth() - 1))
  const nextMonth = () => navigate(d => d.setMonth(d.getMonth() + 1))
  const prevYear = () => navigate(d => d.setFullYear(d.getFullYear() - 1))
  const nextYear = () => navigate(d => d.setFullYear(d.getFullYear() + 1))
  const goToToday = () => store.setCurrentDate(new Date())
  const goToDate = (date: Date) => store.setCurrentDate(new Date(date))

  // Data getters
  const getEventsInRange = (startDate: Date, endDate: Date): Meeting[] => {
    if (!store.events || !Array.isArray(store.events)) return []
    const filteredEvents = store.events.filter((event: CalendarEvent) => {
      if (!event.date_from) return false
      const eventStart = new Date(event.date_from)
      const eventEnd = new Date(event.date_to || event.date_from)
      return eventStart <= endDate && eventEnd >= startDate
    })
    return convertAndExpandEvents(filteredEvents)
  }

  const getWeekEvents = (date: Date): Meeting[] => {
    const weekStart = getWeekStart(date)
    const weekEnd = getWeekEnd(date)
    const rangeEvents = getEventsInRange(weekStart, weekEnd)
    const filtered = rangeEvents.filter((meeting) => {
      if (!meeting.date) return false
      const meetingDate = new Date(meeting.date)
      return meetingDate >= weekStart && meetingDate <= weekEnd
    })
    return filtered
  }

  const getDayEvents = (date: Date): Meeting[] => {
    const dayStr = date.toISOString().split('T')[0]
    const dayStart = new Date(dayStr)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStr)
    dayEnd.setHours(23, 59, 59, 999)
    return getEventsInRange(dayStart, dayEnd).filter(meeting => meeting.date === dayStr)
  }

  const getMonthEvents = (date: Date): Meeting[] => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    // Add a week before and after to handle overlap in calendar views
    const startWithBuffer = new Date(startOfMonth)
    startWithBuffer.setDate(startWithBuffer.getDate() - 7)
    const endWithBuffer = new Date(endOfMonth)
    endWithBuffer.setDate(endWithBuffer.getDate() + 7)
    
    return getEventsInRange(startWithBuffer, endWithBuffer)
  }

  const getYearEvents = (date: Date): Meeting[] => {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const endOfYear = new Date(date.getFullYear(), 11, 31)
    
    // Add a week before and after to handle overlap in calendar views
    const startWithBuffer = new Date(startOfYear)
    startWithBuffer.setDate(startWithBuffer.getDate() - 7)
    const endWithBuffer = new Date(endOfYear)
    endWithBuffer.setDate(endWithBuffer.getDate() + 7)
    
    return getEventsInRange(startWithBuffer, endWithBuffer)
  }

  // Utility functions
  const getWeekStart = (date: Date): Date => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday start
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const getWeekEnd = (date: Date): Date => {
    const end = getWeekStart(date)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }

  let initialized = false
  async function ensureInitialized() {
    if (!initialized) {
      await loadAllCalendarData()
      initialized = true
    }
  }

  const isHoliday = (meeting: Meeting): boolean => meeting.type === 'holiday'
  const getType = (meeting: Meeting): string => meeting.type || 'appointment'
  const filterByType = (meetings: Meeting[], type: string): Meeting[] => meetings.filter(m => m.type === type)

  return {
    // State
    events: computed(() => store.events),
    series: computed(() => store.series),
    currentDate: computed(() => store.currentDate),
    currentWeekEvents,
    currentDayEvents,
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    calendarName: computed(() => store.calendarName),
    calendarColor: computed(() => store.calendarColor),

    // Methods
    loadAllCalendarData,
    ensureInitialized,

    // Navigation
    prevWeek,
    nextWeek,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    goToToday,
    goToDate,

    // Data access
    getWeekEvents,
    getDayEvents,
    getMonthEvents,
    getYearEvents,

    // Utilities
    isHoliday,
    getType,
    filterByType,

    // Cache management
    refreshCache: () => loadAllCalendarData(true),
    getCacheStatus: () => ({
      isValid: isCacheValid(),
      lastFetch: cache.value.lastFetch,
    }),
  }
}