import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarApi } from '../useCalendarApi'
import { useCalendarStore } from '@/stores/calendarStore'
import type { Meeting, CalendarEvent } from '@/types/calendar'

// Mock the API client
const mockGetCalendars = vi.fn()
const mockCreateCalendarEntry = vi.fn()
const mockUpdateCalendarEntry = vi.fn()
const mockDeleteCalendarEntry = vi.fn()

vi.mock('@/config/api-config', () => ({
  getApiClient: () => ({
    getCalendars: mockGetCalendars,
    createCalendarEntry: mockCreateCalendarEntry,
    updateCalendarEntry: mockUpdateCalendarEntry,
    deleteCalendarEntry: mockDeleteCalendarEntry,
  }),
}))

// Mock the date time UTC composable
vi.mock('../useDateTimeUtc', () => ({
  useDateTimeUtc: () => ({
    createUtcFromLocal: vi.fn(({ date, time }) => {
      return `${date}T${time}:00Z`
    }),
    convertUtcToLocal: vi.fn((utcString) => {
      const [date, time] = utcString.split('T')
      return { date, time: time?.split(':').slice(0, 2).join(':') || '00:00' }
    }),
  }),
}))

describe('useCalendarApi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchCalendarData', () => {
    it('should fetch calendar data successfully', async () => {
      const mockCalendarData = [
        {
          id: 1,
          name: 'Work Calendar',
          color: 'primary',
          calendar_entries: [
            {
              id: 1,
              calendar_id: 1,
              title: 'Meeting',
              date_from: '2025-11-04T09:00:00Z',
              date_to: '2025-11-04T10:00:00Z',
              time_from: '2025-11-04T09:00:00Z',
              time_to: '2025-11-04T10:00:00Z',
              type: 'meeting',
              is_all_day: false,
            },
          ],
          calendar_series: [],
        },
      ]

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: mockCalendarData,
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.fetchCalendarData()
      const store = useCalendarStore()

      expect(result?.success).toBe(true)
      expect(mockGetCalendars).toHaveBeenCalled()
      expect(store.events).toEqual(mockCalendarData[0]?.calendar_entries)
      expect(store.series).toEqual(mockCalendarData[0]?.calendar_series)
      expect(store.calendarName).toBe('Work Calendar')
      expect(store.calendarColor).toBe('primary')
      expect(store.isLoading).toBe(false)
    })

    it('should handle API error', async () => {
      mockGetCalendars.mockResolvedValue({
        success: false,
        error: 'Network error',
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.fetchCalendarData()
      const store = useCalendarStore()

      expect(result?.success).toBe(false)
      expect(result?.error).toBe('Network error')
      expect(store.error).toBe('Network error')
      expect(store.events).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('should handle exception', async () => {
      mockGetCalendars.mockRejectedValue(new Error('Server error'))

      const calendarApi = useCalendarApi()
      const result = await calendarApi.fetchCalendarData()
      const store = useCalendarStore()

      expect(result?.success).toBe(false)
      expect(result?.error).toBe('Server error')
      expect(store.error).toBe('Server error')
      expect(store.events).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state during fetch', async () => {
      mockGetCalendars.mockImplementation(() => {
        const store = useCalendarStore()
        expect(store.isLoading).toBe(true)
        return Promise.resolve({ success: true, data: [] })
      })

      const calendarApi = useCalendarApi()
      await calendarApi.fetchCalendarData()
    })
  })

  describe('createCalendarEntry', () => {
    it('should create calendar entry successfully', async () => {
      const meeting: Meeting = {
        id: '',
        title: 'New Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '09:00',
        endTime: '10:00',
        type: 'meeting',
        classification: 'primary',
        isAllDay: false,
      }

      const mockCreatedEvent: CalendarEvent = {
        id: 1,
        calendar_id: 1,
        title: 'New Meeting',
        date_from: '2025-11-04T09:00:00Z',
        date_to: '2025-11-04T10:00:00Z',
        time_from: '2025-11-04T09:00:00Z',
        time_to: '2025-11-04T10:00:00Z',
        type: 'meeting',
        is_all_day: false,
      }

      mockCreateCalendarEntry.mockResolvedValue({
        success: true,
        data: mockCreatedEvent,
      })

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: [
          {
            id: 1,
            name: 'Calendar',
            color: 'primary',
            calendar_entries: [mockCreatedEvent],
            calendar_series: [],
          },
        ],
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.createCalendarEntry(meeting, 1)

      expect(result.success).toBe(true)
      expect(mockCreateCalendarEntry).toHaveBeenCalled()
      expect(mockGetCalendars).toHaveBeenCalled() // Should refresh after create
    })

    it('should handle create error', async () => {
      const meeting: Meeting = {
        id: '',
        title: 'New Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '09:00',
        endTime: '10:00',
        type: 'meeting',
        classification: 'primary',
      }

      mockCreateCalendarEntry.mockResolvedValue({
        success: false,
        error: 'Validation error',
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.createCalendarEntry(meeting, 1)
      const store = useCalendarStore()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation error')
      expect(store.error).toBe('Validation error')
    })

    it('should convert all-day events correctly', async () => {
      const meeting: Meeting = {
        id: '',
        title: 'All Day Event',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '00:00',
        endTime: '23:59',
        type: 'appointment',
        classification: 'primary',
        isAllDay: true,
      }

      mockCreateCalendarEntry.mockResolvedValue({
        success: true,
        data: {},
      })

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Calendar', color: 'primary', calendar_entries: [], calendar_series: [] }],
      })

      const calendarApi = useCalendarApi()
      await calendarApi.createCalendarEntry(meeting, 1)

      expect(mockCreateCalendarEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          is_all_day: true,
          title: 'All Day Event',
        })
      )
    })
  })

  describe('updateCalendarEntry', () => {
    it('should update calendar entry successfully', async () => {
      const meeting: Meeting = {
        id: '1',
        title: 'Updated Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '10:00',
        endTime: '11:00',
        type: 'meeting',
        classification: 'primary',
      }

      mockUpdateCalendarEntry.mockResolvedValue({
        success: true,
        data: {},
      })

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Calendar', color: 'primary', calendar_entries: [], calendar_series: [] }],
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.updateCalendarEntry(meeting, 1)

      expect(result.success).toBe(true)
      expect(mockUpdateCalendarEntry).toHaveBeenCalledWith(1, expect.any(Object))
      expect(mockGetCalendars).toHaveBeenCalled() // Should refresh after update
    })

    it('should handle invalid event ID', async () => {
      const meeting: Meeting = {
        id: 'invalid',
        title: 'Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '09:00',
        endTime: '10:00',
        type: 'meeting',
        classification: 'primary',
      }

      const calendarApi = useCalendarApi()
      const result = await calendarApi.updateCalendarEntry(meeting, 1)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid event ID')
    })

    it('should handle update error', async () => {
      const meeting: Meeting = {
        id: '1',
        title: 'Updated Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '10:00',
        endTime: '11:00',
        type: 'meeting',
        classification: 'primary',
      }

      mockUpdateCalendarEntry.mockResolvedValue({
        success: false,
        message: 'Update failed',
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.updateCalendarEntry(meeting, 1)
      const store = useCalendarStore()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
      expect(store.error).toBe('Update failed')
    })
  })

  describe('deleteCalendarEntry', () => {
    it('should delete calendar entry successfully', async () => {
      mockDeleteCalendarEntry.mockResolvedValue({
        success: true,
      })

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Calendar', color: 'primary', calendar_entries: [], calendar_series: [] }],
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.deleteCalendarEntry('1')

      expect(result.success).toBe(true)
      expect(mockDeleteCalendarEntry).toHaveBeenCalledWith(1)
      expect(mockGetCalendars).toHaveBeenCalled() // Should refresh after delete
    })

    it('should handle invalid event ID', async () => {
      const calendarApi = useCalendarApi()
      const result = await calendarApi.deleteCalendarEntry('invalid')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid event ID')
    })

    it('should handle delete error', async () => {
      mockDeleteCalendarEntry.mockResolvedValue({
        success: false,
      })

      const calendarApi = useCalendarApi()
      const result = await calendarApi.deleteCalendarEntry('1')
      const store = useCalendarStore()

      expect(result.success).toBe(false)
      expect(store.error).toBe('Failed to delete calendar entry')
    })
  })

  describe('date/time conversion', () => {
    it('should convert meeting dates to UTC format', async () => {
      const meeting: Meeting = {
        id: '',
        title: 'Test Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '14:30',
        endTime: '15:45',
        type: 'meeting',
        classification: 'primary',
      }

      mockCreateCalendarEntry.mockResolvedValue({
        success: true,
        data: {},
      })

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Calendar', color: 'primary', calendar_entries: [], calendar_series: [] }],
      })

      const calendarApi = useCalendarApi()
      await calendarApi.createCalendarEntry(meeting, 1)

      // Verify that the conversion function was called
      expect(mockCreateCalendarEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date_from: expect.stringContaining('2025-11-04'),
          date_to: expect.stringContaining('2025-11-04'),
        })
      )
    })

    it('should handle multi-day events', async () => {
      const meeting: Meeting = {
        id: '',
        title: 'Conference',
        date: '2025-11-04',
        endDate: '2025-11-06',
        startTime: '09:00',
        endTime: '17:00',
        type: 'meeting',
        classification: 'primary',
        isMultiDay: true,
      }

      mockCreateCalendarEntry.mockResolvedValue({
        success: true,
        data: {},
      })

      mockGetCalendars.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Calendar', color: 'primary', calendar_entries: [], calendar_series: [] }],
      })

      const calendarApi = useCalendarApi()
      await calendarApi.createCalendarEntry(meeting, 1)

      expect(mockCreateCalendarEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date_from: expect.stringContaining('2025-11-04'),
          date_to: expect.stringContaining('2025-11-06'),
        })
      )
    })
  })
})
