import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useClients } from '@/composables/useClients'
import type { Client } from '@agile-exec/api-client'

// Mock the API client and config
vi.mock('@/config/api-config', () => ({
  getApiClient: () => ({
    getClients: vi.fn().mockResolvedValue({
      success: true,
      data: []
    }),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn().mockResolvedValue({
      success: true
    })
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
        status: 'active' 
      },
      { 
        id: 3, 
        first_name: 'Bob', 
        last_name: 'Wilson', 
        email: 'bob@example.com',
        status: 'archived' 
      }
    ]
  }
}))

describe('Client Delete Drawer Behavior', () => {
  let clientsComposable: ReturnType<typeof useClients>
  
  const mockActiveClient: Client = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    status: 'active'
  }

  const mockArchivedClient: Client = {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    status: 'archived'
  }

  const mockOtherClient: Client = {
    id: 3,
    first_name: 'Bob',
    last_name: 'Wilson',
    email: 'bob@example.com',
    status: 'active'
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    clientsComposable = useClients()
    
    // Initialize with mock data
    await clientsComposable.ensureInitialized()
    
    // Reset drawer state
    clientsComposable.closeClientDetails()
  })

  afterEach(() => {
    // Clean up any timers or async operations
    vi.clearAllTimers()
  })

  describe('Permanent Delete Drawer Closing', () => {
    it('should close drawer when permanently deleting the currently selected client', async () => {
      // Arrange: Open drawer with a client
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)

      // Act: Permanently delete the currently selected client
      const result = await clientsComposable.deleteClient(mockActiveClient)

      // Assert: Drawer should be closed and client should be null
      expect(result.success).toBe(true)
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
      expect(clientsComposable.currentClient.value).toBeNull()
    })

    it('should NOT close drawer when permanently deleting a different client (not currently selected)', async () => {
      // Arrange: Open drawer with client A, but delete client B
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)

      // Act: Delete a different client (not the one in the drawer)
      const result = await clientsComposable.deleteClient(mockOtherClient)

      // Assert: Drawer should remain open with original client
      expect(result.success).toBe(true)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)
    })

    it('should work correctly when drawer is closed (no selected client)', async () => {
      // Arrange: Ensure drawer is closed
      clientsComposable.closeClientDetails()
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
      expect(clientsComposable.currentClient.value).toBeNull()

      // Act: Delete a client when no client is selected
      const result = await clientsComposable.deleteClient(mockActiveClient)

      // Assert: Drawer should remain closed, operation should succeed
      expect(result.success).toBe(true)
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
      expect(clientsComposable.currentClient.value).toBeNull()
    })

    it('should handle drawer closing before client removal from store', async () => {
      // This test ensures the fix for the race condition is working
      
      // Arrange: Open drawer with a client
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)

      // Act: Delete the client - this should trigger the fixed logic
      const result = await clientsComposable.deleteClient(mockActiveClient)

      // Assert: The drawer should be closed even though the client was removed
      expect(result.success).toBe(true)
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
      expect(clientsComposable.currentClient.value).toBeNull()
    })
  })

  describe('Archive Client Drawer Closing', () => {
    it('should close drawer when archiving the currently selected client', async () => {
      // Arrange: Open drawer with a client
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)

      // Act: Archive the currently selected client
      const result = await clientsComposable.archiveClient(mockActiveClient)

      // Assert: Drawer should be closed
      expect(result.success).toBe(true)
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
      expect(clientsComposable.currentClient.value).toBeNull()
    })

    it('should NOT close drawer when archiving a different client', async () => {
      // Arrange: Open drawer with client A, but archive client B
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)

      // Act: Archive a different client
      const result = await clientsComposable.archiveClient(mockOtherClient)

      // Assert: Drawer should remain open with original client
      expect(result.success).toBe(true)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)
    })
  })

  describe('Consistent Behavior Between Delete and Archive', () => {
    it('should have identical drawer closing behavior for delete and archive operations', async () => {
      // Test Case 1: Delete selected client
      clientsComposable.handleClientClick(mockActiveClient)
      const deleteResult = await clientsComposable.deleteClient(mockActiveClient)
      const deleteDrawerClosed = !clientsComposable.isDrawerOpen.value
      
      // Reset state for archive test
      clientsComposable.closeClientDetails()
      
      // Test Case 2: Archive selected client  
      clientsComposable.handleClientClick(mockOtherClient)
      const archiveResult = await clientsComposable.archiveClient(mockOtherClient)
      const archiveDrawerClosed = !clientsComposable.isDrawerOpen.value

      // Assert: Both operations should behave identically
      expect(deleteResult.success).toBe(archiveResult.success)
      expect(deleteDrawerClosed).toBe(archiveDrawerClosed)
      expect(deleteDrawerClosed).toBe(true) // Both should close drawer
    })

    it('should handle edge case: client with no ID gracefully', async () => {
      const clientWithoutId = { 
        first_name: 'Test', 
        last_name: 'User', 
        status: 'active' as const 
      } as Client

      // Test delete
      const deleteResult = await clientsComposable.deleteClient(clientWithoutId)
      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toContain('No client selected')

      // Test archive
      const archiveResult = await clientsComposable.archiveClient(clientWithoutId)
      expect(archiveResult.success).toBe(false)
      expect(archiveResult.error).toContain('No client selected')
    })
  })

  describe('Delete Modal Integration', () => {
    it('should close delete modal after successful permanent delete', async () => {
      // Arrange: Show delete modal
      clientsComposable.showDeleteModal(mockActiveClient)
      expect(clientsComposable.showDeleteConfirmModal.value).toBe(true)
      expect(clientsComposable.clientToDelete.value?.id).toBe(mockActiveClient.id)

      // Act: Delete the client
      const result = await clientsComposable.deleteClient(mockActiveClient)

      // Assert: Modal should be closed
      expect(result.success).toBe(true)
      expect(clientsComposable.showDeleteConfirmModal.value).toBe(false)
      expect(clientsComposable.clientToDelete.value).toBeNull()
    })

    it('should close delete modal after successful archive', async () => {
      // Arrange: Show delete modal
      clientsComposable.showDeleteModal(mockActiveClient)
      expect(clientsComposable.showDeleteConfirmModal.value).toBe(true)

      // Act: Archive the client
      const result = await clientsComposable.archiveClient(mockActiveClient)

      // Assert: Modal should be closed
      expect(result.success).toBe(true)
      expect(clientsComposable.showDeleteConfirmModal.value).toBe(false)
      expect(clientsComposable.clientToDelete.value).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle delete errors gracefully without closing drawer', async () => {
      // Since we're in mock mode, we'll test error handling through the client store
      // The error case would be handled by the store's error handling logic
      
      // Arrange: Open drawer
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)

      // Act: Try to delete client with invalid ID (this should trigger error handling)
      const invalidClient = { ...mockActiveClient, id: undefined } as Client
      const result = await clientsComposable.deleteClient(invalidClient)

      // Assert: Should return error without closing drawer
      expect(result.success).toBe(false)
      expect(result.error).toContain('No client selected')
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)
    })

    it('should handle archive errors gracefully without closing drawer', async () => {
      // Arrange: Open drawer
      clientsComposable.handleClientClick(mockActiveClient)
      expect(clientsComposable.isDrawerOpen.value).toBe(true)

      // Act: Try to archive client with invalid ID (this should trigger error handling)
      const invalidClient = { ...mockActiveClient, id: undefined } as Client
      const result = await clientsComposable.archiveClient(invalidClient)

      // Assert: Should return error without closing drawer
      expect(result.success).toBe(false)
      expect(result.error).toContain('No client selected')
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      expect(clientsComposable.currentClient.value?.id).toBe(mockActiveClient.id)
    })
  })

  describe('Multiple Composable Instances (Shared State)', () => {
    it('should synchronize drawer closing across multiple composable instances', async () => {
      const composableA = useClients() // Simulates ClientList
      const composableB = useClients() // Simulates ClientsView

      // Arrange: Open drawer from instance A
      composableA.handleClientClick(mockActiveClient)
      expect(composableA.isDrawerOpen.value).toBe(true)
      expect(composableB.isDrawerOpen.value).toBe(true)

      // Act: Delete client from instance B
      const result = await composableB.deleteClient(mockActiveClient)

      // Assert: Both instances should see the drawer as closed
      expect(result.success).toBe(true)
      expect(composableA.isDrawerOpen.value).toBe(false)
      expect(composableB.isDrawerOpen.value).toBe(false)
      expect(composableA.currentClient.value).toBeNull()
      expect(composableB.currentClient.value).toBeNull()
    })
  })

  describe('Writable Computed Properties Fix', () => {
    it('should allow v-model binding on isDrawerOpen', () => {
      // This test ensures the fix for writable computed properties works
      
      // Test getter
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
      
      // Test setter (simulates v-model update from component)
      clientsComposable.isDrawerOpen.value = true
      expect(clientsComposable.isDrawerOpen.value).toBe(true)
      
      // Test setter back to false
      clientsComposable.isDrawerOpen.value = false
      expect(clientsComposable.isDrawerOpen.value).toBe(false)
    })

    it('should allow v-model binding on drawerPinned', () => {
      // Test getter
      expect(clientsComposable.drawerPinned.value).toBe(false)
      
      // Test setter (simulates v-model:pinned update from component)
      clientsComposable.drawerPinned.value = true
      expect(clientsComposable.drawerPinned.value).toBe(true)
      
      // Test setter back to false
      clientsComposable.drawerPinned.value = false
      expect(clientsComposable.drawerPinned.value).toBe(false)
    })

    it('should maintain reactivity across multiple instances for writable computed', () => {
      const composableA = useClients()
      const composableB = useClients()

      // Change drawer state from instance A
      composableA.isDrawerOpen.value = true
      
      // Both instances should see the change
      expect(composableA.isDrawerOpen.value).toBe(true)
      expect(composableB.isDrawerOpen.value).toBe(true)

      // Change pinned state from instance B
      composableB.drawerPinned.value = true
      
      // Both instances should see the change
      expect(composableA.drawerPinned.value).toBe(true)
      expect(composableB.drawerPinned.value).toBe(true)
    })
  })
})