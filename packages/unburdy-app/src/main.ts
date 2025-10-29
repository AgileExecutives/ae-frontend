// main.ts
import { createBaseApp } from '@agile-exec/core-frontend'
import { useAuthStore } from '@/stores/auth'
import MainApp from './App.vue'
import { extraRoutes } from './router/routes'
import './style.css' 

const app = createBaseApp(MainApp, { 
    routes: extraRoutes
})

// Mount the app
app.mount('#app')

// Initialize auth store after app is mounted
const authStore = useAuthStore()
authStore.initializeAuth()

