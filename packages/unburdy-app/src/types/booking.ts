// Booking Template Types

export interface BookingTemplate {
  id: number
  user_id: number
  calendar_id: number
  tenant_id: number
  booking_id?: number
  name: string
  description: string
  
  // Slot settings
  slot_duration: number              // Duration of each slot in minutes (15, 30, 60)
  buffer_time: number                // Buffer time between slots in minutes (e.g., 5, 10, 15)
  
  // Series/Recurrence settings
  max_series_bookings: number        // Maximum number of series slots per booking (e.g., 10)
  allowed_intervals: RecurrenceInterval[]  // Which intervals are allowed
  number_of_intervals: number        // 2 and week = biweekly, 3 and month-day = quarterly
  
  // Weekly availability schedule
  weekly_availability: WeeklyAvailability
  
  // Booking window
  advance_booking_days: number       // How many days in advance can be booked (e.g., 90)
  min_notice_hours: number          // Minimum notice required for booking (e.g., 24)
  
  // Timezone
  timezone: string                   // e.g., "Europe/Berlin"
  
  // Optional: Advanced settings
  max_bookings_per_day?: number     // Limit bookings per day
  allow_back_to_back?: boolean      // Allow bookings without buffer time
  block_dates?: DateRange[]         // Array of date ranges to block
  
  // Metadata
  created_at: string
  updated_at: string
}

export type RecurrenceInterval = 'none' | 'weekly' | 'monthly-date' | 'monthly-day' | 'yearly'

export interface WeeklyAvailability {
  monday?: TimeRange[]
  tuesday?: TimeRange[]
  wednesday?: TimeRange[]
  thursday?: TimeRange[]
  friday?: TimeRange[]
  saturday?: TimeRange[]
  sunday?: TimeRange[]
}

export interface TimeRange {
  start: string  // Time in HH:mm format (e.g., "09:00")
  end: string    // Time in HH:mm format (e.g., "17:00")
}

export interface DateRange {
  start: string  // Date in YYYY-MM-DD format
  end: string    // Date in YYYY-MM-DD format
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag'
}

export const RECURRENCE_INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  none: 'Einmalig',
  weekly: 'Wöchentlich',
  'monthly-date': 'Monatlich (am gleichen Datum)',
  'monthly-day': 'Monatlich (am gleichen Wochentag)',
  yearly: 'Jährlich'
}

export const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 Minuten' },
  { value: 30, label: '30 Minuten' },
  { value: 45, label: '45 Minuten' },
  { value: 60, label: '1 Stunde' },
  { value: 90, label: '1,5 Stunden' },
  { value: 120, label: '2 Stunden' }
]

export const BUFFER_TIME_OPTIONS = [
  { value: 0, label: 'Keine Pause' },
  { value: 5, label: '5 Minuten' },
  { value: 10, label: '10 Minuten' },
  { value: 15, label: '15 Minuten' },
  { value: 30, label: '30 Minuten' }
]

// Helper function to create an empty template
export function createEmptyTemplate(): Partial<BookingTemplate> {
  return {
    name: '',
    description: '',
    slot_duration: 30,
    buffer_time: 15,
    max_series_bookings: 10,
    allowed_intervals: ['none', 'weekly'],
    number_of_intervals: 1,
    weekly_availability: {},
    advance_booking_days: 90,
    min_notice_hours: 24,
    timezone: 'Europe/Berlin',
    allow_back_to_back: false,
    block_dates: []
  }
}
