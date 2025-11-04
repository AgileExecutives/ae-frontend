import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCostProviders } from '@/composables/useCostProviders'

// Mock the API client and config
vi.mock('@/config/api-config', () => ({
  getApiClient: () => ({
    getCostProviders: vi.fn(),
    createCostProvider: vi.fn(),
    updateCostProvider: vi.fn(),
    deleteCostProvider: vi.fn(),
    searchCostProviders: vi.fn()
  })
}))

vi.mock('@/config/app-config', () => ({
  appConfig: {
    MOCK_API: true
  },
  MOCK_COST_PROVIDER_DATA: {
    cost_providers: [
      { 
        id: 1, 
        organization: 'Test Organization', 
        department: 'Test Department',
        city: 'Test City',
        zip: '12345'
      },
      { 
        id: 2, 
        organization: 'Another Org', 
        department: 'Another Dept',
        city: 'Another City',
        zip: '67890'
      }
    ]
  }
}))

describe('useCostProviders', () => {
  let costProvidersComposable: ReturnType<typeof useCostProviders>

  beforeEach(() => {
    costProvidersComposable = useCostProviders()
  })

  it('should initialize with empty state', () => {
    expect(costProvidersComposable.costProviders.value).toEqual([])
    expect(costProvidersComposable.selectedCostProvider.value).toBeNull()
    expect(costProvidersComposable.isLoading.value).toBe(false)
    expect(costProvidersComposable.error.value).toBeNull()
    expect(costProvidersComposable.searchQuery.value).toBe('')
  })

  it('should provide utility functions', () => {
    expect(typeof costProvidersComposable.getCostProviderById).toBe('function')
    expect(typeof costProvidersComposable.getCostProvidersByCity).toBe('function')
    expect(typeof costProvidersComposable.getCostProvidersByOrganization).toBe('function')
    expect(typeof costProvidersComposable.formatCostProviderDisplay).toBe('function')
  })

  it('should format cost provider display correctly', () => {
    const provider = {
      id: 1,
      organization: 'Test Org',
      department: 'Test Dept',
      city: 'Test City'
    } as any

    const formatted = costProvidersComposable.formatCostProviderDisplay(provider)
    expect(formatted).toBe('Test Org - Test Dept')
  })

  it('should provide setters for external control', () => {
    const mockProvider = { 
      id: 1, 
      organization: 'Test', 
      department: 'Dept' 
    } as any

    // Test setSelectedCostProvider
    costProvidersComposable.setSelectedCostProvider(mockProvider)
    expect(costProvidersComposable.selectedCostProvider.value).toEqual(mockProvider)

    // Test setSearchQuery
    costProvidersComposable.setSearchQuery('test query')
    expect(costProvidersComposable.searchQuery.value).toBe('test query')
  })

  it('should provide cache management functions', () => {
    expect(typeof costProvidersComposable.refreshCache).toBe('function')
    expect(typeof costProvidersComposable.getCacheStatus).toBe('function')
    
    const cacheStatus = costProvidersComposable.getCacheStatus()
    expect(cacheStatus).toHaveProperty('isValid')
    expect(cacheStatus).toHaveProperty('lastFetch')
    expect(cacheStatus).toHaveProperty('itemCount')
  })

  it('should provide CRUD operations', () => {
    expect(typeof costProvidersComposable.fetchCostProviders).toBe('function')
    expect(typeof costProvidersComposable.createCostProvider).toBe('function')
    expect(typeof costProvidersComposable.updateCostProvider).toBe('function')
    expect(typeof costProvidersComposable.deleteCostProvider).toBe('function')
    expect(typeof costProvidersComposable.searchCostProviders).toBe('function')
  })

  it('should have ensureInitialized method', () => {
    expect(typeof costProvidersComposable.ensureInitialized).toBe('function')
  })

  it('should filter cost providers based on search query', async () => {
    // Initialize with mock data first
    await costProvidersComposable.ensureInitialized()
    
    // Test filtering
    costProvidersComposable.setSearchQuery('Test Organization')
    
    const filtered = costProvidersComposable.filteredCostProviders.value
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered[0]?.organization).toContain('Test Organization')
  })
})