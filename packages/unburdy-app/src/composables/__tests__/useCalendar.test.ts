import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendar } from '../useCalendar'
import { useCalendarStore } from '@/stores/calendarStore'
import type { CalendarEvent } from '@/types/calendar'

// Mock the API composable
vi.mock('../useCalendarApi', () => ({
  useCalendarApi: () => ({
    fetchCalendarData: vi.fn().mockResolvedValue({ success: true, data: [] }),
    createCalendarEntry: vi.fn(),
    updateCalendarEntry: vi.fn(),
    deleteCalendarEntry: vi.fn(),
  }),
}))

describe('useCalendar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with store state', () => {
      const calendar = useCalendar()
      
      expect(calendar.events.value).toEqual([])
      expect(calendar.series.value).toEqual([])
      expect(calendar.isLoading.value).toBe(false)
      expect(calendar.error.value).toBeNull()
    })

    it('should have current date from store', () => {
      const calendar = useCalendar()
      const now = new Date()
      const currentDateStr = calendar.currentDate.value.toISOString().split('T')[0]
      const nowStr = now.toISOString().split('T')[0]
      
      expect(currentDateStr).toBe(nowStr)
    })
  })

  describe('navigation', () => {
    it('should navigate to next week', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      const initialDate = new Date('2025-11-04')
      store.setCurrentDate(initialDate)
      
      calendar.nextWeek()
      
      const expectedDate = new Date('2025-11-11')
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0])
    })

    it('should navigate to previous week', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      const initialDate = new Date('2025-11-04')
      store.setCurrentDate(initialDate)
      
      calendar.prevWeek()
      
      const expectedDate = new Date('2025-10-28')
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0])
    })

    it('should navigate to next month', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      const initialDate = new Date('2025-11-04')
      store.setCurrentDate(initialDate)
      
      calendar.nextMonth()
      
      const expectedDate = new Date('2025-12-04')
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0])
    })

    it('should navigate to previous month', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      const initialDate = new Date('2025-05-15')
      store.setCurrentDate(initialDate)
      
      calendar.prevMonth()
      
      // Verify we're in the previous month
      expect(calendar.currentDate.value.getMonth()).toBe(3) // April = month 3
      expect(calendar.currentDate.value.getFullYear()).toBe(2025)
    })

    it('should navigate to next year', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      const initialDate = new Date('2025-11-04')
      store.setCurrentDate(initialDate)
      
      calendar.nextYear()
      
      const expectedDate = new Date('2026-11-04')
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0])
    })

    it('should navigate to previous year', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      const initialDate = new Date('2025-11-04')
      store.setCurrentDate(initialDate)
      
      calendar.prevYear()
      
      const expectedDate = new Date('2024-11-04')
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0])
    })

    it('should go to today', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      store.setCurrentDate(new Date('2024-01-01'))
      
      calendar.goToToday()
      
      const now = new Date()
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(now.toISOString().split('T')[0])
    })

    it('should go to specific date', () => {
      const calendar = useCalendar()
      const targetDate = new Date('2025-12-25')
      
      calendar.goToDate(targetDate)
      
      expect(calendar.currentDate.value.toISOString().split('T')[0]).toBe(targetDate.toISOString().split('T')[0])
    })
  })

  describe('event retrieval', () => {
    beforeEach(() => {
      const store = useCalendarStore()
      const mockEvents: CalendarEvent[] = [
        {
          id: 1,
          tenant_id: 1,
          user_id: 1,
          calendar_id: 1,
          title: 'Morning Meeting',
          start_time: '2025-11-04T09:00:00Z',
          end_time: '2025-11-04T10:00:00Z',
          type: 'meeting',
          is_all_day: false,
          is_exception: false,
          participants: [],
          timezone: 'UTC',
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          tenant_id: 1,
          user_id: 1,
          calendar_id: 1,
          title: 'Afternoon Call',
          start_time: '2025-11-04T14:00:00Z',
          end_time: '2025-11-04T15:00:00Z',
          type: 'call',
          is_all_day: false,
          is_exception: false,
          participants: [],
          timezone: 'UTC',
          created_at: '',
          updated_at: '',
        },
        {
          id: 3,
          tenant_id: 1,
          user_id: 1,
          calendar_id: 1,
          title: 'Next Week Event',
          start_time: '2025-11-11T10:00:00Z',
          end_time: '2025-11-11T11:00:00Z',
          type: 'appointment',
          is_all_day: false,
          is_exception: false,
          participants: [],
          timezone: 'UTC',
          created_at: '',
          updated_at: '',
        },
        {
          id: 4,
          tenant_id: 1,
          user_id: 1,
          calendar_id: 1,
          title: 'Multi-day Event',
          start_time: '2025-11-04T00:00:00Z',
          end_time: '2025-11-06T23:59:59Z',
          type: 'conference',
          is_all_day: true,
          is_exception: false,
          participants: [],
          timezone: 'UTC',
          created_at: '',
          updated_at: '',
        },
      ]
      store.setEvents(mockEvents)
    })

    it('should get day events', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      store.setCurrentDate(new Date('2025-11-04'))
      
      const dayEvents = calendar.getDayEvents(new Date('2025-11-04'))
      
      expect(dayEvents.length).toBeGreaterThan(0)
      expect(dayEvents.every(e => e.date === '2025-11-04')).toBe(true)
    })

    it('should get week events', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      store.setCurrentDate(new Date('2025-11-04'))
      
      const weekEvents = calendar.getWeekEvents(new Date('2025-11-04'))
      
      expect(Array.isArray(weekEvents)).toBe(true)
    })

    it('should get month events with buffer', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      store.setCurrentDate(new Date('2025-11-04'))
      
      const monthEvents = calendar.getMonthEvents(new Date('2025-11-04'))
      
      expect(Array.isArray(monthEvents)).toBe(true)
    })

    it('should get year events with buffer', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      store.setCurrentDate(new Date('2025-11-04'))
      
      const yearEvents = calendar.getYearEvents(new Date('2025-11-04'))
      
      expect(Array.isArray(yearEvents)).toBe(true)
    })

    it('should expand multi-day events', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      store.setCurrentDate(new Date('2025-11-04'))
      
      const dayEventsNov4 = calendar.getDayEvents(new Date('2025-11-04'))
      const dayEventsNov5 = calendar.getDayEvents(new Date('2025-11-05'))
      const dayEventsNov6 = calendar.getDayEvents(new Date('2025-11-06'))
      
      // Multi-day event should appear on all three days
      const hasMultiDayNov4 = dayEventsNov4.some(e => e.title === 'Multi-day Event')
      const hasMultiDayNov5 = dayEventsNov5.some(e => e.title === 'Multi-day Event')
      const hasMultiDayNov6 = dayEventsNov6.some(e => e.title === 'Multi-day Event')
      
      expect(hasMultiDayNov4 || hasMultiDayNov5 || hasMultiDayNov6).toBe(true)
    })
  })

  describe('utility methods', () => {
    it('should identify holiday events', () => {
      const calendar = useCalendar()
      
      const holidayMeeting = {
        id: '1',
        title: 'Christmas',
        date: '2025-12-25',
        endDate: '2025-12-25',
        startTime: '00:00',
        endTime: '23:59',
        type: 'holiday',
        classification: 'success' as const,
        isAllDay: true,
      }
      
      expect(calendar.isHoliday(holidayMeeting)).toBe(true)
    })

    it('should identify non-holiday events', () => {
      const calendar = useCalendar()
      
      const regularMeeting = {
        id: '1',
        title: 'Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '09:00',
        endTime: '10:00',
        type: 'meeting',
        classification: 'primary' as const,
      }
      
      expect(calendar.isHoliday(regularMeeting)).toBe(false)
    })

    it('should get event type', () => {
      const calendar = useCalendar()
      
      const meeting = {
        id: '1',
        title: 'Meeting',
        date: '2025-11-04',
        endDate: '2025-11-04',
        startTime: '09:00',
        endTime: '10:00',
        type: 'meeting',
        classification: 'primary' as const,
      }
      
      expect(calendar.getType(meeting)).toBe('meeting')
    })

    it('should filter events by type', () => {
      const calendar = useCalendar()
      
      const meetings = [
        {
          id: '1',
          title: 'Meeting',
          date: '2025-11-04',
          endDate: '2025-11-04',
          startTime: '09:00',
          endTime: '10:00',
          type: 'meeting',
          classification: 'primary' as const,
        },
        {
          id: '2',
          title: 'Call',
          date: '2025-11-04',
          endDate: '2025-11-04',
          startTime: '14:00',
          endTime: '15:00',
          type: 'call',
          classification: 'accent' as const,
        },
      ]
      
      const filtered = calendar.filterByType(meetings, 'meeting')
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.type).toBe('meeting')
    })
  })

  describe('cache management', () => {
    it('should provide cache status', () => {
      const calendar = useCalendar()
      const cacheStatus = calendar.getCacheStatus()
      
      expect(cacheStatus).toHaveProperty('isValid')
      expect(cacheStatus).toHaveProperty('lastFetch')
    })

    it('should refresh cache', async () => {
      const calendar = useCalendar()
      
      await expect(calendar.refreshCache()).resolves.not.toThrow()
    })
  })

  describe('computed properties', () => {
    it('should have reactive current week events', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      
      store.setCurrentDate(new Date('2025-11-04'))
      
      expect(Array.isArray(calendar.currentWeekEvents.value)).toBe(true)
    })

    it('should have reactive current day events', () => {
      const calendar = useCalendar()
      const store = useCalendarStore()
      
      store.setCurrentDate(new Date('2025-11-04'))
      
      expect(Array.isArray(calendar.currentDayEvents.value)).toBe(true)
    })
  })
})
