import { ref, computed } from 'vue'
import { getApiClient } from '@/config/api-config'
import { appConfig, MOCK_COST_PROVIDER_DATA } from '@/config/app-config'
import type { CostProvider } from '@agile-exec/api-client'

export const useCostProviders = () => {
  // State
  const costProviders = ref<CostProvider[]>([])
  const selectedCostProvider = ref<CostProvider | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Search and filter state
  const searchQuery = ref('')

  // API client
  const apiClient = getApiClient()

  // Cache for performance
  const cache = ref({
    lastFetch: null as Date | null,
    data: [] as CostProvider[],
    isValid: false
  })

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000

  // Check if cache is still valid
  const isCacheValid = () => {
    if (!cache.value.lastFetch || !cache.value.isValid) return false
    const now = new Date()
    return (now.getTime() - cache.value.lastFetch.getTime()) < CACHE_DURATION
  }

  // Filtered cost providers based on search
  const filteredCostProviders = computed(() => {
    if (!searchQuery.value.trim()) {
      return costProviders.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return costProviders.value.filter(provider => {
      const organization = (provider.organization || '').toLowerCase()
      const department = (provider.department || '').toLowerCase()
      const city = (provider.city || '').toLowerCase()
      const zip = (provider.zip || '').toLowerCase()
      
      return organization.includes(query) || 
             department.includes(query) || 
             city.includes(query) ||
             zip.includes(query)
    })
  })

  // Initialize on first use
  let initialized = false
  const ensureInitialized = async () => {
    if (!initialized) {
      await fetchCostProviders()
      initialized = true
    }
  }

  // Load cost providers with caching
  const fetchCostProviders = async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      console.log('💰 Using cached cost provider data')
      costProviders.value = [...cache.value.data]
      return
    }

    if (isLoading.value) {
      console.log('💰 Already loading cost providers, skipping...')
      return
    }

    isLoading.value = true
    error.value = null
    
    try {
      // Use mock data if MOCK_API is enabled
      if (appConfig.MOCK_API) {
        console.log('💰 Using mock cost provider data (MOCK_API enabled)')
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200))
        const mockProviders = MOCK_COST_PROVIDER_DATA.cost_providers as CostProvider[]
        costProviders.value = mockProviders
        
        // Update cache
        cache.value = {
          lastFetch: new Date(),
          data: [...mockProviders],
          isValid: true
        }
        return
      }

      // Use real API
      console.log('💰 Calling apiClient.getCostProviders...')
      const response = await apiClient.getCostProviders()
      console.log('💰 Response received:', response)
      
      // Handle different response structures
      let providersArray: CostProvider[] = []
      
      if (response && response.cost_providers && Array.isArray(response.cost_providers)) {
        // Direct API response format: { cost_providers: [...], pagination: {...} }
        providersArray = response.cost_providers
        console.log('💰 Using direct cost_providers array from API response:', providersArray.length, 'providers')
      } else if (response.success && response.data) {
        // Wrapped response format: { success: true, data: { cost_providers: [...] } }
        if (Array.isArray(response.data)) {
          providersArray = response.data
        } else if (response.data.cost_providers && Array.isArray(response.data.cost_providers)) {
          providersArray = response.data.cost_providers
        } else {
          console.error('💰 Unexpected wrapped response structure:', response.data)
          throw new Error('Invalid response format: expected cost providers array')
        }
      } else if (Array.isArray(response)) {
        // Handle direct array response
        providersArray = response
        console.log('💰 Using direct array response')
      } else {
        console.error('💰 Unexpected response structure:', response)
        throw new Error('Failed to fetch cost providers - invalid response structure')
      }
      
      console.log('💰 Cost providers array received:', providersArray.length, 'providers')
      costProviders.value = providersArray
      
      // Update cache
      cache.value = {
        lastFetch: new Date(),
        data: [...providersArray],
        isValid: true
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch cost providers'
      console.error('💰 Failed to fetch cost providers:', err)
      
      // Fallback to mock data on API error if not already using mock
      if (!appConfig.MOCK_API) {
        console.log('💰 API failed, falling back to mock data')
        const mockProviders = MOCK_COST_PROVIDER_DATA.cost_providers as CostProvider[]
        costProviders.value = mockProviders
      }
    } finally {
      isLoading.value = false
    }
  }

  // Create cost provider
  const createCostProvider = async (providerData: Partial<CostProvider>) => {
    isLoading.value = true
    error.value = null

    try {
      if (appConfig.MOCK_API) {
        // In mock mode, just add to the list with a temporary ID
        const newProvider = { ...providerData, id: Date.now() } as CostProvider
        costProviders.value.unshift(newProvider)
        
        // Update cache
        cache.value.data = [...costProviders.value]
        cache.value.lastFetch = new Date()
        cache.value.isValid = true
        
        return {
          success: true,
          data: newProvider
        }
      } else {
        // Use real API
        const response = await apiClient.createCostProvider(providerData)
        
        if (response.success && response.data) {
          // Add to the list
          costProviders.value.unshift(response.data)
          
          // Update cache
          cache.value.data = [...costProviders.value]
          cache.value.lastFetch = new Date()
          cache.value.isValid = true
          
          return {
            success: true,
            data: response.data
          }
        } else {
          throw new Error(response.error || 'Failed to create cost provider')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create cost provider'
      error.value = errorMessage
      console.error('💰 Failed to create cost provider:', err)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  // Update cost provider
  const updateCostProvider = async (id: number, providerData: Partial<CostProvider>) => {
    isLoading.value = true
    error.value = null

    try {
      if (appConfig.MOCK_API) {
        // In mock mode, update the provider in the list
        const index = costProviders.value.findIndex(p => p.id === id)
        if (index !== -1) {
          const updatedProvider = { ...costProviders.value[index], ...providerData } as CostProvider
          costProviders.value[index] = updatedProvider
          
          // Update selected provider if it's the same one
          if (selectedCostProvider.value?.id === id) {
            selectedCostProvider.value = updatedProvider
          }
        }
        
        // Update cache
        cache.value.data = [...costProviders.value]
        cache.value.lastFetch = new Date()
        cache.value.isValid = true
        
        return {
          success: true,
          data: index !== -1 ? costProviders.value[index] : null
        }
      } else {
        // Use real API
        const response = await apiClient.updateCostProvider(id, providerData)
        
        if (response.success && response.data) {
          // Update the provider in the list
          const index = costProviders.value.findIndex(p => p.id === id)
          if (index !== -1) {
            costProviders.value[index] = response.data
            
            // Update selected provider if it's the same one
            if (selectedCostProvider.value?.id === id) {
              selectedCostProvider.value = response.data
            }
          }
          
          // Update cache
          cache.value.data = [...costProviders.value]
          cache.value.lastFetch = new Date()
          cache.value.isValid = true
          
          return {
            success: true,
            data: response.data
          }
        } else {
          throw new Error(response.error || 'Failed to update cost provider')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cost provider'
      error.value = errorMessage
      console.error('💰 Failed to update cost provider:', err)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  // Delete cost provider
  const deleteCostProvider = async (id: number) => {
    isLoading.value = true
    error.value = null

    try {
      if (appConfig.MOCK_API) {
        console.log('💰 Mock delete cost provider with id:', id)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200))
        costProviders.value = costProviders.value.filter(p => p.id !== id)
      } else {
        // Use real API
        const response = await apiClient.deleteCostProvider(id)
        if (response.success) {
          costProviders.value = costProviders.value.filter(p => p.id !== id)
        } else {
          throw new Error('Failed to delete cost provider')
        }
      }
      
      // Clear selected provider if it was deleted
      if (selectedCostProvider.value?.id === id) {
        selectedCostProvider.value = null
      }
      
      // Update cache
      cache.value.data = [...costProviders.value]
      cache.value.lastFetch = new Date()
      cache.value.isValid = true
      
      return {
        success: true,
        data: { id }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cost provider'
      error.value = errorMessage
      console.error('💰 Failed to delete cost provider:', err)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  // Search cost providers
  const searchCostProviders = async (query: string) => {
    if (appConfig.MOCK_API) {
      // Use local filtering for mock data
      searchQuery.value = query
      return filteredCostProviders.value
    }

    // Use API search endpoint
    try {
      isLoading.value = true
      const response = await apiClient.searchCostProviders({ query })
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : response.data.cost_providers || []
      }
      return []
    } catch (err) {
      console.error('💰 Search failed:', err)
      error.value = err instanceof Error ? err.message : 'Search failed'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Utility functions
  const getCostProviderById = (id: number): CostProvider | undefined => {
    return costProviders.value.find(provider => provider.id === id)
  }

  const getCostProvidersByCity = (city: string): CostProvider[] => {
    return costProviders.value.filter(provider => 
      provider.city?.toLowerCase() === city.toLowerCase()
    )
  }

  const getCostProvidersByOrganization = (organization: string): CostProvider[] => {
    return costProviders.value.filter(provider => 
      provider.organization?.toLowerCase().includes(organization.toLowerCase())
    )
  }

  // Format cost provider for display
  const formatCostProviderDisplay = (provider: CostProvider): string => {
    return `${provider.organization} - ${provider.department}`
  }

  return {
    // State
    costProviders: computed(() => costProviders.value),
    filteredCostProviders,
    selectedCostProvider: computed(() => selectedCostProvider.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    searchQuery: computed(() => searchQuery.value),
    
    // Methods
    ensureInitialized,
    fetchCostProviders,
    createCostProvider,
    updateCostProvider,
    deleteCostProvider,
    searchCostProviders,
    
    // Utility functions
    getCostProviderById,
    getCostProvidersByCity,
    getCostProvidersByOrganization,
    formatCostProviderDisplay,
    
    // Cache management
    refreshCache: () => fetchCostProviders(true),
    getCacheStatus: () => ({
      isValid: isCacheValid(),
      lastFetch: cache.value.lastFetch,
      itemCount: cache.value.data.length
    }),
    
    // Setters for external control
    setSelectedCostProvider: (provider: CostProvider | null) => { selectedCostProvider.value = provider },
    setSearchQuery: (query: string) => { searchQuery.value = query }
  }
}