import { describe, it, expect, beforeEach } from 'vitest'
import { useClients } from '@/composables/useClients'

describe('Client Drawer Integration', () => {
  let clientsComposableA: ReturnType<typeof useClients>
  let clientsComposableB: ReturnType<typeof useClients>

  beforeEach(() => {
    // Create two instances of the composable to simulate ClientList and ClientsView
    clientsComposableA = useClients()  // This simulates ClientList
    clientsComposableB = useClients()  // This simulates ClientsView
    
    // Reset state between tests
    clientsComposableA.closeClientDetails()
    clientsComposableA.setEditMode(false)
    clientsComposableA.setCurrentListSelection('active')
  })

  it('should share state between multiple composable instances', () => {
    // Initially, drawer should be closed in both instances
    expect(clientsComposableA.isDrawerOpen.value).toBe(false)
    expect(clientsComposableB.isDrawerOpen.value).toBe(false)

    // When ClientList (A) clicks a client, it should open the drawer
    const testClient = { 
      id: 1, 
      first_name: 'John', 
      last_name: 'Doe',
      status: 'active' as const
    }

    // Simulate clicking on a client in ClientList
    clientsComposableA.handleClientClick(testClient)

    // Both instances should now see the drawer as open
    expect(clientsComposableA.isDrawerOpen.value).toBe(true)
    expect(clientsComposableB.isDrawerOpen.value).toBe(true)

    // Both instances should see the same current client
    expect(clientsComposableA.currentClient.value).toEqual(testClient)
    expect(clientsComposableB.currentClient.value).toEqual(testClient)
  })

  it('should share drawer state changes from either component', () => {
    // Start with drawer closed
    expect(clientsComposableA.isDrawerOpen.value).toBe(false)
    expect(clientsComposableB.isDrawerOpen.value).toBe(false)

    // Open drawer from component A (ClientList)
    clientsComposableA.setDrawerOpen(true)

    // Both should see it as open
    expect(clientsComposableA.isDrawerOpen.value).toBe(true)
    expect(clientsComposableB.isDrawerOpen.value).toBe(true)

    // Close drawer from component B (ClientsView)
    clientsComposableB.closeClientDetails()

    // Both should see it as closed
    expect(clientsComposableA.isDrawerOpen.value).toBe(false)
    expect(clientsComposableB.isDrawerOpen.value).toBe(false)
  })

  it('should handle add client action and share edit mode state', () => {
    // Start in view mode
    expect(clientsComposableA.isEditMode.value).toBe(false)
    expect(clientsComposableB.isEditMode.value).toBe(false)

    // Trigger add client from component A
    clientsComposableA.handleAddClient()

    // Both should see drawer open and edit mode active
    expect(clientsComposableA.isDrawerOpen.value).toBe(true)
    expect(clientsComposableB.isDrawerOpen.value).toBe(true)
    expect(clientsComposableA.isEditMode.value).toBe(true)
    expect(clientsComposableB.isEditMode.value).toBe(true)

    // Both should see no current client (new client mode)
    expect(clientsComposableA.currentClient.value).toBeNull()
    expect(clientsComposableB.currentClient.value).toBeNull()
  })

  it('should share current list selection between instances', () => {
    // Initially both should show active clients
    expect(clientsComposableA.currentListSelection.value).toBe('active')
    expect(clientsComposableB.currentListSelection.value).toBe('active')

    // Change filter from component A
    clientsComposableA.handleStatusFilter('waiting')

    // Both should see the change
    expect(clientsComposableA.currentListSelection.value).toBe('waiting')
    expect(clientsComposableB.currentListSelection.value).toBe('waiting')

    // Change filter from component B
    clientsComposableB.setCurrentListSelection('archived')

    // Both should see the change
    expect(clientsComposableA.currentListSelection.value).toBe('archived')
    expect(clientsComposableB.currentListSelection.value).toBe('archived')
  })

  it('should share search query between instances', () => {
    // Initially both should have empty search
    expect(clientsComposableA.searchQuery.value).toBe('')
    expect(clientsComposableB.searchQuery.value).toBe('')

    // Set search query from component A (simulating user typing in ClientList)
    clientsComposableA.searchQuery.value = 'john'

    // Both should see the same search query
    expect(clientsComposableA.searchQuery.value).toBe('john')
    expect(clientsComposableB.searchQuery.value).toBe('john')

    // Set search query from component B
    clientsComposableB.searchQuery.value = 'jane'

    // Both should see the updated search query
    expect(clientsComposableA.searchQuery.value).toBe('jane')
    expect(clientsComposableB.searchQuery.value).toBe('jane')

    // Clear search query using setter method
    clientsComposableA.setSearchQuery('')

    // Both should see the cleared search query
    expect(clientsComposableA.searchQuery.value).toBe('')
    expect(clientsComposableB.searchQuery.value).toBe('')
  })

  it('should filter currentList based on search query', async () => {
    // First initialize with some mock data
    await clientsComposableA.ensureInitialized()
    
    // Should have clients initially (using mock data)
    expect(clientsComposableA.currentList.value.length).toBeGreaterThan(0)
    const initialCount = clientsComposableA.currentList.value.length

    // Set a search query that should filter results
    clientsComposableA.searchQuery.value = 'nonexistent'
    
    // The filtered list should be empty (no clients match 'nonexistent')
    expect(clientsComposableA.currentList.value.length).toBe(0)
    expect(clientsComposableB.currentList.value.length).toBe(0)

    // Clear search query - should see all clients again
    clientsComposableA.searchQuery.value = ''
    
    // Should have the original count back
    expect(clientsComposableA.currentList.value.length).toBe(initialCount)
    expect(clientsComposableB.currentList.value.length).toBe(initialCount)
  })
})