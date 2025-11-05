import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from '../calendarStore'
import type { CalendarEvent, CalendarSeries } from '@/types/calendar'

describe('calendarStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should initialize with empty events', () => {
      const store = useCalendarStore()
      expect(store.events).toEqual([])
      expect(store.getEvents).toEqual([])
    })

    it('should initialize with empty series', () => {
      const store = useCalendarStore()
      expect(store.series).toEqual([])
      expect(store.getSeries).toEqual([])
    })

    it('should initialize with current date', () => {
      const store = useCalendarStore()
      const now = new Date()
      const storeDateStr = store.currentDate.toISOString().split('T')[0]
      const nowStr = now.toISOString().split('T')[0]
      expect(storeDateStr).toBe(nowStr)
    })

    it('should initialize with loading false', () => {
      const store = useCalendarStore()
      expect(store.isLoading).toBe(false)
      expect(store.getIsLoading).toBe(false)
    })

    it('should initialize with no error', () => {
      const store = useCalendarStore()
      expect(store.error).toBeNull()
      expect(store.getError).toBeNull()
    })

    it('should initialize with default calendar info', () => {
      const store = useCalendarStore()
      expect(store.calendarName).toBe('Calendar')
      expect(store.calendarColor).toBe('primary')
    })
  })

  describe('setEvents', () => {
    it('should set events', () => {
      const store = useCalendarStore()
      const mockEvents: CalendarEvent[] = [
        {
          id: 1,
          tenant_id: 1,
          user_id: 1,
          calendar_id: 1,
          title: 'Test Event',
          start_time: '2025-11-04T09:00:00+01:00',
          end_time: '2025-11-04T10:00:00+01:00',
          type: 'appointment',
          description: 'Test description',
          is_all_day: false,
          is_exception: false,
          participants: [],
          timezone: 'Europe/Berlin',
          created_at: '2025-11-04T08:00:00+01:00',
          updated_at: '2025-11-04T08:00:00+01:00',
        },
      ]

      store.setEvents(mockEvents)
      expect(store.events).toEqual(mockEvents)
      expect(store.getEvents).toEqual(mockEvents)
    })

    it('should replace existing events', () => {
      const store = useCalendarStore()
      const firstEvents: CalendarEvent[] = [
        { id: 1, tenant_id: 1, user_id: 1, calendar_id: 1, title: 'First', start_time: '2025-11-04T09:00:00+01:00', end_time: '2025-11-04T10:00:00+01:00', type: 'appointment', is_all_day: false, is_exception: false, participants: [], timezone: 'Europe/Berlin', created_at: '', updated_at: '' },
      ]
      const secondEvents: CalendarEvent[] = [
        { id: 2, tenant_id: 1, user_id: 1, calendar_id: 1, title: 'Second', start_time: '2025-11-05T14:00:00+01:00', end_time: '2025-11-05T15:00:00+01:00', type: 'meeting', is_all_day: false, is_exception: false, participants: [], timezone: 'Europe/Berlin', created_at: '', updated_at: '' },
      ]

      store.setEvents(firstEvents)
      expect(store.events).toEqual(firstEvents)
      
      store.setEvents(secondEvents)
      expect(store.events).toEqual(secondEvents)
    })
  })

  describe('setSeries', () => {
    it('should set series', () => {
      const store = useCalendarStore()
      const mockSeries: CalendarSeries[] = [
        {
          id: 1,
          tenant_id: 1,
          user_id: 1,
          calendar_id: 1,
          title: 'Weekly Meeting',
          participants: [],
          weekday: 1,
          interval: 1,
          start_time: '2025-11-04T09:00:00+01:00',
          end_time: '2025-11-04T10:00:00+01:00',
          timezone: 'Europe/Berlin',
          entry_uuid: 'test-uuid',
          sequence: 0,
          created_at: '2025-11-04T08:00:00+01:00',
          updated_at: '2025-11-04T08:00:00+01:00',
        },
      ]

      store.setSeries(mockSeries)
      expect(store.series).toEqual(mockSeries)
      expect(store.getSeries).toEqual(mockSeries)
    })
  })

  describe('setCurrentDate', () => {
    it('should set current date', () => {
      const store = useCalendarStore()
      const newDate = new Date('2025-12-25')
      
      store.setCurrentDate(newDate)
      expect(store.currentDate).toEqual(newDate)
      expect(store.getCurrentDate).toEqual(newDate)
    })
  })

  describe('setIsLoading', () => {
    it('should set loading to true', () => {
      const store = useCalendarStore()
      
      store.setIsLoading(true)
      expect(store.isLoading).toBe(true)
      expect(store.getIsLoading).toBe(true)
    })

    it('should set loading to false', () => {
      const store = useCalendarStore()
      store.setIsLoading(true)
      
      store.setIsLoading(false)
      expect(store.isLoading).toBe(false)
      expect(store.getIsLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const store = useCalendarStore()
      const errorMsg = 'Failed to load calendar'
      
      store.setError(errorMsg)
      expect(store.error).toBe(errorMsg)
      expect(store.getError).toBe(errorMsg)
    })

    it('should clear error by setting null', () => {
      const store = useCalendarStore()
      store.setError('Some error')
      
      store.setError(null)
      expect(store.error).toBeNull()
      expect(store.getError).toBeNull()
    })
  })

  describe('setCalendarInfo', () => {
    it('should set calendar name and color', () => {
      const store = useCalendarStore()
      
      store.setCalendarInfo('Work Calendar', 'success')
      expect(store.calendarName).toBe('Work Calendar')
      expect(store.calendarColor).toBe('success')
      expect(store.getCalendarName).toBe('Work Calendar')
      expect(store.getCalendarColor).toBe('success')
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useCalendarStore()
      const now = new Date()
      
      // Modify all state
      store.setEvents([
        { id: 1, tenant_id: 1, user_id: 1, calendar_id: 1, title: 'Test', start_time: '2025-11-04T09:00:00+01:00', end_time: '2025-11-04T10:00:00+01:00', type: 'appointment', is_all_day: false, is_exception: false, participants: [], timezone: 'Europe/Berlin', created_at: '', updated_at: '' },
      ])
      store.setSeries([
        { id: 1, tenant_id: 1, user_id: 1, calendar_id: 1, title: 'Series', participants: [], weekday: 1, interval: 1, start_time: '2025-11-04T09:00:00+01:00', end_time: '2025-11-04T10:00:00+01:00', timezone: 'Europe/Berlin', entry_uuid: 'test', sequence: 0, created_at: '', updated_at: '' },
      ])
      store.setCurrentDate(new Date('2025-12-25'))
      store.setIsLoading(true)
      store.setError('Some error')
      store.setCalendarInfo('Work', 'success')
      
      // Reset
      store.reset()
      
      // Verify reset
      expect(store.events).toEqual([])
      expect(store.series).toEqual([])
      expect(store.currentDate.toISOString().split('T')[0]).toBe(now.toISOString().split('T')[0])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.calendarName).toBe('Calendar')
      expect(store.calendarColor).toBe('primary')
    })
  })

  describe('computed getters', () => {
    it('should reactively update getters when state changes', () => {
      const store = useCalendarStore()
      
      expect(store.getIsLoading).toBe(false)
      store.setIsLoading(true)
      expect(store.getIsLoading).toBe(true)
      
      expect(store.getError).toBeNull()
      store.setError('Test error')
      expect(store.getError).toBe('Test error')
    })
  })
})
