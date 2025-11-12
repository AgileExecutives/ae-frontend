import { getApiClient } from '@/config/api-config'
import { useAuthStore } from '@/stores/auth'
import { useCalendarStore } from '@/stores/calendarStore'
import type { BookingTemplate } from '@/types/booking'

// ========== BOOKING API COMPOSABLE (HOW) ==========
// Handles all API operations for booking templates

export const useBookingApi = () => {
  const apiClient = getApiClient()
  const authStore = useAuthStore()
  const calendarStore = useCalendarStore()

  const fetchTemplates = async (): Promise<BookingTemplate[]> => {
    const userId = authStore.user?.id
    
    if (!userId) {
      throw new Error('User ID is required. Please log in again.')
    }
    
    console.log('📅 Calling apiClient.listBookingTemplatesByUser...')
    const response = await apiClient.listBookingTemplatesByUser({ user_id: userId })
    console.log('📅 Response received:', response)
    
    // Handle wrapped API response
    if (response && response.success && response.data && Array.isArray(response.data)) {
      console.log('📅 Templates array received:', response.data.length, 'templates')
      return response.data
    } else {
      console.error('📅 Unexpected response structure:', response)
      const errorMessage = response?.message || 'Invalid response format: expected wrapped templates data'
      throw new Error(errorMessage)
    }
  }

  const createTemplate = async (templateData: Partial<BookingTemplate>): Promise<BookingTemplate> => {
    // Ensure required fields are present with defaults
    const cleanData: any = {
      // Required fields with defaults
      user_id: templateData.user_id || authStore.user?.id,
      calendar_id: templateData.calendar_id || calendarStore.calendarId,
      name: templateData.name || '',
      slot_duration: templateData.slot_duration || 30,
      buffer_time: templateData.buffer_time !== undefined ? templateData.buffer_time : 15,
      max_series_bookings: templateData.max_series_bookings || 10,
      allowed_intervals: Array.isArray(templateData.allowed_intervals) && templateData.allowed_intervals.length > 0 
        ? templateData.allowed_intervals 
        : ['none'],
      number_of_intervals: templateData.number_of_intervals || 1,
      weekly_availability: templateData.weekly_availability || {},
      advance_booking_days: templateData.advance_booking_days || 90,
      min_notice_hours: templateData.min_notice_hours !== undefined ? templateData.min_notice_hours : 24,
      timezone: templateData.timezone || 'Europe/Berlin',
      
      // Optional fields
      ...(templateData.description && { description: templateData.description }),
      ...(templateData.max_bookings_per_day && { max_bookings_per_day: templateData.max_bookings_per_day }),
      ...(templateData.allow_back_to_back !== undefined && { allow_back_to_back: templateData.allow_back_to_back }),
      ...(templateData.block_dates && { block_dates: templateData.block_dates })
    }
    
    // Validate required fields
    if (!cleanData.user_id) {
      throw new Error('User ID is required. Please log in again.')
    }
    if (!cleanData.calendar_id) {
      throw new Error('Calendar ID is required. Please select a calendar first.')
    }
    if (!cleanData.name || cleanData.name.trim() === '') {
      throw new Error('Template name is required')
    }
    if (cleanData.slot_duration < 5) {
      throw new Error('Slot duration must be at least 5 minutes')
    }
    if (cleanData.max_series_bookings < 1) {
      throw new Error('Max series bookings must be at least 1')
    }
    if (cleanData.number_of_intervals < 1) {
      throw new Error('Number of intervals must be at least 1')
    }
    if (cleanData.advance_booking_days < 1) {
      throw new Error('Advance booking days must be at least 1')
    }
    if (cleanData.min_notice_hours < 0) {
      throw new Error('Min notice hours cannot be negative')
    }

    console.log('📅 Creating template with data:', cleanData)

    const response = await apiClient.createBookingTemplate(cleanData)
    
    // Handle wrapped API response
    if (response && response.success && response.data) {
      return response.data
    } else {
      const errorMessage = response?.message || response?.error || 'Failed to create booking template'
      throw new Error(errorMessage)
    }
  }

  const updateTemplateById = async (id: number, templateData: Partial<BookingTemplate>): Promise<BookingTemplate> => {
    // Ensure required fields are present (user can't change user_id or calendar_id)
    const cleanData: any = {
      name: templateData.name || '',
      slot_duration: templateData.slot_duration || 30,
      buffer_time: templateData.buffer_time !== undefined ? templateData.buffer_time : 15,
      max_series_bookings: templateData.max_series_bookings || 10,
      allowed_intervals: Array.isArray(templateData.allowed_intervals) && templateData.allowed_intervals.length > 0 
        ? templateData.allowed_intervals 
        : ['none'],
      number_of_intervals: templateData.number_of_intervals || 1,
      weekly_availability: templateData.weekly_availability || {},
      advance_booking_days: templateData.advance_booking_days || 90,
      min_notice_hours: templateData.min_notice_hours !== undefined ? templateData.min_notice_hours : 24,
      timezone: templateData.timezone || 'Europe/Berlin',
      
      // Optional fields
      ...(templateData.description !== undefined && { description: templateData.description }),
      ...(templateData.max_bookings_per_day && { max_bookings_per_day: templateData.max_bookings_per_day }),
      ...(templateData.allow_back_to_back !== undefined && { allow_back_to_back: templateData.allow_back_to_back }),
      ...(templateData.block_dates && { block_dates: templateData.block_dates })
    }
    
    // Validate required fields
    if (!cleanData.name || cleanData.name.trim() === '') {
      throw new Error('Template name is required')
    }
    if (cleanData.slot_duration < 5) {
      throw new Error('Slot duration must be at least 5 minutes')
    }
    if (cleanData.max_series_bookings < 1) {
      throw new Error('Max series bookings must be at least 1')
    }
    if (cleanData.number_of_intervals < 1) {
      throw new Error('Number of intervals must be at least 1')
    }
    if (cleanData.advance_booking_days < 1) {
      throw new Error('Advance booking days must be at least 1')
    }
    if (cleanData.min_notice_hours < 0) {
      throw new Error('Min notice hours cannot be negative')
    }

    console.log('📅 Updating template with data:', cleanData)

    const response = await apiClient.updateBookingTemplate(id, cleanData)
    
    // Handle wrapped API response
    if (response && response.success && response.data) {
      return response.data
    } else {
      const errorMessage = response?.message || response?.error || 'Failed to update booking template'
      throw new Error(errorMessage)
    }
  }

  const deleteTemplateById = async (id: number): Promise<void> => {
    const response = await apiClient.deleteBookingTemplate(id)
    
    // Handle wrapped API response
    if (response && response.success) {
      return
    } else {
      const errorMessage = (response as any)?.message || 'Failed to delete booking template'
      throw new Error(errorMessage)
    }
  }

  return {
    fetchTemplates,
    createTemplate,
    updateTemplateById,
    deleteTemplateById
  }
}
