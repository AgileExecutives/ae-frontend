import { ref, computed, readonly } from 'vue'
import type { BookingTemplate } from '@/types/booking'

// ========== LEAN BOOKING STORE - ONLY STATE (WHAT) ==========
// This store contains ONLY reactive state and computed properties for derived state
// NO business logic, API calls, or complex event handlers

// ========== CORE BOOKING DATA ==========
const templates = ref<BookingTemplate[]>([])
const currentTemplate = ref<BookingTemplate | null>(null)

// ========== UI STATE ==========
const isDrawerOpen = ref(false)
const drawerPinned = ref(false)
const isEditMode = ref(false)

// ========== FILTER & SEARCH STATE ==========
const searchQuery = ref('')

// ========== DELETE MODAL STATE ==========
const showDeleteConfirmModal = ref(false)
const templateToDelete = ref<BookingTemplate | null>(null)

// ========== LOADING & ERROR STATE ==========
const isLoading = ref(false)
const error = ref<string | null>(null)

// ========== DERIVED STATE (COMPUTED PROPERTIES) ==========

// Search-filtered templates (sorted by name)
const filteredTemplates = computed(() => {
  let filteredList = templates.value
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filteredList = templates.value.filter((template: BookingTemplate) => {
      const name = (template.name || '').toLowerCase()
      const description = (template.description || '').toLowerCase()
      
      return name.includes(query) || description.includes(query)
    })
  }
  
  // Sort by name
  return filteredList.sort((a: BookingTemplate, b: BookingTemplate) => {
    const aName = (a.name || '').toLowerCase()
    const bName = (b.name || '').toLowerCase()
    return aName.localeCompare(bName)
  })
})

// Template count
const templateCount = computed(() => templates.value.length)

// Drawer title
const drawerTitle = computed(() => {
  if (!currentTemplate.value) {
    return isEditMode.value ? 'Neue Vorlage' : 'Vorlagen Details'
  }
  
  const name = currentTemplate.value.name || ''
  
  if (!name) {
    return isEditMode.value ? 'Neue Vorlage' : 'Vorlagen Details'
  }
  
  return name
})

// ========== BASIC STATE MUTATIONS ==========
// Only simple state mutations, no complex business logic

const setTemplates = (newTemplates: BookingTemplate[]) => {
  templates.value = newTemplates
}

const addTemplate = (template: BookingTemplate) => {
  templates.value.unshift(template)
}

const updateTemplate = (updatedTemplate: BookingTemplate) => {
  const index = templates.value.findIndex((t: BookingTemplate) => t.id === updatedTemplate.id)
  if (index !== -1) {
    templates.value[index] = updatedTemplate
    // Update current template if it's the same one
    if (currentTemplate.value?.id === updatedTemplate.id) {
      currentTemplate.value = updatedTemplate
    }
  }
}

const removeTemplate = (templateId: number) => {
  templates.value = templates.value.filter((t: BookingTemplate) => t.id !== templateId)
  // Clear current template if it was the removed one
  if (currentTemplate.value?.id === templateId) {
    currentTemplate.value = null
  }
}

const setCurrentTemplate = (template: BookingTemplate | null) => {
  currentTemplate.value = template
}

const setLoading = (loading: boolean) => {
  isLoading.value = loading
}

const setError = (errorMessage: string | null) => {
  error.value = errorMessage
}

const setSearchQuery = (query: string) => {
  searchQuery.value = query
}

const setDrawerOpen = (open: boolean) => {
  isDrawerOpen.value = open
}

const setDrawerPinned = (pinned: boolean) => {
  drawerPinned.value = pinned
}

const setEditMode = (editMode: boolean) => {
  isEditMode.value = editMode
}

const setShowDeleteModal = (show: boolean) => {
  showDeleteConfirmModal.value = show
}

const setTemplateToDelete = (template: BookingTemplate | null) => {
  templateToDelete.value = template
}

// ========== UTILITY FUNCTIONS ==========
const getTemplateById = (id: number): BookingTemplate | undefined => {
  return templates.value.find((template: BookingTemplate) => template.id === id)
}

// ========== EXPORT LEAN STORE ==========
export const bookingStore = {
  // ========== REACTIVE STATE ==========
  templates,
  currentTemplate,
  isDrawerOpen,
  drawerPinned,
  isEditMode,
  searchQuery,
  showDeleteConfirmModal,
  templateToDelete,
  isLoading,
  error,

  // ========== COMPUTED PROPERTIES ==========
  filteredTemplates,
  templateCount,
  drawerTitle,

  // ========== STATE MUTATIONS ==========
  setTemplates,
  addTemplate,
  updateTemplate,
  removeTemplate,
  setCurrentTemplate,
  setLoading,
  setError,
  setSearchQuery,
  setDrawerOpen,
  setDrawerPinned,
  setEditMode,
  setShowDeleteModal,
  setTemplateToDelete,

  // ========== UTILITY FUNCTIONS ==========
  getTemplateById
}
