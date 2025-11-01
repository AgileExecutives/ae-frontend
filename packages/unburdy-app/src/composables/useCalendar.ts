import { ref, computed, watch } from 'vue'
import { getApiClient } from '@/config/api-config'

interface CalendarEvent {
  id?: number
  tenant_id?: number
  user_id?: number
  calendar_id?: number
  title?: string
  is_exception?: boolean
  date_from?: string
  date_to?: string
  time_from?: string
  time_to?: string
  timezone?: string
  type?: string
  description?: string
  location?: string
  is_all_day?: boolean
  created_at?: string
  updated_at?: string
  series_id?: number
}

interface CalendarSeries {
  id: string
  title: string
  recurrence_rule: string
  start_date: string
  end_date?: string
  events: CalendarEvent[]
}

interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  type: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  description?: string
  attendees?: string[]
  date?: string
}

export const useCalendar = () => {
  // State
  const events = ref<CalendarEvent[]>([])
  const series = ref<CalendarSeries[]>([])
  const currentDate = ref(new Date())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Cache for performance
  const eventCache = new Map<string, CalendarEvent[]>()
  const seriesCache = new Map<string, CalendarSeries[]>()

  // API client
  const apiClient = getApiClient()

  // Enhanced caching system
  const cache = ref({
    lastFetch: null as Date | null,
    data: [] as CalendarEvent[],
    isValid: false
  })

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000

  // Check if cache is still valid
  const isCacheValid = () => {
    if (!cache.value.lastFetch || !cache.value.isValid) return false
    const now = new Date()
    return (now.getTime() - cache.value.lastFetch.getTime()) < CACHE_DURATION
  }

  // Load all calendar data with enhanced caching
  const loadAllCalendarData = async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      console.log('📅 Using cached calendar data')
      events.value = [...cache.value.data]
      buildCache()
      return
    }

    if (isLoading.value) return

    isLoading.value = true
    error.value = null
    
    try {
      console.log('📅 Fetching all calendar data from /calendar endpoint')
      
      // Check if calendar methods are available
      if (typeof apiClient.getCalendarEvents !== 'function') {
        console.warn('📅 Calendar API methods not available yet')
        events.value = []
        series.value = []
        return
      }
      
      // Fetch all calendar data from /calendar endpoint
      const response = await apiClient.getCalendar()
      
      console.log('📅 Calendar response:', response)
      
      if (response.success && response.data && response.data.calendars && response.data.calendars.length > 0) {
        const calendarData = Array.isArray(response.data.calendars) ? response.data.calendars : []
        console.log('📅 Loaded calendar data:', calendarData.length, 'items')
        
        // Update cache
        cache.value = {
          lastFetch: new Date(),
          data: [...calendarData],
          isValid: true
        }
        
        const calendar =  calendarData[0]
        // Update reactive state
        events.value = calendar.calendar_entries || []
        
        // For now, we'll treat all data as events. Later we can separate series if needed
        series.value = calendar.calendar_series || []
        
        console.log(calendar.calendar_series)
        console.log(calendar.calendar_entries)
        console.log('📅 Calendar data cached and loaded successfully')
      } else {
        console.warn('📅 No calendar data loaded:', response.error)
        error.value = response.error || 'Failed to load calendar data'
        events.value = []
        series.value = []
      }
      
      // Build cache for quick lookups
      buildCache()
      
    } catch (err) {
      console.error('📅 Error loading calendar data:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load calendar data'
      
      // Set empty arrays on error
      events.value = []
      series.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Build performance cache
  const buildCache = () => {
    eventCache.clear()
    seriesCache.clear()
    
    console.log('📅 Building cache for', events.value.length, 'events')
    
    // Cache events by month for quick access
    events.value.forEach(event => {
      const monthKey = (event.date_from || '').substring(0, 7) // YYYY-MM
      if (!eventCache.has(monthKey)) {
        eventCache.set(monthKey, [])
      }
      eventCache.get(monthKey)!.push(event)
    })
    
    console.log('📅 Cache built:', eventCache.size, 'months')
  }

  // Convert API event to Meeting format
    const convertApiEventToMeeting = (event: CalendarEvent): Meeting => {
    // Ensure required fields have defaults
    const eventId = event.id?.toString() || ''
    const eventTitle = event.title || 'Untitled Event'
    const eventDateFrom = event.date_from || new Date().toISOString().split('T')[0]
    const eventTimeFrom = event.time_from || '09:00'
    const eventTimeTo = event.time_to || '10:00'
    const eventType = event.type || 'appointment'
    
    // Parse date and time (eventDateFrom is guaranteed to have a default)
    const date = eventDateFrom
    
    // Extract time from datetime strings (expecting YYYY-MM-DDTHH:mm format or just HH:mm)
    const timeFromMatch = eventTimeFrom.match(/T(\d{2}):(\d{2})/)
    const timeToMatch = eventTimeTo.match(/T(\d{2}):(\d{2})/)
    
    const startTime = timeFromMatch ? `${timeFromMatch[1]}:${timeFromMatch[2]}` : eventTimeFrom
    const endTime = timeToMatch ? `${timeToMatch[1]}:${timeToMatch[2]}` : eventTimeTo
    
    // Extract client name from title (assumes format: "Client Name, Meeting Type")
    const clientName = eventTitle.split(',')[0]?.trim()
    
    // Map event type to badge color
    const typeMap: Record<string, Meeting['type']> = {
      'appointment': 'primary',
      'meeting': 'secondary', 
      'call': 'accent',
      'personal': 'info',
      'holiday': 'success',
      'urgent': 'warning',
      'cancelled': 'error'
    }

    return {
      id: eventId,
      title: eventTitle,
      date,
      startTime,
      endTime,
      type: typeMap[eventType] || 'primary',
      description: event.description,
      attendees: [] // TODO: Map participants if available
    }
  }

  // Current week events (reactive)
  const currentWeekEvents = computed(() => {
    return getWeekEvents(currentDate.value)
  })

  // Navigation methods that return filtered events
  const prevWeek = (): Meeting[] => {
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() - 7)
    currentDate.value = newDate
    console.log('📅 Navigate to previous week:', newDate.toISOString().split('T')[0])
    const weekEvents = getWeekEvents(newDate)
    console.log('📅 Previous week events:', weekEvents.length)
    return weekEvents
  }

  const nextWeek = (): Meeting[] => {
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() + 7)
    currentDate.value = newDate
    console.log('📅 Navigate to next week:', newDate.toISOString().split('T')[0])
    const weekEvents = getWeekEvents(newDate)
    console.log('📅 Next week events:', weekEvents.length)
    return weekEvents
  }

  const prevMonth = () => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentDate.value = newDate
    console.log('📅 Navigate to previous month:', newDate.toISOString().split('T')[0])
  }

  const nextMonth = () => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentDate.value = newDate
    console.log('📅 Navigate to next month:', newDate.toISOString().split('T')[0])
  }

  const prevYear = () => {
    const newDate = new Date(currentDate.value)
    newDate.setFullYear(newDate.getFullYear() - 1)
    currentDate.value = newDate
    console.log('📅 Navigate to previous year:', newDate.toISOString().split('T')[0])
  }

  const nextYear = () => {
    const newDate = new Date(currentDate.value)
    newDate.setFullYear(newDate.getFullYear() + 1)
    currentDate.value = newDate
    console.log('📅 Navigate to next year:', newDate.toISOString().split('T')[0])
  }

  const goToToday = (): Meeting[] => {
    currentDate.value = new Date()
    console.log('📅 Navigate to today:', currentDate.value.toISOString().split('T')[0])
    const weekEvents = getWeekEvents(currentDate.value)
    console.log('📅 Today week events:', weekEvents.length)
    return weekEvents
  }

  const goToDate = (date: Date): Meeting[] => {
    currentDate.value = new Date(date)
    console.log('📅 Navigate to date:', currentDate.value.toISOString().split('T')[0])
    const weekEvents = getWeekEvents(currentDate.value)
    console.log('📅 Selected date week events:', weekEvents.length)
    return weekEvents
  }

  // Data getters with caching
  const getWeekEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    const weekStart = getWeekStart(targetDate)
    const weekEnd = getWeekEnd(targetDate)
    
    console.log('📅 Getting week events from cache for:', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0])
    
    const weekEvents = events.value.filter(event => {
      const dateFrom: string = event.date_from || ''
      if (!dateFrom) return false
      const eventDate = new Date(dateFrom)
      const isInWeek = eventDate >= weekStart && eventDate <= weekEnd
      return isInWeek
    })
    
    console.log('📅 Found', weekEvents.length, 'events for week')
    
    return weekEvents.map(convertApiEventToMeeting)
  }

  const getDayEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    const dayStr = targetDate.toISOString().split('T')[0]
    
    const dayEvents = events.value.filter(event => {
      if (!event.date_from) return false
      // @ts-expect-error - TypeScript can't infer the narrowing properly
      return event.date_from.includes(dayStr)
    })
    
    return dayEvents.map(convertApiEventToMeeting)
  }

  const getMonthEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    const monthKey = targetDate.toISOString().substring(0, 7)
    
    const monthEvents = eventCache.get(monthKey) || []
    return monthEvents.map(convertApiEventToMeeting)
  }

  const getYearEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    const year = targetDate.getFullYear().toString()
    
    const yearEvents = events.value.filter(event => {
      const dateFrom: string = event.date_from || ''
      return dateFrom.startsWith(year)
    })
    
    return yearEvents.map(convertApiEventToMeeting)
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

  // Load events for current week using cached data
  const loadWeekEvents = async (date?: Date): Promise<Meeting[]> => {
    const targetDate = date || currentDate.value
    
    console.log('📅 Getting week events from cache for:', targetDate.toISOString().split('T')[0])
    
    // Ensure data is loaded first
    await ensureInitialized()
    
    // Only use cached data - no API calls during navigation
    const weekEvents = getWeekEvents(targetDate)
    console.log('📅 Loaded week events:', weekEvents.length)
    return weekEvents
  }



  // Initialize on first use
  let initialized = false
  const ensureInitialized = async () => {
    if (!initialized) {
      await loadAllCalendarData()
      
      // No sample data - calendar will be empty if no API data available
      if (events.value.length === 0) {
        console.log('📅 No API data available, calendar will be empty')
      }
      
      initialized = true
    }
  }

  // Navigation is now purely client-side using cached data
  // No API calls on date changes - all data is prefetched

  return {
    // State
    events: computed(() => events.value),
    series: computed(() => series.value),
    currentDate: computed(() => currentDate.value),
    currentWeekEvents,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Methods
    loadAllCalendarData,
    loadWeekEvents,
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
    convertApiEventToMeeting,
    
    // Cache management
    refreshCache: () => loadAllCalendarData(true),
    getCacheStatus: () => ({
      isValid: isCacheValid(),
      lastFetch: cache.value.lastFetch,
      itemCount: cache.value.data.length
    })
  }
}