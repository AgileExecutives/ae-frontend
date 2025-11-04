import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'

// Extend dayjs with required plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

export interface DateTimeConfig {
  /** Display timezone (defaults to browser timezone) */
  displayTimezone?: string
  /** Date format for display */
  dateFormat?: string
  /** Time format for display */
  timeFormat?: string
  /** Full datetime format for display */
  datetimeFormat?: string
}

export interface DateTimeInput {
  /** Date string in YYYY-MM-DD format */
  date: string
  /** Time string in HH:MM format */
  time: string
  /** Optional timezone (defaults to browser timezone) */
  timezone?: string
}

/**
 * Composable for UTC-based datetime handling with local display conversion
 * 
 * Strategy:
 * - Store all datetimes internally as UTC ISO strings
 * - Convert to local time only for display
 * - Accept user input in their local timezone
 * - Send UTC to backend, receive UTC from backend
 */
export function useDateTimeUtc(config: DateTimeConfig = {}) {
  // Default configuration
  const defaultConfig = {
    displayTimezone: dayjs.tz.guess(), // Browser timezone
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    datetimeFormat: 'MMM D, YYYY, HH:mm (z)', // "Nov 4, 2025, 13:00 (CET)"
    ...config
  }

  // Debug mode for development
  const debug = ref(process.env.NODE_ENV === 'development')

  /**
   * Create UTC ISO string from local date and time input
   */
  const createUtcFromLocal = (input: DateTimeInput): string => {
    const { date, time, timezone = defaultConfig.displayTimezone } = input
    
    try {
      // Create datetime in the specified timezone
      const localDateTime = dayjs.tz(`${date} ${time}`, timezone)
      const utcString = localDateTime.utc().toISOString()
      
      if (debug.value) {
        console.log('🕐 createUtcFromLocal:', {
          input: { date, time, timezone },
          localDateTime: localDateTime.format(),
          utcString,
          browserTz: dayjs.tz.guess()
        })
      }
      
      return utcString
    } catch (error) {
      console.error('Error creating UTC from local time:', error, input)
      return dayjs().utc().toISOString() // Fallback to current UTC time
    }
  }

  /**
   * Parse UTC ISO string and convert to local display format
   */
  const formatUtcForDisplay = (utcString: string, format?: string): string => {
    try {
      const utcDateTime = dayjs.utc(utcString)
      const localDateTime = utcDateTime.tz(defaultConfig.displayTimezone)
      const displayFormat = format || defaultConfig.datetimeFormat
      const formatted = localDateTime.format(displayFormat)
      
      if (debug.value) {
        console.log('🎨 formatUtcForDisplay:', {
          utcString,
          utcDateTime: utcDateTime.format(),
          localDateTime: localDateTime.format(),
          displayTimezone: defaultConfig.displayTimezone,
          formatted
        })
      }
      
      return formatted
    } catch (error) {
      console.error('Error formatting UTC for display:', error, utcString)
      return utcString // Fallback to original string
    }
  }

  /**
   * Extract local date from UTC string
   */
  const getLocalDate = (utcString: string): string => {
    try {
      return dayjs.utc(utcString)
        .tz(defaultConfig.displayTimezone)
        .format(defaultConfig.dateFormat)
    } catch (error) {
      console.error('Error extracting local date:', error, utcString)
      return dayjs().format(defaultConfig.dateFormat)
    }
  }

  /**
   * Extract local time from UTC string
   */
  const getLocalTime = (utcString: string): string => {
    try {
      return dayjs.utc(utcString)
        .tz(defaultConfig.displayTimezone)
        .format(defaultConfig.timeFormat)
    } catch (error) {
      console.error('Error extracting local time:', error, utcString)
      return dayjs().format(defaultConfig.timeFormat)
    }
  }

  /**
   * Get current UTC ISO string
   */
  const nowUtc = (): string => {
    return dayjs().utc().toISOString()
  }

  /**
   * Get current local date
   */
  const todayLocal = (): string => {
    return dayjs().tz(defaultConfig.displayTimezone).format(defaultConfig.dateFormat)
  }

  /**
   * Get current local time
   */
  const nowLocalTime = (): string => {
    return dayjs().tz(defaultConfig.displayTimezone).format(defaultConfig.timeFormat)
  }

  /**
   * Check if UTC datetime is in the past
   */
  const isInPast = (utcString: string): boolean => {
    try {
      return dayjs.utc(utcString).isBefore(dayjs.utc())
    } catch (error) {
      console.error('Error checking if datetime is in past:', error, utcString)
      return false
    }
  }

  /**
   * Check if UTC datetime is today in local timezone
   */
  const isToday = (utcString: string): boolean => {
    try {
      const utcDate = dayjs.utc(utcString).tz(defaultConfig.displayTimezone)
      const today = dayjs().tz(defaultConfig.displayTimezone)
      return utcDate.isSame(today, 'day')
    } catch (error) {
      console.error('Error checking if datetime is today:', error, utcString)
      return false
    }
  }

  /**
   * Add duration to UTC datetime
   */
  const addToUtc = (utcString: string, amount: number, unit: 'minute' | 'hour' | 'day' = 'hour'): string => {
    try {
      return dayjs.utc(utcString).add(amount, unit).toISOString()
    } catch (error) {
      console.error('Error adding to UTC datetime:', error, { utcString, amount, unit })
      return utcString
    }
  }

  /**
   * Create time range for API queries (start/end of day in UTC)
   */
  const getDayRangeUtc = (localDate: string): { start: string; end: string } => {
    try {
      const startOfDay = dayjs.tz(localDate, defaultConfig.displayTimezone).startOf('day')
      const endOfDay = dayjs.tz(localDate, defaultConfig.displayTimezone).endOf('day')
      
      return {
        start: startOfDay.utc().toISOString(),
        end: endOfDay.utc().toISOString()
      }
    } catch (error) {
      console.error('Error creating day range UTC:', error, localDate)
      const now = dayjs().utc()
      return {
        start: now.startOf('day').toISOString(),
        end: now.endOf('day').toISOString()
      }
    }
  }

  /**
   * Validate date and time input
   */
  const validateDateTime = (date: string, time: string): { isValid: boolean; error?: string } => {
    try {
      // Check date format
      if (!dayjs(date, defaultConfig.dateFormat, true).isValid()) {
        return { isValid: false, error: `Invalid date format. Expected: ${defaultConfig.dateFormat}` }
      }
      
      // Check time format
      if (!dayjs(`${date} ${time}`, `${defaultConfig.dateFormat} ${defaultConfig.timeFormat}`, true).isValid()) {
        return { isValid: false, error: `Invalid time format. Expected: ${defaultConfig.timeFormat}` }
      }
      
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: `Validation error: ${error}` }
    }
  }

  // Computed properties for common display formats
  const displayFormats = computed(() => ({
    date: defaultConfig.dateFormat,
    time: defaultConfig.timeFormat,
    datetime: defaultConfig.datetimeFormat,
    timezone: defaultConfig.displayTimezone
  }))

  // Reactive timezone info
  const timezoneInfo = computed(() => ({
    name: defaultConfig.displayTimezone,
    offset: dayjs().tz(defaultConfig.displayTimezone).format('Z'),
    abbreviation: dayjs().tz(defaultConfig.displayTimezone).format('z')
  }))

  return {
    // Core conversion functions
    createUtcFromLocal,
    formatUtcForDisplay,
    getLocalDate,
    getLocalTime,
    
    // Utility functions
    nowUtc,
    todayLocal,
    nowLocalTime,
    isInPast,
    isToday,
    addToUtc,
    getDayRangeUtc,
    
    // Validation
    validateDateTime,
    
    // Configuration and info
    displayFormats,
    timezoneInfo,
    
    // Debug control
    debug
  }
}

/**
 * Specific composable for calendar datetime operations
 */
export function useCalendarDateTime(config: DateTimeConfig = {}) {
  const dateTime = useDateTimeUtc(config)

  /**
   * Convert Meeting format to UTC ISO strings for API
   */
  const convertMeetingToUtc = (meeting: {
    date: string
    startTime: string
    endTime: string
    endDate?: string
  }): {
    date_from: string
    date_to: string
  } => {
    const startUtc = dateTime.createUtcFromLocal({
      date: meeting.date,
      time: meeting.startTime
    })
    
    const endUtc = dateTime.createUtcFromLocal({
      date: meeting.endDate || meeting.date,
      time: meeting.endTime
    })

    return {
      date_from: startUtc,
      date_to: endUtc
    }
  }

  /**
   * Convert API UTC response to Meeting format for display
   */
  const convertUtcToMeeting = (event: {
    date_from: string
    date_to: string
  }): {
    date: string
    startTime: string
    endTime: string
    endDate: string
  } => {
    const startDate = dateTime.getLocalDate(event.date_from)
    const endDate = dateTime.getLocalDate(event.date_to)
    const startTime = dateTime.getLocalTime(event.date_from)
    const endTime = dateTime.getLocalTime(event.date_to)

    return {
      date: startDate,
      endDate,
      startTime,
      endTime
    }
  }

  /**
   * Format event for calendar display
   */
  const formatEventForDisplay = (event: {
    date_from: string
    date_to: string
    title: string
  }): {
    title: string
    displayTime: string
    displayDate: string
    isMultiDay: boolean
  } => {
    const startLocal = dateTime.getLocalDate(event.date_from)
    const endLocal = dateTime.getLocalDate(event.date_to)
    const isMultiDay = startLocal !== endLocal

    const displayTime = isMultiDay
      ? `${dateTime.formatUtcForDisplay(event.date_from, 'MMM D, HH:mm')} - ${dateTime.formatUtcForDisplay(event.date_to, 'MMM D, HH:mm')}`
      : `${dateTime.getLocalTime(event.date_from)} - ${dateTime.getLocalTime(event.date_to)}`

    return {
      title: event.title,
      displayTime,
      displayDate: dateTime.formatUtcForDisplay(event.date_from, 'MMM D, YYYY'),
      isMultiDay
    }
  }

  return {
    ...dateTime,
    convertMeetingToUtc,
    convertUtcToMeeting,
    formatEventForDisplay
  }
}