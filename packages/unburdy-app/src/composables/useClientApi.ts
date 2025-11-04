import { getApiClient } from '@/config/api-config'
import { appConfig, MOCK_CLIENT_DATA } from '@/config/app-config'
import type { Client } from '@agile-exec/api-client'

// ========== CLIENT API COMPOSABLE (HOW) ==========
// Handles all API operations for clients

export const useClientApi = () => {
  const apiClient = getApiClient()

  const fetchClients = async (): Promise<Client[]> => {
    // Use mock data if MOCK_API is enabled
    if (appConfig.MOCK_API) {
      console.log('👥 Using mock client data (MOCK_API enabled)')
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      return MOCK_CLIENT_DATA.clients as Client[]
    }

    // Use real API
    console.log('👥 Calling apiClient.getClients...')
    const response = await apiClient.getClients({ page: 1, limit: 1000 })
    console.log('👥 Response received:', response)
    
    // Handle wrapped API response
    if (response && response.success && response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('👥 Clients array received:', response.data.data.length, 'clients')
      return response.data.data
    } else {
      console.error('👥 Unexpected response structure:', response)
      const errorMessage = response?.message || 'Invalid response format: expected wrapped clients data'
      throw new Error(errorMessage)
    }
  }

  const createClient = async (clientData: Partial<Client>): Promise<Client> => {
    if (appConfig.MOCK_API) {
      // In mock mode, create client with temporary ID
      await new Promise(resolve => setTimeout(resolve, 200))
      const newClient = { ...clientData, id: Date.now() } as Client
      return newClient
    }

    // Clean up the data before sending to API
    const cleanData: any = { ...clientData }
    
    // Remove undefined/null id for new clients
    if (cleanData.hasOwnProperty('id') && !cleanData.id) {
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

    const response = await apiClient.createClient(cleanData)
    
    // Handle wrapped API response
    if (response && response.success && response.data) {
      return response.data
    } else {
      const errorMessage = response?.message || response?.error || 'Failed to create client'
      throw new Error(errorMessage)
    }
  }

  const updateClient = async (id: number, clientData: Partial<Client>): Promise<Client> => {
    if (appConfig.MOCK_API) {
      // In mock mode, simulate update
      await new Promise(resolve => setTimeout(resolve, 200))
      return { ...clientData, id } as Client
    }

    // Clean up the data before sending to API
    const cleanData: any = { ...clientData }
    
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

    const response = await apiClient.updateClient(id, cleanData)
    
    // Handle wrapped API response
    if (response && response.success && response.data) {
      return response.data
    } else {
      const errorMessage = response?.message || response?.error || 'Failed to update client'
      throw new Error(errorMessage)
    }
  }

  const deleteClient = async (id: number): Promise<void> => {
    if (appConfig.MOCK_API) {
      console.log('👥 Mock delete client with id:', id)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      return
    }

    const response = await apiClient.deleteClient(id)
    
    // Handle wrapped API response
    if (response && response.success) {
      return
    } else {
      const errorMessage = (response as any)?.message || 'Failed to delete client'
      throw new Error(errorMessage)
    }
  }

  return {
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  }
}