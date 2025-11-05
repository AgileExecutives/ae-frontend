export interface Participant {
  email: string
  name: string
}

export interface CalendarSeries {
  id: number
  tenant_id: number
  user_id: number
  calendar_id: number
  title: string
  participants: Participant[]
  weekday: number
  interval: number
  start_time: string  // UTC datetime with timezone
  end_time: string    // UTC datetime with timezone
  description?: string
  location?: string
  timezone: string
  entry_uuid: string
  sequence: number
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: number
  tenant_id: number
  user_id: number
  calendar_id: number
  series_id?: number
  title: string
  is_exception: boolean
  participants: Participant[]
  start_time: string  // UTC datetime with timezone: "2025-09-15T11:00:00+02:00"
  end_time: string    // UTC datetime with timezone: "2025-09-15T12:00:00+02:00"
  type: string
  description?: string
  location?: string
  timezone: string    // e.g., "Europe/Berlin"
  is_all_day: boolean
  series?: CalendarSeries
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  title: string
  startTime: string  // HH:mm format for display
  endTime: string    // HH:mm format for display
  classification: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'school_holiday'
  type?: string // Original backend type for holidays and other identification
  description?: string
  attendees?: string[]
  date?: string // Start date - YYYY-MM-DD format
  endDate?: string // End date - YYYY-MM-DD format (for multi-day events)
  isAllDay?: boolean // All-day event flag
  isMultiDay?: boolean // Flag to indicate if event spans multiple days
  location?: string
  timezone?: string
}
