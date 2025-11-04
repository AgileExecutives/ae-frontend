import { getApiClient } from '@/config/api-config'
import { useCalendarStore } from '@/stores/calendarStore'
import { useDateTimeUtc } from '@/composables/useDateTimeUtc'
import type { CalendarEvent, Meeting } from '@/types/calendar'

export function useCalendarApi() {
  const apiClient = getApiClient()
  const { setEvents, setSeries, setIsLoading, setError, setCalendarInfo } = useCalendarStore()
  const dateTimeUtc = useDateTimeUtc()

  // Convert Meeting to CalendarEvent for API
  const convertMeetingToApiEvent = (meeting: Meeting, calendarId: number): Partial<CalendarEvent> => {
    // Convert local date/time to UTC ISO strings for API
    // Backend expects: date_from/date_to = full UTC ISO string "2006-01-02T15:04:05Z07:00"
    // time_from/time_to = full UTC ISO string "2006-01-02T15:04:05Z07:00"
    
    const startUtcIso = dateTimeUtc.createUtcFromLocal({
      date: meeting.date || '',
      time: meeting.startTime
    })
    
    const endUtcIso = dateTimeUtc.createUtcFromLocal({
      date: meeting.endDate || meeting.date || '',
      time: meeting.endTime
    })

    return {
      id: meeting.id ? Number(meeting.id) : undefined,
      calendar_id: calendarId,
      title: meeting.title,
      date_from: startUtcIso,
      date_to: endUtcIso,
      time_from: startUtcIso,
      time_to: endUtcIso,
      type: meeting.type || 'appointment',
      description: meeting.description || '',
      is_all_day: meeting.isAllDay || false,
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
        setCalendarInfo(calendar.name || 'Calendar', calendar.color || 'primary')
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

  async function createCalendarEntry(meeting: Meeting, calendarId: number) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.createCalendarEntry !== 'function') {
        throw new Error('Create calendar entry API not available')
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

  async function updateCalendarEntry(meeting: Meeting, calendarId: number) {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof apiClient.updateCalendarEntry !== 'function') {
        throw new Error('Update calendar entry API not available')
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

  return {
    fetchCalendarData,
    createCalendarEntry,
    updateCalendarEntry,
    deleteCalendarEntry,
  }
}
