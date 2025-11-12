import { getApiClient } from '@/config/api-config'
import { useCalendarStore } from '@/stores/calendarStore'
import { useDateTimeUtc } from '@/composables/useDateTimeUtc'
import type { CalendarEvent, Meeting } from '@/types/calendar'

export function useCalendarApi() {
  const apiClient = getApiClient()
  const store = useCalendarStore()
  const { setEvents, setSeries, setIsLoading, setError, setCalendarInfo } = store
  const dateTimeUtc = useDateTimeUtc()

  // Convert Meeting to CalendarEvent for API
  const convertMeetingToApiEvent = (meeting: Meeting, calendarId: number): Partial<CalendarEvent> => {
    // Convert local date/time to UTC ISO strings for API
    // Backend expects start_time and end_time as full UTC ISO strings with timezone
    
    const startUtcIso = dateTimeUtc.createUtcFromLocal({
      date: meeting.date || '',
      time: meeting.startTime,
      timezone: meeting.timezone
    })
    
    const endUtcIso = dateTimeUtc.createUtcFromLocal({
      date: meeting.endDate || meeting.date || '',
      time: meeting.endTime,
      timezone: meeting.timezone
    })

    // Convert attendees to participants format
    const participants = meeting.attendees?.map(name => ({
      name,
      email: '' // Email not provided in Meeting format
    })) || []

    return {
      id: meeting.id ? Number(meeting.id) : undefined,
      calendar_id: calendarId,
      title: meeting.title,
      start_time: startUtcIso,
      end_time: endUtcIso,
      type: meeting.type || 'appointment',
      description: meeting.description || '',
      location: meeting.location || '',
      timezone: meeting.timezone || dateTimeUtc.timezoneInfo.value.name,
      is_all_day: meeting.isAllDay || false,
      participants,
      is_exception: false,
      tenant_id: 0, // Will be set by backend
      user_id: 0, // Will be set by backend
    }
  }

  async function fetchCalendarData() {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.getCalendars !== 'function') {
        console.warn('📅 Calendar API methods not available yet')
        setEvents([])
        setSeries([])
        setIsLoading(false)
        return
      }
      const response = await apiClient.getCalendars()
      if (response.success && response.data && response.data.length > 0) {
        const calendarData = Array.isArray(response.data) ? response.data : []
        const calendar = calendarData[0]
        setCalendarInfo(calendar.name || 'Calendar', calendar.color || 'primary', calendar.id)
        setEvents(calendar.calendar_entries || [])
        setSeries(calendar.calendar_series || [])
        return { success: true, data: calendarData }
      }
      else {
        const errorMessage = response.error || 'Failed to load calendar data'
        setError(errorMessage)
        setEvents([])
        setSeries([])
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      setEvents([])
      setSeries([])
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  async function getCalendarsList() {
    try {
      if (typeof apiClient.getCalendars !== 'function') {
        console.warn('📅 Calendar API methods not available yet')
        return { success: false, error: 'Calendar API not available', data: [] }
      }
      const response = await apiClient.getCalendars()
      if (response.success && response.data) {
        const calendarData = Array.isArray(response.data) ? response.data : []
        return { success: true, data: calendarData }
      }
      else {
        const errorMessage = response.error || 'Failed to load calendars'
        return { success: false, error: errorMessage, data: [] }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      return { success: false, error: errorMessage, data: [] }
    }
  }

  async function createCalendarEntry(meeting: Meeting) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.createCalendarEntry !== 'function') {
        throw new Error('Create calendar entry API not available')
      }
      
      const calendarId = store.calendarId
      if (!calendarId) {
        throw new Error('Calendar ID not available. Please reload calendar data.')
      }
      
      const eventData = convertMeetingToApiEvent(meeting, calendarId)
      const response = await apiClient.createCalendarEntry(eventData)
      
      if (response.success) {
        // Refresh calendar data to get the new entry
        await fetchCalendarData()
        return { success: true, data: response.data }
      }
      else {
        const errorMessage = response.error || 'Failed to create calendar entry'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  async function updateCalendarEntry(meeting: Meeting) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.updateCalendarEntry !== 'function') {
        throw new Error('Update calendar entry API not available')
      }
      
      const calendarId = store.calendarId
      if (!calendarId) {
        throw new Error('Calendar ID not available. Please reload calendar data.')
      }
      
      const eventId = Number(meeting.id)
      if (isNaN(eventId)) {
        throw new Error('Invalid event ID')
      }

      const eventData = convertMeetingToApiEvent(meeting, calendarId)
      const response = await apiClient.updateCalendarEntry(eventId, eventData)
      
      if (response.success) {
        // Refresh calendar data to get the updated entry
        await fetchCalendarData()
        return { success: true, data: response.data }
      }
      else {
        const errorMessage = response.message || 'Failed to update calendar entry'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  async function deleteCalendarEntry(eventId: string) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.deleteCalendarEntry !== 'function') {
        throw new Error('Delete calendar entry API not available')
      }
      
      const numericId = Number(eventId)
      if (isNaN(numericId)) {
        throw new Error('Invalid event ID')
      }

      const response = await apiClient.deleteCalendarEntry(numericId)
      
      if (response.success) {
        // Refresh calendar data to remove the deleted entry
        await fetchCalendarData()
        return { success: true }
      }
      else {
        const errorMessage = 'Failed to delete calendar entry'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  async function createCalendarSeries(seriesData: any) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.createCalendarSeries !== 'function') {
        throw new Error('Create calendar series API not available')
      }
      
      const calendarId = store.calendarId
      if (!calendarId) {
        throw new Error('Calendar ID not available. Please reload calendar data.')
      }
      
      const response = await apiClient.createCalendarSeries({
        ...seriesData,
        calendar_id: calendarId
      })
      
      if (response.success) {
        // Refresh calendar data to get the new series
        await fetchCalendarData()
        return { success: true, data: response.data }
      }
      else {
        const errorMessage = response.error || 'Failed to create calendar series'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  async function updateCalendarSeries(seriesId: number, seriesData: any) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.updateCalendarSeries !== 'function') {
        throw new Error('Update calendar series API not available')
      }
      
      const calendarId = store.calendarId
      if (!calendarId) {
        throw new Error('Calendar ID not available. Please reload calendar data.')
      }
      
      const response = await apiClient.updateCalendarSeries(seriesId, {
        ...seriesData,
        calendar_id: calendarId
      })
      
      if (response.success) {
        // Refresh calendar data to get the updated series
        await fetchCalendarData()
        return { success: true, data: response.data }
      }
      else {
        const errorMessage = response.message || 'Failed to update calendar series'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  async function deleteCalendarSeries(seriesId: number) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.deleteCalendarSeries !== 'function') {
        throw new Error('Delete calendar series API not available')
      }
      
      const response = await apiClient.deleteCalendarSeries(seriesId)
      
      if (response.success) {
        // Refresh calendar data to remove the deleted series
        await fetchCalendarData()
        return { success: true }
      }
      else {
        const errorMessage = 'Failed to delete calendar series'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
    finally {
      setIsLoading(false)
    }
  }

  return {
    fetchCalendarData,
    getCalendarsList,
    createCalendarEntry,
    updateCalendarEntry,
    deleteCalendarEntry,
    createCalendarSeries,
    updateCalendarSeries,
    deleteCalendarSeries,
  }
}
