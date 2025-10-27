// main.ts
import { createBaseApp } from '@agile-exec/core-frontend'
import MainApp from './App.vue'
import { extraRoutes } from './router/routes'
import './style.css' 

const app = createBaseApp(MainApp, { 
    routes: extraRoutes
})

// Mount the app and initialize theme
app.mount('#app')

