<template>
  <div class="drawer lg:drawer-open">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <!-- Mobile Navbar -->
      <div class="navbar bg-base-300/30 w-full lg:hidden">
        <div class="flex-none">
          <label for="drawer-toggle" aria-label="open sidebar" class="btn btn-square btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block h-6 w-6 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </label>
        </div>
        <div class="mx-2 flex-1 px-2 font-semibold text-lg">{{ pageTitle }}</div>
        <div class="flex-none" v-if="$route.path === '/calendar'">
          <div class="btn-group flex gap-1">
            <!-- Mobile: Day and Year only -->
            <button 
              class="btn btn-xs lg:hidden" 
              :class="{ 'btn-primary': activeView === 'day', 'btn-outline': activeView !== 'day' }"
              @click="setView('day')"
            >
              Day
            </button>
            <button 
              class="btn btn-xs lg:hidden" 
              :class="{ 'btn-primary': activeView === 'year', 'btn-outline': activeView !== 'year' }"
              @click="setView('year')"
            >
              Year
            </button>
            
            <!-- Desktop: Week, Month, Year -->
            <button 
              class="btn btn-xs hidden lg:inline-flex" 
              :class="{ 'btn-primary': activeView === 'week', 'btn-outline': activeView !== 'week' }"
              @click="setView('week')"
            >
              Week
            </button>
            <button 
              class="btn btn-xs hidden lg:inline-flex" 
              :class="{ 'btn-primary': activeView === 'month', 'btn-outline': activeView !== 'month' }"
              @click="setView('month')"
            >
              Month
            </button>
            <button 
              class="btn btn-xs hidden lg:inline-flex" 
              :class="{ 'btn-primary': activeView === 'year', 'btn-outline': activeView !== 'year' }"
              @click="setView('year')"
            >
              Year
            </button>
          </div>
        </div>
      </div>
      
      <!-- Page content here -->
      <div class="flex-1">
        <slot />
      </div>
    </div>
    <div class="drawer-side">
      <label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay lg:hidden"></label>
      <div class="pl-2 w-64 lg:w-14 lg:hover:w-64 bg-base-200/40 flex flex-col items-start min-h-full transition-all duration-300 group">
        
        <!-- Desktop Logo -->
        <div class="hidden lg:flex items-center justify-center w-full my-6 pr-2 border-b border-base-300/30">
          <!-- Collapsed state: small logo -->
          <div class="lg:group-hover:hidden pt-1">
            <img :src="unburdyLogoSmall" alt="Unburdy" class="w-8 h-8 dark:hidden" />
            <img :src="unburdyLogoSmallDark" alt="Unburdy" class="w-8 h-8 hidden dark:block" />
          </div>
          <!-- Expanded state: full logo -->
          <div class="hidden pt-1 lg:group-hover:block">
            <img :src="unburdyLogo" alt="Unburdy" class="h-8 dark:hidden" />
            <img :src="unburdyLogoDark" alt="Unburdy" class="h-8 hidden dark:block" />
          </div>
        </div>

        <!-- Sidebar content here -->
        <ul class="menu w-full grow">
          <!-- Dashboard -->
          <li>
            <router-link 
              to="/dashboard" 
              class="tooltip tooltip-right lg:group-hover:tooltip-none" 
              data-tip="Dashboard"
              :class="{ 'active': $route.path === '/dashboard' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="inline-block size-4 my-1.5">
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span class="lg:hidden lg:group-hover:inline">Dashboard</span>
            </router-link>
          </li>

          <!-- Calendar -->
          <li>
            <router-link 
              to="/calendar" 
              class="tooltip tooltip-right lg:group-hover:tooltip-none" 
              data-tip="Calendar"
              :class="{ 'active': $route.path === '/calendar' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="inline-block size-4 my-1.5">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
              <span class="lg:hidden lg:group-hover:inline">Calendar</span>
            </router-link>
          </li>

          <!-- Clients -->
          <li>
            <router-link 
              to="/clients" 
              class="tooltip tooltip-right lg:group-hover:tooltip-none" 
              data-tip="Clients"
              :class="{ 'active': $route.path === '/clients' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="inline-block size-4 my-1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span class="lg:hidden lg:group-hover:inline">Clients</span>
            </router-link>
          </li>

          <!-- Invoices -->
          <li>
            <router-link 
              to="/invoices" 
              class="tooltip tooltip-right lg:group-hover:tooltip-none" 
              data-tip="Invoices"
              :class="{ 'active': $route.path === '/invoices' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="inline-block size-4 my-1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <span class="lg:hidden lg:group-hover:inline">Invoices</span>
            </router-link>
          </li>

          <!-- Settings -->
          <li>
            <router-link 
              to="/settings" 
              class="tooltip tooltip-right lg:group-hover:tooltip-none" 
              data-tip="Settings"
              :class="{ 'active': $route.path === '/settings' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="inline-block size-4 my-1.5">
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
              <span class="lg:hidden lg:group-hover:inline">Settings</span>
            </router-link>
          </li>
        </ul>

        <!-- Bottom section with toggles -->
        <div class="flex flex-col gap-2 p-2">
          <!-- Mobile: Show with labels -->
          <div class="lg:hidden">
            <div class="divider text-xs">Preferences</div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">Theme</span>
                <ThemeToggle />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Language</span>
                <LocaleSwitcher />
              </div>
            </div>
          </div>
          
          <!-- Desktop: Icon-only with tooltips at bottom -->
          <div class="hidden lg:flex flex-col gap-2">
            <!-- Theme Toggle -->
            <div class="tooltip tooltip-right group-hover:tooltip-none" data-tip="Theme">
              <ThemeToggle />
            </div>

            <!-- Locale Toggle -->
            <div class="tooltip tooltip-right group-hover:tooltip-none" data-tip="Language">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from '@unburdy/base-app/components/ThemeToggle.vue'
import LocaleSwitcher from '@/components/LocaleSwitcher.vue'
// Import logos
import unburdyLogo from '@/assets/logo-color.svg'
import unburdyLogoDark from '@/assets/logo-color-dark.svg'
import unburdyLogoSmall from '@/assets/logo-color-small.svg'
import unburdyLogoSmallDark from '@/assets/logo-color-small-dark.svg'

const props = withDefaults(defineProps<{
  activeView?: 'week' | 'month' | 'year' | 'day'
}>(), {
  activeView: 'week'
})

const emit = defineEmits<{
  viewChange: [view: 'week' | 'month' | 'year' | 'day']
}>()

const route = useRoute()

// Get page title from route name or path
const pageTitle = computed(() => {
  const routeName = route.name as string || route.path
  
  // Convert route names to display titles
  const titleMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'calendar': 'Calendar',
    'clients': 'Clients',
    'invoices': 'Invoices',
    'settings': 'Settings',
    '/dashboard': 'Dashboard',
    '/calendar': 'Calendar',
    '/clients': 'Clients',
    '/invoices': 'Invoices',
    '/settings': 'Settings'
  }
  
  return titleMap[routeName.toLowerCase()] || 'Calendar App'
})

const setView = (view: 'week' | 'month' | 'year' | 'day') => {
  emit('viewChange', view)
}
</script>

<style scoped>
/* Custom responsive drawer behavior */
@media (min-width: 1024px) {
  .group:hover .lg\:group-hover\:inline {
    display: inline !important;
  }
  
  .group:hover .lg\:group-hover\:tooltip-none {
    --tooltip-color: transparent;
    --tooltip-text-color: transparent;
  }
}
</style>