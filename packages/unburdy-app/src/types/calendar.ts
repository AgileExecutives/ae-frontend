export interface CalendarEvent {
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

export interface CalendarSeries {
  id: string
  title: string
  recurrence_rule: string
  start_date: string
  end_date?: string
  events: CalendarEvent[]
}

export interface Meeting {
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
