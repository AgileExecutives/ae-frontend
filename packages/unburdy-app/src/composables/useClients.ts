import { computed } from 'vue'
import { clientGlobalStore } from '@/stores/clientStore'

export const useClients = () => {
  // Return references to the global store - all components will share the same reactive state
  return {
    // ========== REACTIVE DATA STORE ==========
    allClients: clientGlobalStore.allClients,
    activeClients: clientGlobalStore.activeClients,
    waitingClients: clientGlobalStore.waitingClients,
    archivedClients: clientGlobalStore.archivedClients,
    currentList: clientGlobalStore.currentList,
    currentClient: clientGlobalStore.currentClient,
    
    // ========== UI STATE ==========
    isLoading: computed(() => clientGlobalStore.isLoading.value),
    error: computed(() => clientGlobalStore.error.value),
    searchQuery: computed({
      get: () => clientGlobalStore.searchQuery.value,
      set: (value: string) => { clientGlobalStore.searchQuery.value = value }
    }),
    currentListSelection: computed(() => clientGlobalStore.currentListSelection.value),
    isDrawerOpen: computed({
      get: () => clientGlobalStore.isDrawerOpen.value,
      set: (value: boolean) => { clientGlobalStore.isDrawerOpen.value = value }
    }),
    drawerPinned: computed({
      get: () => clientGlobalStore.drawerPinned.value,
      set: (value: boolean) => { clientGlobalStore.drawerPinned.value = value }
    }),
    isEditMode: computed(() => clientGlobalStore.isEditMode.value),
    showDeleteConfirmModal: computed(() => clientGlobalStore.showDeleteConfirmModal.value),
    clientToDelete: computed(() => clientGlobalStore.clientToDelete.value),
    
    // ========== COMPUTED PROPERTIES ==========
    fullClientName: clientGlobalStore.fullClientName,
    drawerTitle: clientGlobalStore.drawerTitle,
    
    // ========== CORE METHODS ==========
    ensureInitialized: clientGlobalStore.ensureInitialized,
    fetchClients: clientGlobalStore.fetchClients,
    saveClient: clientGlobalStore.saveClient,
    archiveClient: clientGlobalStore.archiveClient,
    deleteClient: clientGlobalStore.deleteClient,
    
    // ========== UI EVENT HANDLERS ==========
    handleAddClient: clientGlobalStore.handleAddClient,
    handleClientEdit: clientGlobalStore.handleClientEdit,
    handleClientClick: clientGlobalStore.handleClientClick,
    closeClientDetails: clientGlobalStore.closeClientDetails,
    handleNameChange: clientGlobalStore.handleNameChange,
    editClient: clientGlobalStore.editClient,
    cancelEdit: clientGlobalStore.cancelEdit,
    showDeleteModal: clientGlobalStore.showDeleteModal,
    closeDeleteModal: clientGlobalStore.closeDeleteModal,
    handleStatusFilter: clientGlobalStore.handleStatusFilter,
    handleSearchChange: clientGlobalStore.handleSearchChange,
    
    // ========== UTILITY FUNCTIONS ==========
    getClientById: clientGlobalStore.getClientById,
    getClientsByStatus: clientGlobalStore.getClientsByStatus,
    searchClients: clientGlobalStore.searchClients,
    
    // ========== CACHE MANAGEMENT ==========
    refreshCache: clientGlobalStore.refreshCache,
    getCacheStatus: clientGlobalStore.getCacheStatus,
    
    // ========== SETTERS FOR EXTERNAL CONTROL ==========
    setDrawerOpen: (value: boolean) => { clientGlobalStore.isDrawerOpen.value = value },
    setDrawerPinned: (value: boolean) => { clientGlobalStore.drawerPinned.value = value },
    setCurrentClient: (client: any) => { clientGlobalStore.currentClient.value = client },
    setEditMode: (value: boolean) => { clientGlobalStore.isEditMode.value = value },
    setSearchQuery: (query: string) => { clientGlobalStore.searchQuery.value = query },
    setCurrentListSelection: (selection: 'active' | 'waiting' | 'archived') => { 
      clientGlobalStore.currentListSelection.value = selection 
    }
  }
}