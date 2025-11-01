<template>
  <DrawerLayout>
    <RightDrawer
      v-model="isDrawerOpen"
      :title="drawerTitle"
      id="client-details-drawer"
      v-model:pinned="drawerPinned"
      @close="closeClientDetails"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 lg:px-4">
          <ViewHeader title="Clients">
            <template #buttons>
              <button class="btn btn-primary" @click="handleAddClient">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Client
              </button>
            </template>
          </ViewHeader>
          
          <!-- Client List Component -->
          <div class="flex-1 min-h-0">
            <ClientList
              :clients="clients"
              :search-query="searchQuery"
              :selected-status="selectedStatus"
              @client-click="handleClientClick"
              @client-edit="handleClientEdit"
              @client-delete="handleClientDelete"
              @status-filter="handleStatusFilter"
              @search-change="handleSearchChange"
            />
          </div>
        </div>
        
        <!-- Mobile Floating Action Button -->
        <button 
          class="btn btn-primary btn-circle fixed bottom-6 right-6 z-50 lg:hidden shadow-lg"
          @click="handleAddClient"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </template>

      <template #form>
        <div v-if="(selectedClient || isEditMode) && isDrawerOpen" class="h-full flex flex-col">
          <ClientDetail 
            v-if="!isEditMode"
            :client="selectedClient"
            @edit="editClient"
            @delete="client => showDeleteModal(client)"
            @cancel="closeClientDetails"
          />
          <ClientEdit 
            v-else
            :client="selectedClient"
            @save="saveClient"
            @cancel="cancelEdit"
            @name-change="handleNameChange"
          />
        </div>
      </template>
    </RightDrawer>

    <!-- Delete/Archive Modal -->
    <div class="modal" :class="{ 'modal-open': showDeleteConfirmModal }" id="delete-confirm-modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">What would you like to do with this client?</h3>
        <div v-if="clientToDelete" class="py-4">
          <p class="mb-4">
            Choose how to handle <strong>{{ clientToDelete.first_name }} {{ clientToDelete.last_name }}</strong>:
          </p>
          <div class="space-y-3">
            <div class="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="font-bold">Archive Client (Recommended)</h4>
                <p class="text-sm">Client data is preserved but hidden from active lists. Can be restored later.</p>
              </div>
            </div>
            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 class="font-bold">Permanently Delete</h4>
                <p class="text-sm">All client data will be permanently removed. This action cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-action">
          <button 
            class="btn btn-outline" 
            @click="closeDeleteModal"
          >
            Cancel
          </button>
          <button 
            class="btn btn-warning" 
            @click="permanentlyDeleteClient"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Forever
          </button>
          <button 
            class="btn btn-primary" 
            @click="archiveClient"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8l6 6 6-6" />
            </svg>
            Archive Client
          </button>
        </div>
      </div>
    </div>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ClientList from '@/components/clients/ClientList.vue'
import ClientDetail from '@/components/clients/ClientDetail.vue'
import ClientEdit from '@/components/clients/ClientEdit.vue'
import ViewHeader from '@/components/ViewHeader.vue'
import RightDrawer from '@/components/RightDrawer.vue'
import { getApiClient } from '@/config/api-config'
import { appConfig, MOCK_CLIENT_DATA } from '@/config/app-config'
import type { Client } from '@agile-exec/api-client'

// Get API client instance using environment configuration
const apiClient = getApiClient()

// State
const searchQuery = ref('')
const selectedStatus = ref<'all' | 'waiting' | 'active' | 'archived'>('active')
const isDrawerOpen = ref(false)
const selectedClient = ref<Client | null>(null)
const drawerPinned = ref(false)
const isEditMode = ref(false)
const clients = ref<Client[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showDeleteConfirmModal = ref(false)
const clientToDelete = ref<Client | null>(null)

// Computed drawer title that updates based on selected client and edit mode
const drawerTitle = computed(() => {
  if (!selectedClient.value) {
    return isEditMode.value ? 'New Client' : 'Client Details'
  }
  
  const firstName = selectedClient.value.first_name || ''
  const lastName = selectedClient.value.last_name || ''
  
  if (!firstName && !lastName) {
    return isEditMode.value ? 'New Client' : 'Client Details'
  }
  
  return `${firstName} ${lastName}`.trim()
})

// Load clients when component mounts
onMounted(async () => {
  await fetchClients()
})

// API methods
const fetchClients = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Use mock data if MOCK_API is enabled
    if (appConfig.MOCK_API) {
      console.log('Using mock client data (MOCK_API enabled)')
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      clients.value = MOCK_CLIENT_DATA.clients as Client[]
      return
    }

    // Use real API
    console.log('🚀 ClientsView - Calling apiClient.getClients...')
    const response = await apiClient.getClients({ page: 1, limit: 500 })
    console.log('📦 ClientsView - Response received:', response)
    console.log('📦 ClientsView - Response.success:', response.success)
    console.log('📦 ClientsView - Response.data:', response.data)
    console.log('📦 ClientsView - Response.data is array:', Array.isArray(response.data))
    
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        console.log('✅ ClientsView - Clients array received:', response.data.length, 'clients')
        clients.value = response.data
      } else if (response.data.clients && Array.isArray(response.data.clients)) {
        console.log('✅ ClientsView - Clients nested array received:', response.data.clients.length, 'clients')
        clients.value = response.data.clients
      } else {
        console.error('❌ ClientsView - Unexpected response structure:', response.data)
        throw new Error('Invalid response format: expected clients array')
      }
    } else {
      throw new Error(response.error || 'Failed to fetch clients')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch clients'
    console.error('Failed to fetch clients:', err)
    
    // Fallback to mock data on API error if not already using mock
    if (!appConfig.MOCK_API) {
      console.log('API failed, falling back to mock data')
      clients.value = MOCK_CLIENT_DATA.clients as Client[]
    }
  } finally {
    loading.value = false
  }
}

const deleteClientApi = async (id: number) => {
  loading.value = true
  try {
    // Use mock behavior if MOCK_API is enabled
    if (appConfig.MOCK_API) {
      console.log(`Mock delete client with id: ${id}`)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      clients.value = clients.value.filter((c: Client) => c.id !== id)
      return
    }

    // Use real API
    const response = await apiClient.deleteClient(id)
    if (response.success) {
      clients.value = clients.value.filter((c: Client) => c.id !== id)
    } else {
      throw new Error(response.error || 'Failed to delete client')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete client'
    throw err
  } finally {
    loading.value = false
  }
}

const saveClient = async (clientData?: Partial<Client>) => {
  // Use the form data passed from ClientEdit, or fall back to selectedClient
  const dataToSave = clientData || selectedClient.value
  if (!dataToSave) return
  console.log('saveClient', dataToSave)
  try {
    const id = (dataToSave.hasOwnProperty('id') && dataToSave.id ? dataToSave.id : 0)
    if (appConfig.MOCK_API) {
      // In mock mode, just update the client in the list
      if (id === 0) {
        // Creating new client - add to the list with a temporary ID
        const newClient = { ...dataToSave, id: Date.now() } as Client
        clients.value.unshift(newClient)
        selectedClient.value = newClient
      } else {
        // Updating existing client
        const index = clients.value.findIndex((c: Client) => c.id === id)
        if (index !== -1) {
          clients.value[index] = { ...clients.value[index], ...dataToSave } as Client
          selectedClient.value = clients.value[index]
        }
      }
    } else {
      // Use real API to update client status
      var response
      if (id === 0) {
        response = await apiClient.createClient({
          ...dataToSave
        })
      } else {
        response = await apiClient.updateClient(id, {
          ...dataToSave
        })
      }
      if (response.success && response.data) {
        if (id === 0) {
          // Creating new client - add to the list
          clients.value.unshift(response.data)
          selectedClient.value = response.data
        } else {
          // Update existing client in the list
          const index = clients.value.findIndex((c: Client) => c.id === id)
          if (index !== -1) {
            clients.value[index] = response.data
            // Update selected client if it's the same one
            if (selectedClient.value?.id === response.data.id) {
              selectedClient.value = response.data
            }
          }
        }
      } else {
        throw new Error(response.error || 'Failed to save client')
      }
    }
    isEditMode.value = false
  } catch (error) {
    console.error('Failed to update client:', error)
  }
}

const archiveClient = async () => {
  if (!clientToDelete.value?.id) return
  
  loading.value = true
  try {
    if (appConfig.MOCK_API) {
      // In mock mode, update the client status to archived
      const index = clients.value.findIndex((c: Client) => c.id === clientToDelete.value!.id)
      if (index !== -1) {
        clients.value[index] = { ...clients.value[index], status: 'archived' }
        // Update selected client if it's the same one
        if (selectedClient.value?.id === clientToDelete.value.id) {
          selectedClient.value = clients.value[index]
        }
      }
    } else {
      // Use real API to update client status
      const response = await apiClient.updateClient(clientToDelete.value.id, {
        ...clientToDelete.value,
        status: 'archived'
      })
      if (response.success && response.data) {
        // Update the client in the list
        const index = clients.value.findIndex((c: Client) => c.id === clientToDelete.value!.id)
        if (index !== -1) {
          clients.value[index] = response.data
          // Update selected client if it's the same one
          if (selectedClient.value?.id === clientToDelete.value.id) {
            selectedClient.value = response.data
          }
        }
      } else {
        throw new Error(response.error || 'Failed to archive client')
      }
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to archive client:', error)
    alert('Failed to archive client. Please try again.')
  } finally {
    loading.value = false
  }
}

const permanentlyDeleteClient = async () => {
  if (!clientToDelete.value?.id) return
  
  loading.value = true
  try {
    await deleteClientApi(clientToDelete.value.id)
    // Close the drawer if the deleted client was selected
    if (selectedClient.value?.id === clientToDelete.value.id) {
      closeClientDetails()
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete client:', error)
    alert('Failed to delete client. Please try again.')
  } finally {
    loading.value = false
  }
}

const handleClientDelete = async (client: Client) => {
  console.log('Delete client:', client)
  if (confirm(`Are you sure you want to delete ${client.first_name} ${client.last_name}?`)) {
    try {
      if (client.id) {
        await deleteClientApi(client.id)
        // Close the drawer if the deleted client was selected
        if (selectedClient.value?.id === client.id) {
          closeClientDetails()
        }
      }
    } catch (error) {
      console.error('Failed to delete client:', error)
      alert('Failed to delete client. Please try again.')
    }
  }
}

// UI State Event handlers
const handleAddClient = () => {
  console.log('Add new client')
  selectedClient.value = null
  isDrawerOpen.value = true
  isEditMode.value = true
}

const handleClientEdit = (client: Client) => {
  console.log('Edit client:', client)
  selectedClient.value = { ...client }
  isDrawerOpen.value = true
  isEditMode.value = true
}

const handleClientClick = (client: Client) => {
  console.log('Client clicked:', client)
  selectedClient.value = client
  isDrawerOpen.value = true
  isEditMode.value = false
}

const closeClientDetails = () => {
  isDrawerOpen.value = false
  selectedClient.value = null
  isEditMode.value = false
}

const handleNameChange = (firstName: string, lastName: string) => {
  if (selectedClient.value) {
    selectedClient.value = {
      ...selectedClient.value,
      first_name: firstName,
      last_name: lastName
    }
  } else if (isEditMode.value) {
    // If we're creating a new client, create a temporary client object for the title
    selectedClient.value = {
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
  // If we were creating a new client (no selectedClient or selectedClient has no id), close the drawer completely
  if (!selectedClient.value || !selectedClient.value.id) {
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


const handleStatusFilter = (status: 'all' | 'waiting' | 'active' | 'archived') => {
  selectedStatus.value = status
  console.log('Status filter changed:', status)
}

const handleSearchChange = (query: string) => {
  searchQuery.value = query
  console.log('Search query changed:', query)
}


</script>