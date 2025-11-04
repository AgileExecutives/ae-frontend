import { ref, computed } from 'vue'
import { getApiClient } from '@/config/api-config'
import { appConfig, MOCK_CLIENT_DATA } from '@/config/app-config'
import type { Client } from '@agile-exec/api-client'

// ========== GLOBAL SINGLETON CLIENT STORE ==========
// This creates a global reactive store that is shared across all component instances

// ========== CENTRALIZED CLIENT STORE ==========
const clientStore = ref<Client[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// ========== CURRENT CLIENT MANAGEMENT ==========
const currentClient = ref<Client | null>(null)

// ========== UI STATE ==========
const searchQuery = ref('')
const currentListSelection = ref<'active' | 'waiting' | 'archived'>('active')
const isDrawerOpen = ref(false)
const drawerPinned = ref(false)
const isEditMode = ref(false)
const showDeleteConfirmModal = ref(false)
const clientToDelete = ref<Client | null>(null)

// ========== API CLIENT ==========
const apiClient = getApiClient()

// ========== CACHE MANAGEMENT ==========
const cache = ref({
  lastFetch: null as Date | null,
  data: [] as Client[],
  isValid: false
})

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const isCacheValid = () => {
  if (!cache.value.lastFetch || !cache.value.isValid) return false
  const now = new Date()
  return (now.getTime() - cache.value.lastFetch.getTime()) < CACHE_DURATION
}

// ========== REACTIVE FILTERED LISTS ==========
const activeClients = computed(() => 
  clientStore.value.filter(client => client.status === 'active')
)

const waitingClients = computed(() => 
  clientStore.value.filter(client => client.status === 'waiting')
)

const archivedClients = computed(() => 
  clientStore.value.filter(client => client.status === 'archived')
)

// All clients with search filtering
const allClients = computed(() => {
  if (!searchQuery.value.trim()) {
    return clientStore.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return clientStore.value.filter(client => {
    const firstName = (client.first_name || '').toLowerCase()
    const lastName = (client.last_name || '').toLowerCase()
    const email = (client.email || '').toLowerCase()
    
    return firstName.includes(query) || 
           lastName.includes(query) || 
           email.includes(query)
  })
})

// Current filtered list based on search
const filteredActiveClients = computed(() => {
  if (!searchQuery.value.trim()) {
    return activeClients.value
  }
  return allClients.value.filter(client => client.status === 'active')
})

const filteredWaitingClients = computed(() => {
  if (!searchQuery.value.trim()) {
    return waitingClients.value
  }
  return allClients.value.filter(client => client.status === 'waiting')
})

const filteredArchivedClients = computed(() => {
  if (!searchQuery.value.trim()) {
    return archivedClients.value
  }
  return allClients.value.filter(client => client.status === 'archived')
})

// ========== CURRENT LIST MANAGEMENT ==========
const currentList = computed(() => {
  switch (currentListSelection.value) {
    case 'active':
      return filteredActiveClients.value
    case 'waiting':
      return filteredWaitingClients.value
    case 'archived':
      return filteredArchivedClients.value
    default:
      return filteredActiveClients.value
  }
})

// ========== DRAWER TITLE ==========
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

// ========== STORE UPDATE HELPERS ==========
const updateClientStore = (newClients: Client[]) => {
  clientStore.value = newClients
  // Update cache
  cache.value = {
    lastFetch: new Date(),
    data: [...newClients],
    isValid: true
  }
}

const addClientToStore = (client: Client) => {
  clientStore.value.unshift(client)
  cache.value.data = [...clientStore.value]
  cache.value.lastFetch = new Date()
  cache.value.isValid = true
}

const updateClientInStore = (updatedClient: Client) => {
  const index = clientStore.value.findIndex(c => c.id === updatedClient.id)
  
  if (index !== -1) {
    // Force Vue reactivity by replacing the entire array
    const newClients = [...clientStore.value]
    newClients[index] = updatedClient
    clientStore.value = newClients
    
    // Update current client if it's the same one
    if (currentClient.value?.id === updatedClient.id) {
      currentClient.value = updatedClient
    }
    
    cache.value.data = [...clientStore.value]
    cache.value.lastFetch = new Date()
    cache.value.isValid = true
  }
}

const removeClientFromStore = (clientId: number) => {
  clientStore.value = clientStore.value.filter(c => c.id !== clientId)
  
  // Clear current client if it was the deleted one
  if (currentClient.value?.id === clientId) {
    currentClient.value = null
  }
  
  cache.value.data = [...clientStore.value]
  cache.value.lastFetch = new Date()
  cache.value.isValid = true
}

// Initialize on first use
let initialized = false
const ensureInitialized = async () => {
  if (!initialized) {
    await fetchClients()
    initialized = true
  }
}

// ========== CORE DATA LOADING ==========
const fetchClients = async (forceRefresh = false) => {
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && isCacheValid()) {
    console.log('👥 Using cached client data')
    updateClientStore(cache.value.data)
    return
  }

  if (isLoading.value) {
    console.log('👥 Already loading clients, skipping...')
    return
  }

  isLoading.value = true
  error.value = null
  
  try {
    // Use mock data if MOCK_API is enabled
    if (appConfig.MOCK_API) {
      console.log('👥 Using mock client data (MOCK_API enabled)')
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      const mockClients = MOCK_CLIENT_DATA.clients as Client[]
      updateClientStore(mockClients)
      return
    }

    // Use real API
    console.log('👥 Calling apiClient.getClients...')
    const response = await apiClient.getClients({ page: 1, limit: 1000 })
    console.log('👥 Response received:', response)
    
    // Handle wrapped API response
    if (response && response.success && response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('👥 Clients array received:', response.data.data.length, 'clients')
      updateClientStore(response.data.data)
    } else {
      console.error('👥 Unexpected response structure:', response)
      const errorMessage = response?.message || 'Invalid response format: expected wrapped clients data'
      throw new Error(errorMessage)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch clients'
    console.error('👥 Failed to fetch clients:', err)
    
    // Fallback to mock data on API error if not already using mock
    if (!appConfig.MOCK_API) {
      console.log('👥 API failed, falling back to mock data')
      const mockClients = MOCK_CLIENT_DATA.clients as Client[]
      updateClientStore(mockClients)
    }
  } finally {
    isLoading.value = false
  }
}

// ========== CRUD OPERATIONS ==========
const saveClient = async (clientData?: Partial<Client>) => {
  const dataToSave = clientData || currentClient.value
  if (!dataToSave) return


  
  isLoading.value = true
  error.value = null

  try {
    const id = (dataToSave.hasOwnProperty('id') && dataToSave.id ? dataToSave.id : 0)
    
    if (appConfig.MOCK_API) {
      // In mock mode, just update the client in the store
      if (id === 0) {
        // Creating new client - add to store with a temporary ID
        const newClient = { ...dataToSave, id: Date.now() } as Client
        addClientToStore(newClient)
        currentClient.value = newClient
      } else {
        // Updating existing client
        const updatedClient = { ...dataToSave, id } as Client
        updateClientInStore(updatedClient)
      }
      
    } else {
      // Use real API
      let response
      
      // Clean up the data before sending to API
      const cleanData: any = { ...dataToSave }
      
      // Remove undefined/null id for new clients
      if (id === 0 && cleanData.hasOwnProperty('id')) {
        delete cleanData.id
      }
      
      // Convert undefined cost_provider_id to null
      if (cleanData.cost_provider_id === undefined) {
        delete cleanData.cost_provider_id
      }
      
      // Remove empty string fields
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '') {
          delete cleanData[key]
        }
      })
      
      if (id === 0) {
        response = await apiClient.createClient(cleanData)
      } else {
        response = await apiClient.updateClient(id, cleanData)
      }
      
      // Handle wrapped API response
      if (response && response.success && response.data) {
        if (id === 0) {
          // Creating new client - add to store
          addClientToStore(response.data)
          currentClient.value = response.data
        } else {
          // Update existing client in store
          updateClientInStore(response.data)
        }
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to save client'
        throw new Error(errorMessage)
      }
    }
    
    isEditMode.value = false
    
    return {
      success: true,
      data: currentClient.value
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to save client'
    error.value = errorMessage
    console.error('👥 Failed to save client:', err)
    return {
      success: false,
      error: errorMessage
    }
  } finally {
    isLoading.value = false
  }
}

// Archive client (soft delete)
// Archive client
const archiveClient = async (client?: Client) => {
  const clientToArchive = client || clientToDelete.value
  if (!clientToArchive?.id) {
    console.warn('👥 archiveClient: No client to archive or client has no id')
    return {
      success: false,
      error: 'No client selected for archiving'
    }
  }

  isLoading.value = true
  error.value = null

  try {
    // Check if we need to close the drawer BEFORE updating the client
    const shouldCloseDrawer = currentClient.value?.id === clientToArchive.id
    
    if (appConfig.MOCK_API) {
      // In mock mode, update the client status to archived
      const archivedClient = { ...clientToArchive, status: 'archived' as const }
      updateClientInStore(archivedClient)
    } else {
      // Use real API to update client status
      const response = await apiClient.updateClient(clientToArchive.id, {
        ...clientToArchive,
        status: 'archived'
      })
      
      // Handle wrapped API response
      if (response && response.success && response.data) {
        updateClientInStore(response.data)
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to archive client'
        throw new Error(errorMessage)
      }
    }
    
    // Close the drawer if the archived client was selected
    if (shouldCloseDrawer) {
      closeClientDetails()
    }
    
    closeDeleteModal()
    
    return {
      success: true,
      data: clientToArchive
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to archive client'
    error.value = errorMessage
    console.error('👥 Failed to archive client:', err)
    return {
      success: false,
      error: errorMessage
    }
  } finally {
    isLoading.value = false
  }
}

// Permanently delete client
const deleteClient = async (client?: Client) => {
  const clientToRemove = client || clientToDelete.value
  if (!clientToRemove?.id) {
    console.warn('👥 deleteClient: No client to delete or client has no id')
    return {
      success: false,
      error: 'No client selected for deletion'
    }
  }

  isLoading.value = true
  error.value = null

  try {
    // Check if we need to close the drawer BEFORE removing from store
    const shouldCloseDrawer = currentClient.value?.id === clientToRemove.id
    
    if (appConfig.MOCK_API) {
      console.log('👥 Mock delete client with id:', clientToRemove.id)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      removeClientFromStore(clientToRemove.id)
    } else {
      // Use real API
      const response = await apiClient.deleteClient(clientToRemove.id)
      
      // Handle wrapped API response
      if (response && response.success) {
        removeClientFromStore(clientToRemove.id)
      } else {
        const errorMessage = response?.message || 'Failed to delete client'
        throw new Error(errorMessage)
      }
    }
    
    // Close the drawer if the deleted client was selected
    if (shouldCloseDrawer) {
      closeClientDetails()
    }
    
    closeDeleteModal()
    
    return {
      success: true,
      data: clientToRemove
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete client'
    error.value = errorMessage
    console.error('👥 Failed to delete client:', err)
    return {
      success: false,
      error: errorMessage
    }
  } finally {
    isLoading.value = false
  }
}

// ========== UI EVENT HANDLERS ==========
const handleAddClient = () => {
  console.log('👥 Add new client')
  currentClient.value = null
  isDrawerOpen.value = true
  isEditMode.value = true
}

const handleClientEdit = (client: Client) => {
  console.log('👥 Edit client:', client)
  currentClient.value = { ...client }
  isDrawerOpen.value = true
  isEditMode.value = true
}

const handleClientClick = (client: Client) => {
  console.log('👥 Client clicked:', client)
  currentClient.value = client
  isDrawerOpen.value = true
  isEditMode.value = false
}

const closeClientDetails = () => {
  isDrawerOpen.value = false
  currentClient.value = null
  isEditMode.value = false
}

const handleNameChange = (firstName: string, lastName: string) => {
  if (currentClient.value) {
    currentClient.value = {
      ...currentClient.value,
      first_name: firstName,
      last_name: lastName
    }
  } else if (isEditMode.value) {
    // If we're creating a new client, create a temporary client object for the title
    currentClient.value = {
      first_name: firstName,
      last_name: lastName,
      status: 'active'
    } as Client
  }
}

const editClient = () => {
  isEditMode.value = true
}

const cancelEdit = () => {
  // If we were creating a new client (no currentClient or currentClient has no id), close the drawer completely
  if (!currentClient.value || !currentClient.value.id) {
    closeClientDetails()
  } else {
    // If we were editing an existing client, just exit edit mode
    isEditMode.value = false
  }
}

// Modal functions
const showDeleteModal = (client: Client) => {
  clientToDelete.value = client
  showDeleteConfirmModal.value = true
}

const closeDeleteModal = () => {
  showDeleteConfirmModal.value = false
  clientToDelete.value = null
}

// ========== FILTER FUNCTIONS ==========
const handleStatusFilter = (status: 'all' | 'waiting' | 'active' | 'archived') => {
  // Handle the new list selection logic
  if (status === 'all') {
    // For 'all', default to active clients
    currentListSelection.value = 'active'
  } else {
    // Status is one of 'waiting' | 'active' | 'archived'
    currentListSelection.value = status
  }
  console.log('👥 Status filter changed:', status, '-> currentListSelection:', currentListSelection.value)
}

const handleSearchChange = (query: string) => {
  searchQuery.value = query
  console.log('👥 Search query changed:', query)
}

// ========== COMPUTED PROPERTIES ==========
const fullClientName = computed(() => {
  if (!currentClient.value) return 'New Client'
  return `${currentClient.value.first_name || ''} ${currentClient.value.last_name || ''}`.trim() || 'Unnamed Client'
})

// ========== UTILITY FUNCTIONS ==========
const getClientById = (id: number): Client | undefined => {
  return clientStore.value.find((client: Client) => client.id === id)
}

const getClientsByStatus = (status: Client['status']): Client[] => {
  return clientStore.value.filter((client: Client) => client.status === status)
}

const searchClients = (query: string): Client[] => {
  if (!query.trim()) return clientStore.value
  
  const searchTerm = query.toLowerCase().trim()
  return clientStore.value.filter((client: Client) => {
    const firstName = (client.first_name || '').toLowerCase()
    const lastName = (client.last_name || '').toLowerCase()
    const email = (client.email || '').toLowerCase()
    
    return firstName.includes(searchTerm) || 
           lastName.includes(searchTerm) || 
           email.includes(searchTerm)
  })
}

// ========== EXPORT GLOBAL STORE ==========
export const clientGlobalStore = {
  // ========== REACTIVE DATA STORE ==========
  allClients,
  activeClients,
  waitingClients,
  archivedClients,
  currentList,
  currentClient,
  clientStore,
  
  // ========== UI STATE ==========
  isLoading,
  error,
  searchQuery,
  currentListSelection,
  isDrawerOpen,
  drawerPinned,
  isEditMode,
  showDeleteConfirmModal,
  clientToDelete,
  
  // ========== COMPUTED PROPERTIES ==========
  fullClientName,
  drawerTitle,
  
  // ========== CORE METHODS ==========
  ensureInitialized,
  fetchClients,
  saveClient,
  archiveClient,
  deleteClient,
  
  // ========== UI EVENT HANDLERS ==========
  handleAddClient,
  handleClientEdit,
  handleClientClick,
  closeClientDetails,
  handleNameChange,
  editClient,
  cancelEdit,
  showDeleteModal,
  closeDeleteModal,
  handleStatusFilter,
  handleSearchChange,
  
  // ========== UTILITY FUNCTIONS ==========
  getClientById,
  getClientsByStatus,
  searchClients,
  
  // ========== CACHE MANAGEMENT ==========
  refreshCache: () => fetchClients(true),
  getCacheStatus: () => ({
    isValid: isCacheValid(),
    lastFetch: cache.value.lastFetch,
    itemCount: cache.value.data.length
  })
}