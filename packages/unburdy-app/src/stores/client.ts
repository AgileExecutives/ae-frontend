import { defineStore } from 'pinia'
import { ref } from 'vue'
import UnburdyApiClient, { type Client, type CreateClientRequest } from '@agile-exec/api-client'
import { useAuthStore } from '@agile-exec/core-frontend'

const apiClient = new UnburdyApiClient({
  baseURL: 'http://localhost:8080/api/v1',
})

export const useClientStore = defineStore('client', () => {
  const clients = ref<Client[]>([])
  const currentClient = ref<Client | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  // Update token when auth store changes
  const updateToken = () => {
    if (authStore.token) {
      apiClient.setToken(authStore.token)
    } else {
      apiClient.clearToken()
    }
  }

  const fetchClients = async (): Promise<Client[]> => {
    loading.value = true
    error.value = null
    try {
      updateToken()
      const data = await apiClient.getClients()
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
      const data = await apiClient.getClient(id)
      currentClient.value = data
      return data
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
      const response = await apiClient.get<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`)
      return response.data
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
      const client = await apiClient.createClient(data)
      clients.value.push(client)
      return client
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
      const client = await apiClient.updateClient(id, data)
      const index = clients.value.findIndex((c: Client) => c.id === id)
      if (index !== -1) {
        clients.value[index] = client
      }
      if (currentClient.value?.id === id) {
        currentClient.value = client
      }
      return client
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
