import { ref, readonly } from 'vue'

// ========== CLIENT CACHE COMPOSABLE (HOW) ==========
// Handles caching logic for client data

interface CacheState<T> {
  lastFetch: Date | null
  data: T[]
  isValid: boolean
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useClientCache = <T>() => {
  const cache = ref<CacheState<T>>({
    lastFetch: null,
    data: [],
    isValid: false
  })

  const isCacheValid = () => {
    if (!cache.value.lastFetch || !cache.value.isValid) return false
    const now = new Date()
    return (now.getTime() - cache.value.lastFetch.getTime()) < CACHE_DURATION
  }

  const updateCache = (newData: T[]) => {
    cache.value = {
      lastFetch: new Date(),
      data: [...newData],
      isValid: true
    }
  }

  const invalidateCache = () => {
    cache.value.isValid = false
  }

  const getCacheStatus = () => ({
    isValid: isCacheValid(),
    lastFetch: cache.value.lastFetch,
    itemCount: cache.value.data.length
  })

  return {
    cache: readonly(cache),
    isCacheValid,
    updateCache,
    invalidateCache,
    getCacheStatus
  }
}