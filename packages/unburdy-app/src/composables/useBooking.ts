import { computed } from 'vue'
import { bookingStore } from '../stores/bookingStore'
import { useBookingApi } from './useBookingApi'
import type { BookingTemplate } from '@/types/booking'

// ========== BOOKING BUSINESS LOGIC COMPOSABLE (HOW) ==========
// Handles all business logic, API operations, and state management for booking templates

export const useBooking = () => {
  const api = useBookingApi()

  // Initialize flag to prevent multiple initialization
  let initialized = false

  // ========== CORE BUSINESS LOGIC ==========

  const ensureInitialized = async () => {
    if (!initialized) {
      await loadTemplates()
      initialized = true
    }
  }

  const loadTemplates = async (forceRefresh = false) => {
    if (bookingStore.isLoading.value) {
      console.log('📅 Already loading templates, skipping...')
      return
    }

    bookingStore.setLoading(true)
    bookingStore.setError(null)
    
    try {
      const templates = await api.fetchTemplates()
      bookingStore.setTemplates(templates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch booking templates'
      bookingStore.setError(errorMessage)
      console.error('📅 Failed to fetch booking templates:', err)
    } finally {
      bookingStore.setLoading(false)
    }
  }

  const saveTemplate = async (templateData?: Partial<BookingTemplate>) => {
    const dataToSave = templateData || bookingStore.currentTemplate.value
    if (!dataToSave) {
      return { success: false, error: 'No template data to save' }
    }

    // Basic validation
    if (!dataToSave.name || dataToSave.name.trim() === '') {
      return { success: false, error: 'Template name is required' }
    }

    bookingStore.setLoading(true)
    bookingStore.setError(null)

    try {
      const id = dataToSave.id || 0
      let savedTemplate: BookingTemplate

      if (id === 0) {
        // Creating new template
        savedTemplate = await api.createTemplate(dataToSave)
        bookingStore.addTemplate(savedTemplate)
      } else {
        // Updating existing template
        savedTemplate = await api.updateTemplateById(id, dataToSave)
        bookingStore.updateTemplate(savedTemplate)
      }

      // Update current template and exit edit mode
      bookingStore.setCurrentTemplate(savedTemplate)
      bookingStore.setEditMode(false)
      
      return { success: true, data: savedTemplate }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save booking template'
      bookingStore.setError(errorMessage)
      console.error('📅 Failed to save booking template:', err)
      return { success: false, error: errorMessage }
    } finally {
      bookingStore.setLoading(false)
    }
  }

  const deleteTemplate = async (template?: BookingTemplate) => {
    const templateToRemove = template || bookingStore.templateToDelete.value
    if (!templateToRemove?.id) {
      return { success: false, error: 'No template selected for deletion' }
    }

    bookingStore.setLoading(true)
    bookingStore.setError(null)

    try {
      await api.deleteTemplateById(templateToRemove.id)
      bookingStore.removeTemplate(templateToRemove.id)
      
      // Close drawer if deleted template was selected
      if (bookingStore.currentTemplate.value?.id === templateToRemove.id) {
        closeTemplateDetails()
      }
      
      closeDeleteModal()
      
      return { success: true, data: templateToRemove }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete booking template'
      bookingStore.setError(errorMessage)
      console.error('📅 Failed to delete booking template:', err)
      return { success: false, error: errorMessage }
    } finally {
      bookingStore.setLoading(false)
    }
  }

  // ========== UI BUSINESS LOGIC ==========

  const handleAddTemplate = () => {
    console.log('📅 Add new booking template')
    bookingStore.setCurrentTemplate(null)
    bookingStore.setDrawerOpen(true)
    bookingStore.setEditMode(true)
  }

  const handleTemplateEdit = (template: BookingTemplate) => {
    console.log('📅 Edit booking template:', template)
    bookingStore.setCurrentTemplate({ ...template })
    bookingStore.setDrawerOpen(true)
    bookingStore.setEditMode(true)
  }

  const handleTemplateClick = (template: BookingTemplate) => {
    console.log('📅 Template clicked:', template)
    bookingStore.setCurrentTemplate(template)
    bookingStore.setDrawerOpen(true)
    bookingStore.setEditMode(false)
  }

  const closeTemplateDetails = () => {
    bookingStore.setDrawerOpen(false)
    bookingStore.setCurrentTemplate(null)
    bookingStore.setEditMode(false)
  }

  const editTemplate = () => {
    bookingStore.setEditMode(true)
  }

  const cancelEdit = () => {
    // If we were creating a new template, close the drawer completely
    if (!bookingStore.currentTemplate.value || !bookingStore.currentTemplate.value.id) {
      closeTemplateDetails()
    } else {
      // If we were editing an existing template, just exit edit mode
      bookingStore.setEditMode(false)
    }
  }

  const showDeleteModal = (template: BookingTemplate) => {
    bookingStore.setTemplateToDelete(template)
    bookingStore.setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    bookingStore.setShowDeleteModal(false)
    bookingStore.setTemplateToDelete(null)
  }

  const handleSearchChange = (query: string) => {
    bookingStore.setSearchQuery(query)
    console.log('📅 Search query changed:', query)
  }

  // ========== UTILITY FUNCTIONS ==========
  
  const searchTemplates = (query: string): BookingTemplate[] => {
    if (!query.trim()) return [...bookingStore.templates.value]
    
    const searchTerm = query.toLowerCase().trim()
    return bookingStore.templates.value.filter((template: BookingTemplate) => {
      const name = (template.name || '').toLowerCase()
      const description = (template.description || '').toLowerCase()
      
      return name.includes(searchTerm) || description.includes(searchTerm)
    })
  }

  const refreshTemplates = () => loadTemplates(true)

  // ========== RETURN API (HOW) ==========
  return {
    // ========== STATE (What - from store) ==========
    templates: bookingStore.templates,
    filteredTemplates: bookingStore.filteredTemplates,
    currentTemplate: bookingStore.currentTemplate,
    
    // ========== UI STATE ==========
    isLoading: bookingStore.isLoading,
    error: bookingStore.error,
    searchQuery: computed({
      get: () => bookingStore.searchQuery.value,
      set: (value: string) => bookingStore.setSearchQuery(value)
    }),
    isDrawerOpen: computed({
      get: () => bookingStore.isDrawerOpen.value,
      set: (value: boolean) => bookingStore.setDrawerOpen(value)
    }),
    drawerPinned: computed({
      get: () => bookingStore.drawerPinned.value,
      set: (value: boolean) => bookingStore.setDrawerPinned(value)
    }),
    isEditMode: bookingStore.isEditMode,
    showDeleteConfirmModal: bookingStore.showDeleteConfirmModal,
    templateToDelete: bookingStore.templateToDelete,
    
    // ========== COMPUTED PROPERTIES ==========
    drawerTitle: bookingStore.drawerTitle,
    templateCount: bookingStore.templateCount,
    
    // ========== BUSINESS LOGIC METHODS (How) ==========
    ensureInitialized,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    
    // ========== UI EVENT HANDLERS ==========
    handleAddTemplate,
    handleTemplateEdit,
    handleTemplateClick,
    closeTemplateDetails,
    editTemplate,
    cancelEdit,
    showDeleteModal,
    closeDeleteModal,
    handleSearchChange,
    
    // ========== UTILITY FUNCTIONS ==========
    getTemplateById: bookingStore.getTemplateById,
    searchTemplates,
    refreshTemplates,
    
    // ========== DIRECT SETTERS (for components that need them) ==========
    setCurrentTemplate: bookingStore.setCurrentTemplate,
    setEditMode: bookingStore.setEditMode,
    setDrawerOpen: bookingStore.setDrawerOpen,
    setDrawerPinned: bookingStore.setDrawerPinned,
    setSearchQuery: bookingStore.setSearchQuery
  }
}
