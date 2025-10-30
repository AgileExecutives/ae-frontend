<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, Users, Plus, Search } from 'lucide-vue-next'
import ViewCard from '../ViewCard.vue'
import type { Client } from '@agile-exec/api-client'

const props = withDefaults(defineProps<{
  clients?: Client[]
  searchQuery?: string
  selectedStatus?: 'all' | 'waiting' | 'active' | 'archived'
}>(), {
  clients: () => [],
  searchQuery: '',
  selectedStatus: 'active'
})

const emit = defineEmits<{
  clientClick: [client: Client]
  clientEdit: [client: Client]
  clientDelete: [client: Client]
  statusFilter: [status: 'all' | 'waiting' | 'active' | 'archived']
  searchChange: [query: string]
}>()

// Local state
const selectedClients = ref<Set<number>>(new Set())
const searchInput = ref(props.searchQuery)
const statusFilter = ref(props.selectedStatus)

// Screen size detection
const isMobile = ref(false)
const updateScreenSize = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
})

// Generate avatar initials and color
const getAvatarData = (client: Client) => {
  const initials = `${(client.first_name || '').charAt(0)}${(client.last_name || '').charAt(0)}`.toUpperCase()
  
  // Generate consistent color based on name
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
  ]
  
  const nameHash = ((client.first_name || '') + (client.last_name || '')).split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  const colorClass = colors[nameHash % colors.length]
  
  return { initials, colorClass }
}

// Get status badge style
const getStatusBadge = (status?: string) => {
  const badges: Record<string, string> = {
    waiting: 'badge-warning',
    active: 'badge-success', 
    archived: 'badge-neutral'
  }
  return badges[status || ''] || 'badge-ghost'
}

// Filtered clients based on search and status
const filteredClients = computed(() => {
  if (!props.clients) return []
  
  let filtered = props.clients.filter(client => {
    const query = props.searchQuery?.toLowerCase() || ''
    const matchesSearch = !query || (
      (client.first_name || '').toLowerCase().includes(query) ||
      (client.last_name || '').toLowerCase().includes(query) ||
      (client.email || '').toLowerCase().includes(query) ||
      (client.phone || '').toLowerCase().includes(query)
    )
    const matchesStatus = !props.selectedStatus || props.selectedStatus === 'all' || (client.status || '') === props.selectedStatus
    
    return matchesSearch && matchesStatus
  })
  
  return filtered
})

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string) => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Toggle client selection
const toggleClientSelection = (clientId?: number) => {
  if (!clientId) return
  if (selectedClients.value.has(clientId)) {
    selectedClients.value.delete(clientId)
  } else {
    selectedClients.value.add(clientId)
  }
}

// Toggle all clients selection
const toggleAllClients = () => {
  if (selectedClients.value.size === filteredClients.value.length) {
    selectedClients.value.clear()
  } else {
    selectedClients.value = new Set(filteredClients.value.map(client => client.id).filter((id): id is number => id !== undefined))
  }
}

// Event handlers
const handleClientClick = (client: Client) => {
  emit('clientClick', client)
}

const handleClientEdit = (client: Client) => {
  emit('clientEdit', client)
}

const handleClientDelete = (client: Client) => {
  emit('clientDelete', client)
}

const handleStatusFilter = (status: 'all' | 'waiting' | 'active' | 'archived') => {
  statusFilter.value = status
  emit('statusFilter', status)
}

const handleDropdownChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  if (target) {
    handleStatusFilter(target.value as 'all' | 'waiting' | 'active' | 'archived')
  }
}

const handleSearchChange = () => {
  emit('searchChange', searchInput.value)
}

const handleBulkDelete = () => {
  const selectedIds = Array.from(selectedClients.value)
  const clientsToDelete = props.clients.filter(client => client.id && selectedIds.includes(client.id))
  
  if (clientsToDelete.length === 0) return
  
  const names = clientsToDelete.map(c => `${c.first_name} ${c.last_name}`).join(', ')
  const message = clientsToDelete.length === 1 
    ? `Are you sure you want to delete ${names}?`
    : `Are you sure you want to delete ${clientsToDelete.length} clients: ${names}?`
  
  if (confirm(message)) {
    // Emit delete events for each selected client
    clientsToDelete.forEach(client => {
      emit('clientDelete', client)
    })
    // Clear selection after deletion
    selectedClients.value.clear()
  }
}

// Client count by status
const clientCounts = computed(() => {
  const counts = {
    all: props.clients.length,
    waiting: 0,
    active: 0,
    archived: 0
  }
  
  props.clients.forEach(client => {
    if (client.status && client.status in counts) {
      (counts as any)[client.status]++
    }
  })
  
  return counts
})

// Format date to locale string
const localeDatesString = (date: string) => {
    return new Date(date).toLocaleDateString()
}   

// Dynamic title based on selected status - hidden on mobile
const dynamicTitle = computed(() => {
  // Hide title on mobile
  if (isMobile.value) {
    return ''
  }
  
  const statusTitles = {
    all: 'Clients',
    waiting: 'Waiting List', 
    active: 'Active Clients',
    archived: 'Archived Clients'
  }
  const baseTitle = statusTitles[props.selectedStatus] || 'Clients'
  return `${baseTitle} (${filteredClients.value.length})`
})

// Status options for dropdown
const statusOptions = computed(() => [
  { value: 'active', label: 'Active', count: clientCounts.value.active },
  { value: 'waiting', label: 'Waiting', count: clientCounts.value.waiting },
  { value: 'archived', label: 'Archived', count: clientCounts.value.archived }
])

// Current status label for dropdown display
const currentStatusLabel = computed(() => {
  const option = statusOptions.value.find(opt => opt.value === statusFilter.value)
  return option ? `${option.label} (${option.count})` : 'Active'
})
</script>

<template>
  <ViewCard :title="dynamicTitle">
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <!-- Mobile: Dropdown -->
        <div class="lg:hidden flex-grow">
          <select 
            :value="statusFilter"
            @change="handleDropdownChange"
            class="select select-sm select-bordered w-38 max-w-xs"
          >
            <option 
              v-for="option in statusOptions" 
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }} ({{ option.count }})
            </option>
          </select>
        </div>

        <!-- Desktop: Button Group -->
        <div class="hidden lg:flex btn-group">
          <button 
            class="btn btn-sm"
            :class="{ 'btn-active': statusFilter === 'active' }"
            @click="handleStatusFilter('active')"
          >
            Active ({{ clientCounts.active }})
          </button>
          <button 
            class="btn btn-sm" 
            :class="{ 'btn-active': statusFilter === 'waiting' }"
            @click="handleStatusFilter('waiting')"
          >
            Waiting ({{ clientCounts.waiting }})
          </button>
          <button 
            class="btn btn-sm"
            :class="{ 'btn-active': statusFilter === 'archived' }"
            @click="handleStatusFilter('archived')"
          >
            Archived ({{ clientCounts.archived }})
          </button>
        </div>
        
        <!-- Search -->
        <input 
          v-model="searchInput"
          type="text" 
          placeholder="Search clients..." 
          class="input input-sm lg:input-md input-bordered w-full lg:w-64"
          @input="handleSearchChange"
        />
      </div>
    </template>

    <template #content>
      <div class="flex flex-col h-full">
        <!-- Status Filter Tabs -->


        <!-- Client Table -->
        <div class="flex-1 min-h-0 overflow-hidden">
          <div class="overflow-auto h-full">
        <table class="table table-sm lg:table-md">
          <!-- Head -->
          <thead class="sticky top-0 z-20">
            <tr class="hidden lg:table-row bg-base-200/30 backdrop-blur-sm border-b border-base-300">
              <th class="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Client</th>
              <th class="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Contact</th>
              <th class="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Therapy</th>
              <th class="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Status</th>
            </tr>
            <tr class="lg:hidden bg-base-200/30 backdrop-blur-sm border-b border-base-300">
              <th class="w-12 sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Name</th>
              <th class="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Parent</th>
              <th class="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm">Therapy</th>
            </tr>
          </thead>
          
          <!-- Body -->
          <tbody>
            <tr 
              v-for="client in filteredClients" 
              :key="client.id"
              class="hover cursor-pointer"
              @click="handleClientClick(client)"
            >
              <!-- Checkbox 
              <th>
                <label @click.stop>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-sm hidden"
                    :checked="client.id ? selectedClients.has(client.id) : false"
                    @change="toggleClientSelection(client.id)"
                  />
                </label>
              </th> -->
              
              <!-- Client Info -->
              <td>
                <div class="flex items-center gap-2 lg:gap-3 lg:pl-4 pr-2">
                  <!-- Avatar -->
                  <div class="avatar placeholder">
                    <div 
                      class="w-8 h-8 lg:w-12 lg:h-12 rounded-full text-white text-xs lg:text-sm font-semibold flex items-center justify-center"
                      :class="getAvatarData(client).colorClass"
                    >
                      {{ getAvatarData(client).initials }}
                    </div>
                  </div>
                  
                  <!-- Name and Details -->
                  <div>
                    <div class="font-bold text-sm lg:text-base">
                      {{ client.first_name }} {{ client.last_name }}
                      <span v-if="client.date_of_birth" class="hidden lg:inline text-xs opacity-50 font-normal">
                        ({{ calculateAge(client.date_of_birth) }} yrs., {{ client.gender }})
                      </span>
                    </div>
                    <!-- Mobile: Age only -->
                    <div class="text-xs lg:hidden opacity-50">
                      Age: {{ client.date_of_birth ? calculateAge(client.date_of_birth) : 'N/A' }}
                    </div>
                    <!-- Desktop: Email and Phone -->
                    <div class="hidden lg:block text-xs opacity-50">
                      <div v-if="client.email">{{ client.email }}</div>
                      <div v-if="client.phone">{{ client.phone }}</div>
                    </div>
                  </div>
                </div>
              </td>
              
              <!-- Contact Info (Desktop only) -->
              <td class="hidden lg:table-cell">
                <div v-if="client.contact_first_name || client.contact_last_name">
                  <div class="font-medium text-sm">
                    {{ client.contact_first_name }} {{ client.contact_last_name }}
                  </div>
                  <div class="text-xs opacity-50">
                    <div v-if="client.contact_email">{{ client.contact_email }}</div>
                    <div v-if="client.contact_phone">{{ client.contact_phone }}</div>
                  </div>
                </div>
                <span v-else class="text-xs opacity-50">No contact</span>
              </td>
              
              <!-- Therapy Info (Desktop only) -->
              <td class="hidden lg:table-cell">
                <div v-if="client.therapy_title">
                  <div class="font-medium text-sm">{{ client.therapy_title }}</div>
                  <div class="text-xs opacity-50">
                    <div v-if="client.cost_provider">{{ client.cost_provider.department }}, {{ client.cost_provider.organization }}</div>
                    <div v-if="client.provider_approval_code">Approval: {{ client.provider_approval_code }} from {{ localeDatesString(client.provider_approval_date) }}</div>
                    <div v-if="client.invoiced_individually">Individual invoicing</div>
                  </div>
                </div>
                <span v-else class="text-xs opacity-50">Not assigned</span>
              </td>
              
              <!-- Status -->
              <td class="hidden lg:table-cell">
                <span 
                  class="badge badge-sm capitalize"
                  :class="getStatusBadge(client.status)"
                >
                  {{ client.status }}
                </span>
              </td>
            </tr>
          </tbody>
          
          <!-- Empty State -->
          <tbody v-if="filteredClients.length === 0">
            <tr>
              <td colspan="4" class="text-center py-8">
                <div class="flex flex-col items-center gap-2 text-base-content/50">
                  <Users class="w-12 h-12" />
                  <div>
                    <div class="font-medium">No clients found</div>
                    <div class="text-sm">
                      {{ searchInput ? 'Try adjusting your search' : 'Add your first client to get started' }}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
       

        </table>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <!-- Summary Stats -->
      <div class="flex gap-4 text-xs">
        <span class="badge badge-success badge-outline">
          {{ clientCounts.active }} Active
        </span>
        <span class="badge badge-warning badge-outline">
          {{ clientCounts.waiting }} Waiting
        </span>
        <span class="badge badge-neutral badge-outline">
          {{ clientCounts.archived }} Archived
        </span>
      </div>
    </template>
  </ViewCard>
</template>

<style scoped>
/* Responsive table scrolling */
.overflow-auto {
  scrollbar-width: thin;
}

.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>