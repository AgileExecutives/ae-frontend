import { computed } from 'vue'
import { clientStore } from '../stores/clientStore'
import { useClientApi } from './useClientApi'
import { useClientCache } from './useClientCache'
import { useClientValidation } from './useClientValidation'
import type { Client } from '@agile-exec/api-client'

// ========== CLIENT BUSINESS LOGIC COMPOSABLE (HOW) ==========
// Handles all business logic, API operations, and state management for clients

export const useClients = () => {
  const api = useClientApi()
  const cache = useClientCache<Client>()
  const validation = useClientValidation()

  // Initialize flag to prevent multiple initialization
  let initialized = false

  // ========== CORE BUSINESS LOGIC ==========

  const ensureInitialized = async () => {
    if (!initialized) {
      await loadClients()
      initialized = true
    }
  }

  const loadClients = async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cache.isCacheValid()) {
      console.log('👥 Using cached client data')
      clientStore.setClients([...cache.cache.value.data])
      return
    }

    if (clientStore.isLoading.value) {
      console.log('👥 Already loading clients, skipping...')
      return
    }

    clientStore.setLoading(true)
    clientStore.setError(null)
    
    try {
      const clients = await api.fetchClients()
      clientStore.setClients(clients)
      cache.updateCache(clients)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clients'
      clientStore.setError(errorMessage)
      console.error('👥 Failed to fetch clients:', err)
      
      // Fallback to cached data if available
      if (cache.cache.value.data.length > 0) {
        console.log('👥 API failed, using cached data as fallback')
        clientStore.setClients([...cache.cache.value.data])
      }
    } finally {
      clientStore.setLoading(false)
    }
  }

  const saveClient = async (clientData?: Partial<Client>) => {
    const dataToSave = clientData || clientStore.currentClient.value
    if (!dataToSave) {
      return { success: false, error: 'No client data to save' }
    }

    // Validate client data
    const sanitizedData = validation.sanitizeClientData(dataToSave)
    const validationResult = validation.validateClient(sanitizedData)
    
    if (!validationResult.isValid) {
      return { 
        success: false, 
        error: validationResult.errors.join(', ') 
      }
    }

    clientStore.setLoading(true)
    clientStore.setError(null)

    try {
      const id = sanitizedData.id || 0
      let savedClient: Client

      if (id === 0) {
        // Creating new client
        savedClient = await api.createClient(sanitizedData)
        clientStore.addClient(savedClient)
      } else {
        // Updating existing client
        savedClient = await api.updateClient(id, sanitizedData)
        clientStore.updateClient(savedClient)
      }

      // Update current client and exit edit mode
      clientStore.setCurrentClient(savedClient)
      clientStore.setEditMode(false)
      
      // Invalidate cache since data changed
      cache.invalidateCache()
      
      return { success: true, data: savedClient }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save client'
      clientStore.setError(errorMessage)
      console.error('👥 Failed to save client:', err)
      return { success: false, error: errorMessage }
    } finally {
      clientStore.setLoading(false)
    }
  }

  const archiveClient = async (client?: Client) => {
    const clientToArchive = client || clientStore.clientToDelete.value
    if (!clientToArchive?.id) {
      return { success: false, error: 'No client selected for archiving' }
    }

    clientStore.setLoading(true)
    clientStore.setError(null)

    try {
      const archivedClient = await api.updateClient(clientToArchive.id, {
        ...clientToArchive,
        status: 'archived'
      })
      
      clientStore.updateClient(archivedClient)
      
      // Close drawer if archived client was selected
      if (clientStore.currentClient.value?.id === clientToArchive.id) {
        closeClientDetails()
      }
      
      closeDeleteModal()
      cache.invalidateCache()
      
      return { success: true, data: archivedClient }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive client'
      clientStore.setError(errorMessage)
      console.error('👥 Failed to archive client:', err)
      return { success: false, error: errorMessage }
    } finally {
      clientStore.setLoading(false)
    }
  }

  const deleteClient = async (client?: Client) => {
    const clientToRemove = client || clientStore.clientToDelete.value
    if (!clientToRemove?.id) {
      return { success: false, error: 'No client selected for deletion' }
    }

    clientStore.setLoading(true)
    clientStore.setError(null)

    try {
      await api.deleteClient(clientToRemove.id)
      clientStore.removeClient(clientToRemove.id)
      
      // Close drawer if deleted client was selected
      if (clientStore.currentClient.value?.id === clientToRemove.id) {
        closeClientDetails()
      }
      
      closeDeleteModal()
      cache.invalidateCache()
      
      return { success: true, data: clientToRemove }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client'
      clientStore.setError(errorMessage)
      console.error('👥 Failed to delete client:', err)
      return { success: false, error: errorMessage }
    } finally {
      clientStore.setLoading(false)
    }
  }

  // ========== UI BUSINESS LOGIC ==========

  const handleAddClient = () => {
    console.log('👥 Add new client')
    clientStore.setCurrentClient(null)
    clientStore.setDrawerOpen(true)
    clientStore.setEditMode(true)
  }

  const handleClientEdit = (client: Client) => {
    console.log('👥 Edit client:', client)
    clientStore.setCurrentClient({ ...client })
    clientStore.setDrawerOpen(true)
    clientStore.setEditMode(true)
  }

  const handleClientClick = (client: Client) => {
    console.log('👥 Client clicked:', client)
    clientStore.setCurrentClient(client)
    clientStore.setDrawerOpen(true)
    clientStore.setEditMode(false)
  }

  const closeClientDetails = () => {
    console.log('🚪 closeClientDetails called')
    console.log('🚪 Current drawer state before close:', clientStore.isDrawerOpen.value)
    clientStore.setDrawerOpen(false)
    clientStore.setCurrentClient(null)
    clientStore.setEditMode(false)
    console.log('🚪 Drawer state after close:', clientStore.isDrawerOpen.value)
  }

  const handleNameChange = (firstName: string, lastName: string) => {
    if (clientStore.currentClient.value) {
      clientStore.setCurrentClient({
        ...clientStore.currentClient.value,
        first_name: firstName,
        last_name: lastName
      })
    } else if (clientStore.isEditMode.value) {
      // If we're creating a new client, create a temporary client object
      clientStore.setCurrentClient({
        first_name: firstName,
        last_name: lastName,
        status: 'active'
      } as Client)
    }
  }

  const editClient = () => {
    clientStore.setEditMode(true)
  }

  const cancelEdit = () => {
    // If we were creating a new client, close the drawer completely
    if (!clientStore.currentClient.value || !clientStore.currentClient.value.id) {
      closeClientDetails()
    } else {
      // If we were editing an existing client, just exit edit mode
      clientStore.setEditMode(false)
    }
  }

  const showDeleteModal = (client: Client) => {
    clientStore.setClientToDelete(client)
    clientStore.setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    clientStore.setShowDeleteModal(false)
    clientStore.setClientToDelete(null)
  }

  const handleStatusFilter = (status: 'all' | 'waiting' | 'active' | 'archived') => {
    if (status === 'all') {
      clientStore.setCurrentListSelection('active')
    } else {
      clientStore.setCurrentListSelection(status)
    }
    console.log('👥 Status filter changed:', status)
  }

  const handleSearchChange = (query: string) => {
    clientStore.setSearchQuery(query)
    console.log('👥 Search query changed:', query)
  }

  // ========== UTILITY FUNCTIONS ==========
  
  const searchClients = (query: string): Client[] => {
    if (!query.trim()) return [...clientStore.clients.value]
    
    const searchTerm = query.toLowerCase().trim()
    return clientStore.clients.value.filter((client: Client) => {
      const firstName = (client.first_name || '').toLowerCase()
      const lastName = (client.last_name || '').toLowerCase()
      const email = (client.email || '').toLowerCase()
      
      return firstName.includes(searchTerm) || 
             lastName.includes(searchTerm) || 
             email.includes(searchTerm)
    })
  }

  const refreshCache = () => loadClients(true)

  // ========== RETURN API (HOW) ==========
  return {
    // ========== STATE (What - from store) ==========
    clients: clientStore.clients,
    activeClients: clientStore.activeClients,
    waitingClients: clientStore.waitingClients,
    archivedClients: clientStore.archivedClients,
    currentList: clientStore.currentList,
    currentClient: clientStore.currentClient,
    
    // ========== UI STATE ==========
    isLoading: clientStore.isLoading,
    error: clientStore.error,
    searchQuery: computed({
      get: () => clientStore.searchQuery.value,
      set: (value: string) => clientStore.setSearchQuery(value)
    }),
    currentListSelection: clientStore.currentListSelection,
    isDrawerOpen: computed({
      get: () => clientStore.isDrawerOpen.value,
      set: (value: boolean) => clientStore.setDrawerOpen(value)
    }),
    drawerPinned: computed({
      get: () => clientStore.drawerPinned.value,
      set: (value: boolean) => clientStore.setDrawerPinned(value)
    }),
    isEditMode: clientStore.isEditMode,
    showDeleteConfirmModal: clientStore.showDeleteConfirmModal,
    clientToDelete: clientStore.clientToDelete,
    
    // ========== COMPUTED PROPERTIES ==========
    fullClientName: clientStore.fullClientName,
    drawerTitle: clientStore.drawerTitle,
    
    // ========== BUSINESS LOGIC METHODS (How) ==========
    ensureInitialized,
    loadClients,
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
    getClientById: clientStore.getClientById,
    getClientsByStatus: clientStore.getClientsByStatus,
    searchClients,
    refreshCache,
    getCacheStatus: cache.getCacheStatus,
    
    // ========== VALIDATION ==========
    validateClient: validation.validateClient,
    validateField: validation.validateField,
    
    // ========== DIRECT SETTERS (for components that need them) ==========
    setCurrentClient: clientStore.setCurrentClient,
    setEditMode: clientStore.setEditMode,
    setDrawerOpen: clientStore.setDrawerOpen,
    setDrawerPinned: clientStore.setDrawerPinned,
    setSearchQuery: clientStore.setSearchQuery,
    setCurrentListSelection: clientStore.setCurrentListSelection
  }
}