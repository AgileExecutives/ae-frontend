import { ref, computed, readonly } from 'vue'
import type { Client } from '@agile-exec/api-client'

// ========== LEAN CLIENT STORE - ONLY STATE (WHAT) ==========
// This store contains ONLY reactive state and computed properties for derived state
// NO business logic, API calls, or complex event handlers

// ========== CORE CLIENT DATA ==========
const clients = ref<Client[]>([])
const currentClient = ref<Client | null>(null)

// ========== UI STATE ==========
const isDrawerOpen = ref(false)
const drawerPinned = ref(false)
const isEditMode = ref(false)

// ========== FILTER & SEARCH STATE ==========
const searchQuery = ref('')
const currentListSelection = ref<'active' | 'waiting' | 'archived'>('active')

// ========== DELETE MODAL STATE ==========
const showDeleteConfirmModal = ref(false)
const clientToDelete = ref<Client | null>(null)

// ========== LOADING & ERROR STATE ==========
const isLoading = ref(false)
const error = ref<string | null>(null)

// ========== DERIVED STATE (COMPUTED PROPERTIES) ==========

// Filtered client lists by status
const activeClients = computed(() => 
  clients.value.filter((client: Client) => client.status === 'active')
)

const waitingClients = computed(() => 
  clients.value.filter((client: Client) => client.status === 'waiting')
)

const archivedClients = computed(() => 
  clients.value.filter((client: Client) => client.status === 'archived')
)

// Search-filtered clients
const filteredClients = computed(() => {
  if (!searchQuery.value.trim()) {
    return clients.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return clients.value.filter((client: Client) => {
    const firstName = (client.first_name || '').toLowerCase()
    const lastName = (client.last_name || '').toLowerCase()
    const email = (client.email || '').toLowerCase()
    
    return firstName.includes(query) || 
           lastName.includes(query) || 
           email.includes(query)
  })
})

// Current list based on selection and search
const currentList = computed(() => {
  const baseList = (() => {
    switch (currentListSelection.value) {
      case 'active':
        return activeClients.value
      case 'waiting':
        return waitingClients.value
      case 'archived':
        return archivedClients.value
      default:
        return activeClients.value
    }
  })()

  // Apply search filter
  if (!searchQuery.value.trim()) {
    return baseList
  }

  const query = searchQuery.value.toLowerCase().trim()
  return baseList.filter((client: Client) => {
    const firstName = (client.first_name || '').toLowerCase()
    const lastName = (client.last_name || '').toLowerCase()
    const email = (client.email || '').toLowerCase()
    
    return firstName.includes(query) || 
           lastName.includes(query) || 
           email.includes(query)
  })
})

// Client name formatting
const fullClientName = computed(() => {
  if (!currentClient.value) return 'New Client'
  const firstName = currentClient.value.first_name || ''
  const lastName = currentClient.value.last_name || ''
  return `${firstName} ${lastName}`.trim() || 'Unnamed Client'
})

// Drawer title
const drawerTitle = computed(() => {
  if (!currentClient.value) {
    return isEditMode.value ? 'New Client' : 'Client Details'
  }
  
  const firstName = currentClient.value.first_name || ''
  const lastName = currentClient.value.last_name || ''
  
  if (!firstName && !lastName) {
    return isEditMode.value ? 'New Client' : 'Client Details'
  }
  
  return `${firstName} ${lastName}`.trim()
})

// ========== BASIC STATE MUTATIONS ==========
// Only simple state mutations, no complex business logic

const setClients = (newClients: Client[]) => {
  clients.value = newClients
}

const addClient = (client: Client) => {
  clients.value.unshift(client)
}

const updateClient = (updatedClient: Client) => {
  const index = clients.value.findIndex((c: Client) => c.id === updatedClient.id)
  if (index !== -1) {
    clients.value[index] = updatedClient
    // Update current client if it's the same one
    if (currentClient.value?.id === updatedClient.id) {
      currentClient.value = updatedClient
    }
  }
}

const removeClient = (clientId: number) => {
  clients.value = clients.value.filter((c: Client) => c.id !== clientId)
  // Clear current client if it was the removed one
  if (currentClient.value?.id === clientId) {
    currentClient.value = null
  }
}

const setCurrentClient = (client: Client | null) => {
  currentClient.value = client
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

const setCurrentListSelection = (selection: 'active' | 'waiting' | 'archived') => {
  currentListSelection.value = selection
}

const setDrawerOpen = (open: boolean) => {
  console.log('🏪 setDrawerOpen called with:', open)
  console.log('🏪 Current isDrawerOpen value:', isDrawerOpen.value)
  isDrawerOpen.value = open
  console.log('🏪 New isDrawerOpen value:', isDrawerOpen.value)
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

const setClientToDelete = (client: Client | null) => {
  clientToDelete.value = client
}

// ========== UTILITY FUNCTIONS ==========
const getClientById = (id: number): Client | undefined => {
  return clients.value.find((client: Client) => client.id === id)
}

const getClientsByStatus = (status: Client['status']): Client[] => {
  return clients.value.filter((client: Client) => client.status === status)
}

// ========== EXPORT LEAN STORE ==========
export const clientStore = {
  // ========== REACTIVE STATE ==========
  clients,
  currentClient,
  isDrawerOpen,
  drawerPinned,
  isEditMode,
  searchQuery,
  currentListSelection,
  showDeleteConfirmModal,
  clientToDelete,
  isLoading,
  error,

  // ========== COMPUTED PROPERTIES ==========
  activeClients,
  waitingClients,
  archivedClients,
  filteredClients,
  currentList,
  fullClientName,
  drawerTitle,

  // ========== STATE MUTATIONS ==========
  setClients,
  addClient,
  updateClient,
  removeClient,
  setCurrentClient,
  setLoading,
  setError,
  setSearchQuery,
  setCurrentListSelection,
  setDrawerOpen,
  setDrawerPinned,
  setEditMode,
  setShowDeleteModal,
  setClientToDelete,

  // ========== UTILITY FUNCTIONS ==========
  getClientById,
  getClientsByStatus
}

// Keep backward compatibility temporarily
export const clientGlobalStore = clientStore