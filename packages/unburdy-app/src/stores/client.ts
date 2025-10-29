import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type Client, type CreateClientRequest } from '@agile-exec/api-client'
import { getApiClient } from '@/config/api-config'

const apiClient = getApiClient()

export const useClientStore = defineStore('client', () => {
  const clients = ref<Client[]>([])
  const currentClient = ref<Client | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // TODO: Integrate auth token when auth store is properly built
  const updateToken = () => {
    // Future: Update API client with auth token
  }

  const fetchClients = async (): Promise<Client[]> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      const response = await apiClient.getClients()
      const data = response.success && response.data 
        ? (Array.isArray(response.data) ? response.data : [response.data])
        : []
      clients.value = data
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch clients'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchClient = async (id: number): Promise<Client> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      const response = await apiClient.getClient(id)
      if (response.success && response.data) {
        currentClient.value = response.data
        return response.data
      }
      throw new Error('Failed to fetch client data')
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch client'
      throw e
    } finally {
      loading.value = false
    }
  }

  const searchClients = async (query: string): Promise<Client[]> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      const response = await apiClient.searchClients({ q: query })
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [response.data]
      }
      return []
    } catch (e: any) {
      error.value = e.message || 'Failed to search clients'
      throw e
    } finally {
      loading.value = false
    }
  }

  const createClient = async (data: CreateClientRequest): Promise<Client> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      const response = await apiClient.createClient(data)
      if (response.success && response.data) {
        clients.value.push(response.data)
        return response.data
      }
      throw new Error('Failed to create client')
    } catch (e: any) {
      error.value = e.message || 'Failed to create client'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateClient = async (id: number, data: Partial<CreateClientRequest>): Promise<Client> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      const response = await apiClient.updateClient(id, data)
      if (response.success && response.data) {
        const client = response.data
        const index = clients.value.findIndex((c: Client) => c.id === id)
        if (index !== -1) {
          clients.value[index] = client
        }
        if (currentClient.value?.id === id) {
          currentClient.value = client
        }
        return client
      }
      throw new Error('Failed to update client')
    } catch (e: any) {
      error.value = e.message || 'Failed to update client'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteClient = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      await apiClient.deleteClient(id)
      clients.value = clients.value.filter((c: Client) => c.id !== id)
      if (currentClient.value?.id === id) {
        currentClient.value = null
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to delete client'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    clients,
    currentClient,
    loading,
    error,
    fetchClients,
    fetchClient,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
  }
})
