/**
 * API Configuration for Unburdy App
 * 
 * Creates authenticated API client with Bearer token support
 */

import { AESaasApiClient } from '@agile-exec/api-client'

export interface ApiConfig {
  baseURL: string
}

// Get API configuration from environment variables
export const getApiConfig = (): ApiConfig => {
  const baseURL = import.meta.env.VITE_API_BASE_URL

  if (!baseURL) {
    throw new Error('VITE_API_BASE_URL environment variable is required')
  }

  return {
    baseURL
  }
}

// Create and configure API client instance with auth token
export const createApiClient = (): AESaasApiClient => {
  const config = getApiConfig()
  
  const client = new AESaasApiClient({
    baseURL: config.baseURL
  })

  // Set token if available in localStorage
  const token = localStorage.getItem('auth_token')
  if (token) {
    client.setToken(token)
  }
  
  return client
}

// Global API client instance - initialized lazily
let globalApiClient: AESaasApiClient | null = null

export const getApiClient = (): AESaasApiClient => {
  if (!globalApiClient) {
    globalApiClient = createApiClient()
  }
  return globalApiClient
}

// Update the global client token
export const updateApiClientToken = (token: string | null) => {
  if (globalApiClient) {
    if (token) {
      globalApiClient.setToken(token)
    } else {
      globalApiClient.clearToken()
    }
  }
}

// Reset the global client (useful for testing or reconfiguration)
export const resetApiClient = () => {
  globalApiClient = null
}