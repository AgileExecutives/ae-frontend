// Type declarations for @agile-exec/core-frontend
declare module '@agile-exec/core-frontend' {
  import type { Component, DefineComponent } from 'vue'
  import type { App } from 'vue'
  
  // Components
  export const ToastContainer: DefineComponent<{}, {}, any>
  export const LoginForm: DefineComponent<{}, {}, any>
  export const RegisterForm: DefineComponent<{}, {}, any>
  export const LogoutButton: DefineComponent<{}, {}, any>
  export const AuthLayout: DefineComponent<{}, {}, any>
  export const NotFoundCard: DefineComponent<{}, {}, any>
  export const LocaleSwitcher: DefineComponent<{}, {}, any>
  export const ThemeToggle: DefineComponent<{}, {}, any>
  
  // Functions
  export function createBaseApp(AppComponent: Component, options?: any): App
  
  // Stores
  export function useAuthStore(): any
  export function useToast(): any
  
  // Router
  export function addMiddleware(router: any): void
  export function createBaseRoutes(): any[]
  export function addCatchAllRoute(router: any): any
  
  // Composables
  export function useAuth(): any
  export function useApi(): any
  
  // Types
  export interface User {
    id: number
    username: string
    email: string
    role?: string
    first_name?: string
    last_name?: string
  }
  
  export interface LoginCredentials {
    username: string
    password: string
  }
  
  export interface RegisterData {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    company_name?: string
    accept_terms: boolean
  }
}