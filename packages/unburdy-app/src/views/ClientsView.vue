<template>
  <DrawerLayout>
    <RightDrawer
      v-model="isDrawerOpen"
      :title="selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'Client Details'"
      id="client-details-drawer"
      width="480px"
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
      </template>

      <template #form>
        <div v-if="selectedClient" class="space-y-6">
          <!-- Client Avatar and Basic Info -->
          <div class="text-center">
            <div class="avatar placeholder mb-4">
              <div 
                class="w-20 h-20 rounded-full text-white text-lg font-semibold flex items-center justify-center"
                :class="getAvatarData(selectedClient).colorClass"
              >
                {{ getAvatarData(selectedClient).initials }}
              </div>
            </div>
            <div class="text-sm opacity-70">
              Age: {{ selectedClient.date_of_birth ? calculateAge(selectedClient.date_of_birth) : 'N/A' }}
            </div>
            <div class="mt-2">
              <span 
                class="badge badge-lg capitalize"
                :class="getStatusBadge(selectedClient.status)"
              >
                {{ selectedClient.status }}
              </span>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Personal Information</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm opacity-70">Date of Birth:</span>
                <span class="text-sm">{{ selectedClient.date_of_birth }}</span>
              </div>
              <div v-if="selectedClient.email" class="flex justify-between">
                <span class="text-sm opacity-70">Email:</span>
                <span class="text-sm">{{ selectedClient.email }}</span>
              </div>
              <div v-if="selectedClient.phone" class="flex justify-between">
                <span class="text-sm opacity-70">Phone:</span>
                <span class="text-sm">{{ selectedClient.phone }}</span>
              </div>
            </div>
          </div>

          <!-- Contact Person -->
          <div v-if="selectedClient.contact_first_name || selectedClient.contact_last_name" class="space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Contact Person</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm opacity-70">Name:</span>
                <span class="text-sm">{{ selectedClient.contact_first_name }} {{ selectedClient.contact_last_name }}</span>
              </div>
              <div v-if="selectedClient.contact_email" class="flex justify-between">
                <span class="text-sm opacity-70">Email:</span>
                <span class="text-sm">{{ selectedClient.contact_email }}</span>
              </div>
              <div v-if="selectedClient.contact_phone" class="flex justify-between">
                <span class="text-sm opacity-70">Phone:</span>
                <span class="text-sm">{{ selectedClient.contact_phone }}</span>
              </div>
            </div>
          </div>

          <!-- Therapy Information -->
          <div v-if="selectedClient.therapy_title || selectedClient.provider_approval_code" class="space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Therapy Information</h4>
            <div class="space-y-2">
              <div v-if="selectedClient.therapy_title" class="flex justify-between">
                <span class="text-sm opacity-70">Title:</span>
                <span class="text-sm">{{ selectedClient.therapy_title }}</span>
              </div>
              <div v-if="selectedClient.provider_approval_code" class="flex justify-between">
                <span class="text-sm opacity-70">Approval Code:</span>
                <span class="text-sm">{{ selectedClient.provider_approval_code }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm opacity-70">Individual Invoicing:</span>
                <span class="text-sm">{{ selectedClient.invoiced_individually ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <button 
          v-if="selectedClient"
          class="btn btn-primary flex-1"
          @click="handleClientEdit(selectedClient)"
        >
          Edit Client
        </button>
        <button 
          v-if="selectedClient"
          class="btn btn-error btn-outline"
          @click="handleClientDelete(selectedClient)"
        >
          Delete
        </button>
      </template>
    </RightDrawer>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ClientList from '@/components/clients/ClientList.vue'
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
const clients = ref<Client[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

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
    const response = await apiClient.getClients({ page: 1, limit: 500 })
    if (response.success && response.data) {
      clients.value = Array.isArray(response.data) ? response.data : [response.data]
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

// Generate avatar initials and color
const getAvatarData = (client: Client) => {
  const initials = `${(client.first_name || '').charAt(0)}${(client.last_name || '').charAt(0)}`.toUpperCase()
  
  // Generate consistent color based on name
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
  ]
  
  const nameHash = ((client.first_name || '') + (client.last_name || '')).split('').reduce((acc: number, char: string) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  const colorClass = colors[nameHash % colors.length]
  
  return { initials, colorClass }
}

// Get status badge style
const getStatusBadge = (status: Client['status']) => {
  const badges: Record<string, string> = {
    waiting: 'badge-warning',
    active: 'badge-success', 
    archived: 'badge-neutral'
  }
  return badges[status || ''] || 'badge-ghost'
}

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string) => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Clients are now loaded from the API via the store

// Event handlers
const handleClientClick = (client: Client) => {
  console.log('Client clicked:', client)
  selectedClient.value = client
  isDrawerOpen.value = true
}

const closeClientDetails = () => {
  isDrawerOpen.value = false
  selectedClient.value = null
}

const handleClientEdit = (client: Client) => {
  console.log('Edit client:', client)
  // TODO: Open edit modal or navigate to edit form
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

const handleStatusFilter = (status: 'all' | 'waiting' | 'active' | 'archived') => {
  selectedStatus.value = status
  console.log('Status filter changed:', status)
}

const handleSearchChange = (query: string) => {
  searchQuery.value = query
  console.log('Search query changed:', query)
}

const handleAddClient = () => {
  console.log('Add new client')
  // TODO: Open add client modal or navigate to add form
}
</script>