/**
 * Client Booking System Types
 * 
 * This file contains all type definitions for the client-facing booking system.
 */

/**
 * Time slot configuration for a day
 */
export interface TimeRange {
  start: string // HH:mm format
  end: string   // HH:mm format
}

/**
 * Weekly availability configuration
 */
export interface WeeklyAvailability {
  monday?: TimeRange[]
  tuesday?: TimeRange[]
  wednesday?: TimeRange[]
  thursday?: TimeRange[]
  friday?: TimeRange[]
  saturday?: TimeRange[]
  sunday?: TimeRange[]
}

/**
 * Booking configuration
 */
export interface BookingConfig {
  /** Duration of each slot in minutes (15, 30, 60, etc.) */
  slotDuration: number
  
  /** Buffer time between slots in minutes */
  bufferTime: number
  
  /** Weekly availability configuration */
  weeklyAvailability: WeeklyAvailability
  
  /** Maximum number of series appointments per booking */
  maxSeriesCount: number
  
  /** Minimum hours in advance for booking */
  minAdvanceHours?: number
  
  /** Maximum days in advance for booking */
  maxAdvanceDays?: number
}

/**
 * Recurrence pattern for series appointments
 */
export type RecurrencePattern = 'once' | 'weekly' | 'biweekly'

/**
 * Time of day classification
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

/**
 * Available time slot
 */
export interface TimeSlot {
  /** Unique identifier for the slot */
  id: string
  
  /** Date in YYYY-MM-DD format */
  date: string
  
  /** Start time in HH:mm format */
  startTime: string
  
  /** End time in HH:mm format */
  endTime: string
  
  /** Time of day classification */
  timeOfDay: TimeOfDay
  
  /** Whether this slot is available */
  isAvailable: boolean
  
  /** Number of available slots in series (for series bookings) */
  availableSeriesCount?: number
}

/**
 * Grouped time slots by time of day
 */
export interface GroupedSlots {
  morning: TimeSlot[]
  afternoon: TimeSlot[]
  evening: TimeSlot[]
}

/**
 * Day availability summary
 */
export interface DayAvailability {
  /** Date in YYYY-MM-DD format */
  date: string
  
  /** Total available slots */
  availableCount: number
  
  /** Total slots (available + booked) */
  totalCount: number
  
  /** Availability status */
  status: 'available' | 'partial' | 'none'
  
  /** Available slots for this day */
  slots: TimeSlot[]
}

/**
 * Booking request data
 */
export interface BookingRequest {
  /** Selected slot */
  slot: TimeSlot
  
  /** Client name */
  name: string
  
  /** Client email */
  email: string
  
  /** Optional message */
  message?: string
  
  /** Recurrence pattern */
  recurrence: RecurrencePattern
  
  /** Number of appointments in series (1 for single appointment) */
  seriesCount: number
}

/**
 * Booked appointment
 */
export interface Appointment {
  /** Unique identifier */
  id: string
  
  /** Date in YYYY-MM-DD format */
  date: string
  
  /** Start time in HH:mm format */
  startTime: string
  
  /** End time in HH:mm format */
  endTime: string
  
  /** Client name */
  clientName: string
  
  /** Client email */
  clientEmail: string
  
  /** Optional message */
  message?: string
  
  /** Whether this is part of a series */
  isSeries: boolean
  
  /** Series ID if part of a series */
  seriesId?: string
  
  /** Recurrence pattern if part of a series */
  recurrence?: RecurrencePattern
  
  /** Status */
  status: 'confirmed' | 'pending' | 'cancelled'
  
  /** Created timestamp */
  createdAt: string
}

/**
 * Month calendar data
 */
export interface MonthData {
  /** Year */
  year: number
  
  /** Month (1-12) */
  month: number
  
  /** Days in the month with availability */
  days: DayAvailability[]
}

/**
 * Filter options for slots
 */
export interface SlotFilter {
  /** Filter by time of day */
  timeOfDay?: TimeOfDay[]
  
  /** Minimum duration required */
  minDuration?: number
}
