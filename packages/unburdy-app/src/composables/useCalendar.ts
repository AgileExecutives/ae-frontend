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
  classification: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'school_holiday'
  type?: string // Original backend type for holidays and other identification
  description?: string
  attendees?: string[]
  date?: string // Start date - YYYY-MM-DD format
  endDate?: string // End date - YYYY-MM-DD format (for multi-day events)
  isAllDay?: boolean // All-day event flag
  isMultiDay?: boolean // Flag to indicate if event spans multiple days
}

export const useCalendar = () => {
  // State
  const events = ref<CalendarEvent[]>([])
  const series = ref<CalendarSeries[]>([])
  const currentDate = ref(new Date())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Debug: Watch for events changes
  watch(events, (newEvents, oldEvents) => {
    console.log('📅 WATCH: Events changed!')
    console.log('📅 WATCH: Old events count:', oldEvents?.length || 0)
    console.log('📅 WATCH: New events count:', newEvents?.length || 0)
    const oldHolidays = oldEvents?.filter(e => e.type === 'public_holiday' || e.type === 'school_holiday') || []
    const newHolidays = newEvents?.filter(e => e.type === 'public_holiday' || e.type === 'school_holiday') || []
    console.log('📅 WATCH: Old holidays:', oldHolidays.length, oldHolidays.map(h => h.title))
    console.log('📅 WATCH: New holidays:', newHolidays.length, newHolidays.map(h => h.title))
  }, { deep: true })
  
  // Calendar metadata
  const calendarName = ref<string>('Calendar')
  const calendarColor = ref<string>('primary')
  
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
    const callId = Math.random().toString(36).substring(7)
    console.log('📅 LOAD START:', callId, 'forceRefresh:', forceRefresh)
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      console.log('📅 Using cached calendar data')
      events.value = [...cache.value.data]
      console.log('📅 CACHE: Events loaded from cache:', events.value.length)
      const holidays = events.value.filter(e => e.type === 'public_holiday' || e.type === 'school_holiday')
      console.log('📅 CACHE: Holidays in cached data:', holidays.length, holidays.map(h => h.title))
      buildCache()
      return
    }

    if (isLoading.value) {
      console.log('📅 LOAD: Already loading, skipping...')
      return
    }

    isLoading.value = true
    error.value = null
    
    try {
      console.log('📅 LOAD API:', callId, 'Fetching all calendar data from /calendar endpoint')
      
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
        
        // Debug: Check all calendars for holidays
        calendarData.forEach((cal: any, index: number) => {
          console.log(`📅 CALENDAR ${index}:`, cal.name || cal.title, 'entries:', cal.calendar_entries?.length || 0)
          const calHolidays = (cal.calendar_entries || []).filter((e: any) => e.type === 'public_holiday' || e.type === 'school_holiday')
          console.log(`📅 CALENDAR ${index} HOLIDAYS:`, calHolidays.length, calHolidays.map((h: any) => `${h.title} (${h.type})`))
        })
        
        // Update cache
        cache.value = {
          lastFetch: new Date(),
          data: [...calendarData],
          isValid: true
        }
        
        const calendar = calendarData[0]
        console.log('📅 SELECTED CALENDAR:', calendar.name || calendar.title, 'ID:', calendar.id)
        
        // Update calendar metadata
        calendarName.value = calendar.name || calendar.title || 'Calendar'
        calendarColor.value = calendar.color || 'primary'
        
        // Update reactive state
        events.value = calendar.calendar_entries || []
        
        console.log('📅 LOADED: Raw events from API:', events.value.length)
        const loadedHolidays = events.value.filter((e: any) => e.type === 'public_holiday' || e.type === 'school_holiday')
        console.log('📅 LOADED: Holidays in API data:', loadedHolidays.length, loadedHolidays.map((h: any) => `${h.title} (${h.type})`))
        
        // Debug: Sample some events to see their types
        console.log('📅 SAMPLE EVENT TYPES:', events.value.slice(0, 10).map((e: any) => `${e.title?.substring(0, 20)}... -> ${e.type}`))
        
        // For now, we'll treat all data as events. Later we can separate series if needed
        series.value = calendar.calendar_series || []
        
        console.log('📅 Calendar metadata:', { name: calendarName.value, color: calendarColor.value })
        
        console.log(calendar.calendar_series)
        console.log(calendar.calendar_entries)
        console.log('📅 LOAD SUCCESS:', callId, 'Calendar data cached and loaded successfully')
      } else {
        console.warn('📅 LOAD FAIL:', callId, 'No calendar data loaded:', response.error)
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
    
    console.log('📅 CACHE BUILD: Building cache for', events.value.length, 'events')
    const cacheHolidays = events.value.filter(e => e.type === 'public_holiday' || e.type === 'school_holiday')
    console.log('📅 CACHE BUILD: Holidays being cached:', cacheHolidays.length, cacheHolidays.map(h => h.title))
    
    // Cache events by month for quick access
    events.value.forEach(event => {
      const monthKey = (event.date_from || '').substring(0, 7) // YYYY-MM
      if (!eventCache.has(monthKey)) {
        eventCache.set(monthKey, [])
      }
      eventCache.get(monthKey)!.push(event)
    })
    
    console.log('📅 CACHE BUILD: Cache built for', eventCache.size, 'months')
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
    // Extract date part from ISO string (e.g., "2025-11-01T00:00:00Z" -> "2025-11-01")
    const date = eventDateFrom ? eventDateFrom.split('T')[0] : new Date().toISOString().split('T')[0]
    
    // Extract time from datetime strings (expecting YYYY-MM-DDTHH:mm format or just HH:mm)
    const timeFromMatch = eventTimeFrom.match(/T(\d{2}):(\d{2})/)
    const timeToMatch = eventTimeTo.match(/T(\d{2}):(\d{2})/)
    
    const startTime = timeFromMatch ? `${timeFromMatch[1]}:${timeFromMatch[2]}` : eventTimeFrom
    const endTime = timeToMatch ? `${timeToMatch[1]}:${timeToMatch[2]}` : eventTimeTo
    
    // Extract client name from title (assumes format: "Client Name, Meeting Type")
    const clientName = eventTitle.split(',')[0]?.trim()
    
    // First try to map by event type, then fallback to calendar color
    const classificationMap: Record<string, Meeting['classification']> = {
      'appointment': 'primary',
      'meeting': 'secondary', 
      'call': 'accent',
      'personal': 'info',
      'holiday': 'success',
      'public_holiday': 'error', // Red for public holidays
      'school_holiday': 'school_holiday',
      'urgent': 'warning',
      'cancelled': 'error'
    }
    
    let meetingClassification: Meeting['classification'] = 'primary'
    
    // If event type has a specific mapping, use it
    if (eventType && classificationMap[eventType]) {
      meetingClassification = classificationMap[eventType]
    } else {
      // Otherwise use calendar color if it's valid
      const validColors: Meeting['classification'][] = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error', 'school_holiday']
      const calendarColorValue = calendarColor.value as Meeting['classification']
      if (validColors.includes(calendarColorValue)) {
        meetingClassification = calendarColorValue
      }
    }

    // Handle end date for multi-day events
    const eventDateTo = event.date_to || eventDateFrom
    const endDate = eventDateTo ? eventDateTo.split('T')[0] : date
    const isMultiDay = event.is_all_day && eventDateFrom !== eventDateTo
    
    const result = {
      id: eventId,
      title: eventTitle,
      date,
      endDate,
      startTime,
      endTime,
      classification: meetingClassification,
      type: eventType, // Original backend type for holidays and other identification
      description: event.description,
      attendees: [], // TODO: Map participants if available
      isAllDay: event.is_all_day || false, // Pass through all-day flag from backend
      isMultiDay
    }
    
    // Debug logging for all events
    console.log('🔄 Event converted:', { 
      title: eventTitle, 
      type: eventType, 
      classification: meetingClassification,
      calendarColor: calendarColor.value,
      hasTypeMapping: !!(eventType && classificationMap[eventType])
    })
    
    // Specific debug for Allerheiligen
    if (eventTitle === 'Allerheiligen') {
      console.log('🎄 Allerheiligen detailed conversion:', {
        title: eventTitle,
        type: eventType,
        classification: meetingClassification,
        isAllDay: event.is_all_day,
        dateFrom: event.date_from,
        dateTo: event.date_to,
        startTime,
        endTime
      })
    }
    
    // Debug logging for school holidays
    if (eventType === 'school_holiday' || meetingClassification === 'school_holiday') {
      console.log('🏫 School holiday converted:', { 
        title: eventTitle, 
        type: eventType, 
        classification: meetingClassification,
        calendarColor: calendarColor.value 
      })
    }
    
    return result
  }

  // Expand multi-day events into individual day entries
  const expandMultiDayEvent = (meeting: Meeting): Meeting[] => {
    if (!meeting.isMultiDay || !meeting.date || !meeting.endDate) {
      return [meeting]
    }
    
    const startDate = new Date(meeting.date)
    const endDate = new Date(meeting.endDate)
    const events: Meeting[] = []
    
    // Create an event for each day in the range
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      events.push({
        ...meeting,
        id: `${meeting.id}-${dateStr}`, // Unique ID for each day
        date: dateStr,
        // Keep original endDate for reference
        endDate: meeting.endDate
      })
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return events
  }

  // Convert and expand all events (including multi-day expansion)
  const convertAndExpandEvents = (apiEvents: CalendarEvent[]): Meeting[] => {
    const allMeetings: Meeting[] = []
    
    for (const event of apiEvents) {
      const meeting = convertApiEventToMeeting(event)
      const expandedMeetings = expandMultiDayEvent(meeting)
      allMeetings.push(...expandedMeetings)
    }
    
    return allMeetings
  }

  // Current week events (reactive)
  const currentWeekEvents = computed(() => {
    return getWeekEvents(currentDate.value)
  })

  // Current day events (reactive) 
  const currentDayEvents = computed(() => {
    console.log('📅 currentDayEvents computed called for:', currentDate.value.toISOString().split('T')[0])
    const dayEvents = getDayEvents(currentDate.value)
    console.log('📅 currentDayEvents returning:', dayEvents.length, 'meetings')
    return dayEvents
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
    
    // Get all events that overlap with this week
    const weekEvents = events.value.filter(event => {
      const dateFrom = event.date_from || ''
      const dateTo = event.date_to || dateFrom
      if (!dateFrom) return false
      
      const eventStart = new Date(dateFrom)
      const eventEnd = new Date(dateTo)
      
      // Check if event overlaps with week range
      return eventStart <= weekEnd && eventEnd >= weekStart
    })
    
    console.log('📅 Found', weekEvents.length, 'events for week (before expansion)')
    
    // Convert and expand multi-day events, then filter for this week
    const allExpandedMeetings = convertAndExpandEvents(weekEvents)
    const weekMeetings = allExpandedMeetings.filter(meeting => {
      if (!meeting.date) return false
      const meetingDate = new Date(meeting.date)
      return meetingDate >= weekStart && meetingDate <= weekEnd
    })
    
    console.log('📅 Expanded to', weekMeetings.length, 'meeting instances for week')
    return weekMeetings
  }

  const getDayEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    const dayStr = targetDate.toISOString().split('T')[0]
    
    console.log('📅 getDayEvents called for:', dayStr)
    console.log('📅 Total events in cache:', events.value.length)
    
    // Debug: Check if Allerheiligen is in the events
    const allerheilligenEvent = events.value.find(e => e.title === 'Allerheiligen')
    if (allerheilligenEvent) {
      console.log('📅 Found Allerheiligen in cache:', {
        title: allerheilligenEvent.title,
        date_from: allerheilligenEvent.date_from,
        date_to: allerheilligenEvent.date_to,
        is_all_day: allerheilligenEvent.is_all_day
      })
    } else {
      console.log('📅 Allerheiligen NOT found in cache')
    }
    
    // Get all events that include this day (either single day or multi-day)
    const dayEvents = events.value.filter(event => {
      const dateFrom = event.date_from || ''
      const dateTo = event.date_to || dateFrom
      if (!dateFrom || !dayStr || !dateTo) return false
      
      // Check if this day falls within the event's date range
      const eventFromDate = dateFrom.split('T')[0]
      const eventToDate = dateTo.split('T')[0]
      const isInRange = eventFromDate && eventToDate && dayStr >= eventFromDate && dayStr <= eventToDate
      
      // Debug logging for events
      if (event.title && event.title.includes('Allerheiligen')) {
        console.log('📅 Checking Allerheiligen event:', {
          title: event.title,
          dateFrom: eventFromDate,
          dateTo: eventToDate,
          targetDay: dayStr,
          isInRange
        })
      }
      
      return isInRange
    })
    
    console.log('📅 Found', dayEvents.length, 'raw events for day before conversion')

    // Convert and expand, then filter for this specific day
    const allExpandedMeetings = convertAndExpandEvents(dayEvents)
    const finalMeetings = allExpandedMeetings.filter(meeting => meeting.date === dayStr)
    
    // Debug logging for day events
    console.log('📅 Day events for', dayStr, ':', finalMeetings.length, 'meetings')
    console.log('📅 All expanded meetings:', allExpandedMeetings.length, 'before day filter')
    
    allExpandedMeetings.forEach(meeting => {
      if (meeting.title && meeting.title.includes('Allerheiligen')) {
        console.log('📅 Allerheiligen expanded meeting:', {
          title: meeting.title,
          date: meeting.date,
          targetDay: dayStr,
          matches: meeting.date === dayStr
        })
      }
    })
    
    finalMeetings.forEach(meeting => {
      console.log('📅 Final day meeting:', { 
        title: meeting.title, 
        type: meeting.type, 
        classification: meeting.classification,
        date: meeting.date
      })
    })
    
    return finalMeetings
  }

  const getMonthEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    
    // Calculate start of month minus one week
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    const startDate = new Date(startOfMonth)
    startDate.setDate(startDate.getDate() - 7) // One week before
    
    // Calculate end of month plus one week
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
    const endDate = new Date(endOfMonth)
    endDate.setDate(endDate.getDate() + 7) // One week after
    
    // Get all events that overlap with the extended month range
    const allEvents = events.value.filter(event => {
      const dateFrom = event.date_from || ''
      const dateTo = event.date_to || dateFrom
      if (!dateFrom) return false
      
      const eventStart = new Date(dateFrom)
      const eventEnd = new Date(dateTo)
      
      // Check if event overlaps with extended month range
      return eventStart <= endDate && eventEnd >= startDate
    })
    
    // Convert and expand multi-day events, then filter for month range
    const allExpandedMeetings = convertAndExpandEvents(allEvents)
    return allExpandedMeetings.filter(meeting => {
      if (!meeting.date) return false
      const meetingDate = new Date(meeting.date)
      return meetingDate >= startDate && meetingDate <= endDate
    })
  }

  const getYearEvents = (date?: Date): Meeting[] => {
    const targetDate = date || currentDate.value
    
    // Calculate start of year minus one week
    const startOfYear = new Date(targetDate.getFullYear(), 0, 1)
    const startDate = new Date(startOfYear)
    startDate.setDate(startDate.getDate() - 7) // One week before
    
    // Calculate end of year plus one week
    const endOfYear = new Date(targetDate.getFullYear(), 11, 31)
    const endDate = new Date(endOfYear)
    endDate.setDate(endDate.getDate() + 7) // One week after
    
    // Get all events that overlap with the extended year range
    const yearEvents = events.value.filter(event => {
      const dateFrom = event.date_from || ''
      const dateTo = event.date_to || dateFrom
      if (!dateFrom) return false
      
      const eventStart = new Date(dateFrom)
      const eventEnd = new Date(dateTo)
      
      // Check if event overlaps with extended year range
      return eventStart <= endDate && eventEnd >= startDate
    })
    
    // Convert and expand multi-day events, then filter for year range
    const allExpandedMeetings = convertAndExpandEvents(yearEvents)
    return allExpandedMeetings.filter(meeting => {
      if (!meeting.date) return false
      const meetingDate = new Date(meeting.date)
      return meetingDate >= startDate && meetingDate <= endDate
    })
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

  // Utility functions for working with backend types
  const isHoliday = (meeting: Meeting): boolean => {
    return meeting.type === 'holiday'
  }
  
  const getType = (meeting: Meeting): string => {
    return meeting.type || 'appointment'
  }
  
  const filterByType = (meetings: Meeting[], type: string): Meeting[] => {
    return meetings.filter(meeting => meeting.type === type)
  }

  return {
    // State
    events: computed(() => events.value),
    series: computed(() => series.value),
    currentDate: computed(() => currentDate.value),
    currentWeekEvents,
    currentDayEvents,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Calendar metadata
    calendarName: computed(() => calendarName.value),
    calendarColor: computed(() => calendarColor.value),
    
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
    isHoliday,
    getType,
    filterByType,
    
    // Cache management
    refreshCache: () => loadAllCalendarData(true),
    getCacheStatus: () => ({
      isValid: isCacheValid(),
      lastFetch: cache.value.lastFetch,
      itemCount: cache.value.data.length
    })
  }
}