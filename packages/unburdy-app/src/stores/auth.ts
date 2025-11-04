/**
 * Auth Store for Unburdy App
 * 
 * Manages authentication state and integrates with API client
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getApiClient, updateApiClientToken, resetApiClient } from '@/config/api-config'

interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
}

interface LoginCredentials {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userDisplayName = computed(() => {
    if (!user.value) return null
    const { first_name, last_name, username } = user.value
    if (first_name && last_name) {
      return `${first_name} ${last_name}`
    }
    return username
  })

  // Actions
  const setToken = (newToken: string | null) => {
    token.value = newToken
    
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
    
    // Update API client token
    updateApiClientToken(newToken)
  }

  const setUser = (newUser: User | null) => {
    user.value = newUser
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('user')
    }
  }

  const setError = (newError: string | null) => {
    error.value = newError
  }

  const clearAuth = () => {
    setUser(null)
    setToken(null)
    setError(null)
    resetApiClient()
    initialized.value = false
  }

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      isLoading.value = true
      setError(null)

      const apiClient = getApiClient()
      const response = await apiClient.login(credentials)

      // Handle wrapped API response
      if (response && response.success && response.data && response.data.token && response.data.user) {
        setToken(response.data.token)
        setUser(response.data.user as User)
      } else {
        const errorMessage = response?.message || 'Invalid response from server'
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      setError(err.message || 'Login failed')
      clearAuth()
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      setError(null)

      const apiClient = getApiClient()
      
      // Try to logout from server, but don't fail if it doesn't work
      try {
        await apiClient.logout()
      } catch (err) {
        console.warn('Server logout failed, clearing local auth anyway', err)
      }
    } catch (err: any) {
      console.error('Logout error:', err)
      setError(err.message || 'Logout failed')
    } finally {
      clearAuth()
      isLoading.value = false
    }
  }

  const getCurrentUser = async (): Promise<User> => {
    try {
      isLoading.value = true
      setError(null)

      const apiClient = getApiClient()
      const response = await apiClient.getCurrentUser()
      
      // Handle wrapped API response
      if (response && response.success && response.data) {
        const userData = response.data
        setUser(userData as User)
        return userData as User
      } else {
        throw new Error('Failed to get user data')
      }
    } catch (err: any) {
      console.error('Failed to get current user:', err)
      
      // If token is invalid, clear auth
      if (err.status === 401) {
        clearAuth()
      }
      
      setError(err.message || 'Failed to get user data')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuth = async (): Promise<void> => {
    if (initialized.value) return

    try {
      console.log('Initializing authentication...')
      
      // Check for stored token and user
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user')
      
      if (!storedToken) {
        console.log('No stored token found')
        initialized.value = true
        return
      }

      console.log('Found stored token, validating...')
      
      // Set token and user from storage
      setToken(storedToken)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          // Invalid user data, will validate with server
        }
      }
      
      // Validate token by getting current user
      await getCurrentUser()
      
      console.log('Authentication initialized successfully')
    } catch (err: any) {
      console.error('Auth initialization failed:', err)
      clearAuth()
    } finally {
      initialized.value = true
    }
  }

  const refreshAuth = async (): Promise<void> => {
    if (!isAuthenticated.value) {
      throw new Error('Not authenticated')
    }

    await getCurrentUser()
  }

  return {
    // State
    user: computed(() => user.value),
    token: computed(() => token.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    initialized: computed(() => initialized.value),
    
    // Getters
    isAuthenticated,
    userDisplayName,
    
    // Actions
    login,
    logout,
    getCurrentUser,
    initializeAuth,
    refreshAuth,
    clearAuth,
    setError
  }
})