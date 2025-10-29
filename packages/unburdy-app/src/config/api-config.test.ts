/**
 * API Configuration Test
 * 
 * Simple test to verify environment variable configuration
 */

import { getApiConfig, getApiClient } from './api-config'

// Test function to verify configuration
export const testApiConfig = () => {
  try {
    const config = getApiConfig()
    console.log('✅ API Configuration loaded successfully:', config)
    
    const client = getApiClient()
    console.log('✅ API Client created successfully')
    
    return { success: true, config }
  } catch (error) {
    console.error('❌ API Configuration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Auto-test when module loads (only in development)
if (import.meta.env.DEV) {
  testApiConfig()
}