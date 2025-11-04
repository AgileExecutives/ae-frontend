import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useClients } from '@/composables/useClients'

// Mock the API client and config
vi.mock('@/config/api-config', () => ({
  getApiClient: () => ({
    getClients: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn()
  })
}))

vi.mock('@/config/app-config', () => ({
  appConfig: {
    MOCK_API: true
  },
  MOCK_CLIENT_DATA: {
    clients: [
      { 
        id: 1, 
        first_name: 'John', 
        last_name: 'Doe', 
        email: 'john@example.com',
        status: 'active' 
      },
      { 
        id: 2, 
        first_name: 'Jane', 
        last_name: 'Smith', 
        email: 'jane@example.com',
        status: 'archived' 
      }
    ]
  }
}))

describe('useClients', () => {
  let clientsComposable: ReturnType<typeof useClients>

  beforeEach(() => {
    clientsComposable = useClients()
  })

  it('should initialize with empty state', () => {
    expect(clientsComposable.allClients.value).toEqual([])
    expect(clientsComposable.activeClients.value).toEqual([])
    expect(clientsComposable.waitingClients.value).toEqual([])
    expect(clientsComposable.archivedClients.value).toEqual([])
    expect(clientsComposable.currentList.value).toEqual([]) // Should default to active clients
    expect(clientsComposable.currentListSelection.value).toBe('active') // Should default to 'active'
    expect(clientsComposable.currentClient.value).toBeNull()
    expect(clientsComposable.isLoading.value).toBe(false)
    expect(clientsComposable.error.value).toBeNull()
    expect(clientsComposable.isDrawerOpen.value).toBe(false)
    expect(clientsComposable.isEditMode.value).toBe(false)
    expect(clientsComposable.showDeleteConfirmModal.value).toBe(false)
  })

  it('should provide UI state setters', () => {
    // Test drawer state
    clientsComposable.setDrawerOpen(true)
    expect(clientsComposable.isDrawerOpen.value).toBe(true)
    
    clientsComposable.setDrawerPinned(true)
    expect(clientsComposable.drawerPinned.value).toBe(true)
    
    clientsComposable.setEditMode(true)
    expect(clientsComposable.isEditMode.value).toBe(true)

    // Test search query
    clientsComposable.setSearchQuery('test query')
    expect(clientsComposable.searchQuery.value).toBe('test query')

    // Test current client
    const mockClient = { id: 1, first_name: 'John', last_name: 'Doe', status: 'active' as const }
    clientsComposable.setCurrentClient(mockClient)
    expect(clientsComposable.currentClient.value).toEqual(mockClient)

    // Test current list selection
    clientsComposable.setCurrentListSelection('waiting')
    expect(clientsComposable.currentListSelection.value).toBe('waiting')
  })

  it('should handle add client UI action', () => {
    clientsComposable.handleAddClient()
    
    expect(clientsComposable.currentClient.value).toBeNull()
    expect(clientsComposable.isDrawerOpen.value).toBe(true)
    expect(clientsComposable.isEditMode.value).toBe(true)
  })

  it('should handle client edit UI action', () => {
    const mockClient = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      status: 'active' as const
    }
    
    clientsComposable.handleClientEdit(mockClient)
    
    expect(clientsComposable.currentClient.value).toEqual(mockClient)
    expect(clientsComposable.isDrawerOpen.value).toBe(true)
    expect(clientsComposable.isEditMode.value).toBe(true)
  })

  it('should handle client edit UI action', () => {
    const mockClient = { 
      id: 1, 
      first_name: 'John', 
      last_name: 'Doe',
      status: 'active' 
    } as any

    clientsComposable.handleClientEdit(mockClient)
    
    expect(clientsComposable.currentClient.value).toEqual(mockClient)
    expect(clientsComposable.isDrawerOpen.value).toBe(true)
    expect(clientsComposable.isEditMode.value).toBe(true)
  })

  it('should close client details', () => {
    // First open the drawer
    clientsComposable.handleAddClient()
    expect(clientsComposable.isDrawerOpen.value).toBe(true)
    
    // Then close it
    clientsComposable.closeClientDetails()
    
    expect(clientsComposable.isDrawerOpen.value).toBe(false)
    expect(clientsComposable.currentClient.value).toBeNull()
    expect(clientsComposable.isEditMode.value).toBe(false)
  })

  it('should generate correct drawer title', () => {
    // No client selected
    expect(clientsComposable.drawerTitle.value).toBe('Client Details')
    
    // Edit mode with no client
    clientsComposable.setEditMode(true)
    expect(clientsComposable.drawerTitle.value).toBe('New Client')
    
    // Client selected
    const mockClient = { 
      id: 1, 
      first_name: 'John', 
      last_name: 'Doe',
      status: 'active' 
    } as any
    
    clientsComposable.setCurrentClient(mockClient)
    clientsComposable.setEditMode(false)
    expect(clientsComposable.drawerTitle.value).toBe('John Doe')
  })

  it('should handle name changes', () => {
    // Start with edit mode
    clientsComposable.setEditMode(true)
    
    clientsComposable.handleNameChange('Jane', 'Smith')
    
    expect(clientsComposable.currentClient.value).toEqual({
      id: expect.any(Number),
      first_name: 'Jane',
      last_name: 'Smith',
      status: 'active'
    })
  })

  it('should handle modal functions', () => {
    const mockClient = { 
      id: 1, 
      first_name: 'John', 
      last_name: 'Doe',
      status: 'active' 
    } as any

    // Show delete modal
    clientsComposable.showDeleteModal(mockClient)
    expect(clientsComposable.showDeleteConfirmModal.value).toBe(true)
    expect(clientsComposable.clientToDelete.value).toEqual(mockClient)

    // Close delete modal
    clientsComposable.closeDeleteModal()
    expect(clientsComposable.showDeleteConfirmModal.value).toBe(false)
    expect(clientsComposable.clientToDelete.value).toBeNull()
  })

  it('should handle search and filter changes', () => {
    clientsComposable.handleSearchChange('test query')
    expect(clientsComposable.searchQuery.value).toBe('test query')

    // Test that handleStatusFilter works with new currentListSelection
    clientsComposable.handleStatusFilter('archived')
    expect(clientsComposable.currentListSelection.value).toBe('archived')

    clientsComposable.handleStatusFilter('waiting')
    expect(clientsComposable.currentListSelection.value).toBe('waiting')

    // Test 'all' defaults to 'active'
    clientsComposable.handleStatusFilter('all')
    expect(clientsComposable.currentListSelection.value).toBe('active')
  })

  it('should switch currentList based on currentListSelection', () => {
    // Default should be active clients (empty initially)
    expect(clientsComposable.currentList.value).toEqual(clientsComposable.activeClients.value)
    expect(clientsComposable.currentListSelection.value).toBe('active')

    // Switch to waiting clients
    clientsComposable.setCurrentListSelection('waiting')
    expect(clientsComposable.currentList.value).toEqual(clientsComposable.waitingClients.value)
    expect(clientsComposable.currentListSelection.value).toBe('waiting')

    // Switch to archived clients
    clientsComposable.setCurrentListSelection('archived')
    expect(clientsComposable.currentList.value).toEqual(clientsComposable.archivedClients.value)
    expect(clientsComposable.currentListSelection.value).toBe('archived')

    // Switch back to active clients
    clientsComposable.setCurrentListSelection('active')
    expect(clientsComposable.currentList.value).toEqual(clientsComposable.activeClients.value)
    expect(clientsComposable.currentListSelection.value).toBe('active')
  })
})