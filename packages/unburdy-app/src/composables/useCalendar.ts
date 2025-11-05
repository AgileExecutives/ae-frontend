import { computed, ref } from 'vue'
import { useCalendarStore } from '@/stores/calendarStore'
import { useCalendarApi } from '@/composables/useCalendarApi'
import { useDateTimeUtc } from '@/composables/useDateTimeUtc'
import type { CalendarEvent, Meeting } from '@/types/calendar'

export function useCalendar() {
  const store = useCalendarStore()
  const { fetchCalendarData } = useCalendarApi()
  const dateTime = useDateTimeUtc()

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

  // Event conversion logic using useDateTimeUtc
  const convertApiEventToMeeting = (event: CalendarEvent): Meeting => {
    const eventId = event.id.toString()
    const eventTitle = event.title || 'Untitled Event'
    
    // For all-day events, just use the date portion without time conversion
    // For regular events, use the datetime composable to extract local date and time from UTC strings
    const startDate = dateTime.getLocalDate(event.start_time)
    const endDate = dateTime.getLocalDate(event.end_time)
    
    let startTime: string
    let endTime: string
    
    if (event.is_all_day) {
      // For all-day events, use fixed times (don't convert from UTC)
      startTime = '00:00'
      endTime = '23:59'
    } else {
      // For regular events, convert UTC time to local time
      startTime = dateTime.getLocalTime(event.start_time)
      endTime = dateTime.getLocalTime(event.end_time)
    }

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
      'supervision': 'accent',
      'parent': 'primary',
    }

    const meetingClassification: Meeting['classification'] = classificationMap[event.type] || 'primary'
    const isMultiDay = !!(event.is_all_day && startDate !== endDate)

    // Extract attendee names from participants
    const attendees = event.participants?.map(p => p.name || p.email) || []

    return {
      id: eventId,
      title: eventTitle,
      date: startDate,
      endDate,
      startTime,
      endTime,
      classification: meetingClassification,
      type: event.type,
      description: event.description,
      attendees,
      isAllDay: event.is_all_day,
      isMultiDay,
      location: event.location,
      timezone: event.timezone,
    }
  }

  const expandMultiDayEvent = (meeting: Meeting): Meeting[] => {
    if (!meeting.isMultiDay || !meeting.date || !meeting.endDate)
      return [meeting]

    const startDate = new Date(meeting.date)
    const endDate = new Date(meeting.endDate)
    const expanded: Meeting[] = []
    const currentDate = new Date(startDate)

    // For all-day events, the end date is exclusive (ends at start of that day)
    // So we iterate up to but not including the end date
    while (currentDate < endDate) {
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
      if (!event.start_time) return false
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)
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
    const dayStr = date.toISOString().split('T')[0] || ''
    if (!dayStr) return []
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
    calendarId: computed(() => store.calendarId),

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