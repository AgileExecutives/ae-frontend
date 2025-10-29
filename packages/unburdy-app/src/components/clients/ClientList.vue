<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, Users, Plus, Search } from 'lucide-vue-next'

interface Client {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string // YYYY-MM-DD format
  contact_first_name?: string
  contact_last_name?: string
  contact_email?: string
  contact_phone?: string
  email?: string
  phone?: string
  invoiced_individually?: boolean
  therapy_title?: string
  provider_approval_code?: string
  status: 'waiting' | 'active' | 'archived'
}

const props = withDefaults(defineProps<{
  clients?: Client[]
  searchQuery?: string
  selectedStatus?: 'all' | 'waiting' | 'active' | 'archived'
}>(), {
  clients: () => [],
  searchQuery: '',
  selectedStatus: 'all'
})

const emit = defineEmits<{
  clientClick: [client: Client]
  clientEdit: [client: Client]
  clientDelete: [client: Client]
  statusFilter: [status: 'all' | 'waiting' | 'active' | 'archived']
  searchChange: [query: string]
}>()

// Local state
const selectedClients = ref<Set<string>>(new Set())
const searchInput = ref(props.searchQuery)
const statusFilter = ref(props.selectedStatus)

// Generate avatar initials and color
const getAvatarData = (client: Client) => {
  const initials = `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`.toUpperCase()
  
  // Generate consistent color based on name
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
  ]
  
  const nameHash = (client.first_name + client.last_name).split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  const colorClass = colors[nameHash % colors.length]
  
  return { initials, colorClass }
}

// Get status badge style
const getStatusBadge = (status: Client['status']) => {
  const badges = {
    waiting: 'badge-warning',
    active: 'badge-success', 
    archived: 'badge-neutral'
  }
  return badges[status] || 'badge-ghost'
}

// Filtered clients based on search and status
const filteredClients = computed(() => {
  let filtered = props.clients

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(client => client.status === statusFilter.value)
  }

  // Filter by search query
  if (searchInput.value.trim()) {
    const query = searchInput.value.toLowerCase().trim()
    filtered = filtered.filter(client => 
      client.first_name.toLowerCase().includes(query) ||
      client.last_name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.contact_first_name?.toLowerCase().includes(query) ||
      client.contact_last_name?.toLowerCase().includes(query) ||
      client.contact_email?.toLowerCase().includes(query) ||
      client.therapy_title?.toLowerCase().includes(query)
    )
  }

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
const toggleClientSelection = (clientId: string) => {
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
    selectedClients.value = new Set(filteredClients.value.map(client => client.id))
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

const handleSearchChange = () => {
  emit('searchChange', searchInput.value)
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
    counts[client.status]++
  })
  
  return counts
})
</script>

<template>
  <div class="card bg-base-100/60 shadow-xl">
    <!-- Header -->
    <div class="card-header p-2 lg:p-4 border-b border-base-200">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div class="flex-1 min-w-0">
          <h2 class="card-title text-lg lg:text-xl flex items-center gap-2">
            <Users class="w-5 h-5" />
            Clients
            <span class="text-sm font-normal text-base-content/70">
              ({{ filteredClients.length }} of {{ props.clients.length }})
            </span>
          </h2>
        </div>
        
        <!-- Actions -->
        <div class="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
          <!-- Search -->
          <div class="form-control">
            <div class="input-group">
              <span class="bg-base-200">
                <Search class="w-4 h-4" />
              </span>
              <input 
                v-model="searchInput"
                type="text" 
                placeholder="Search clients..." 
                class="input input-sm lg:input-md input-bordered w-full lg:w-64"
                @input="handleSearchChange"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Status Filter Tabs -->
      <div class="tabs tabs-boxed mt-4 bg-base-200/50">
        <a 
          class="tab tab-sm lg:tab-md"
          :class="{ 'tab-active': statusFilter === 'all' }"
          @click="handleStatusFilter('all')"
        >
          All ({{ clientCounts.all }})
        </a>
        <a 
          class="tab tab-sm lg:tab-md"
          :class="{ 'tab-active': statusFilter === 'waiting' }"
          @click="handleStatusFilter('waiting')"
        >
          Waiting ({{ clientCounts.waiting }})
        </a>
        <a 
          class="tab tab-sm lg:tab-md"
          :class="{ 'tab-active': statusFilter === 'active' }"
          @click="handleStatusFilter('active')"
        >
          Active ({{ clientCounts.active }})
        </a>
        <a 
          class="tab tab-sm lg:tab-md"
          :class="{ 'tab-active': statusFilter === 'archived' }"
          @click="handleStatusFilter('archived')"
        >
          Archived ({{ clientCounts.archived }})
        </a>
      </div>
    </div>

    <!-- Client Table -->
    <div class="card-body p-0">
      <div class="overflow-x-auto">
        <table class="table table-sm lg:table-md">
          <!-- Head -->
          <thead>
            <tr class="bg-base-50">
              <th class="w-12">
                <label>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-sm"
                    :checked="selectedClients.size === filteredClients.length && filteredClients.length > 0"
                    :indeterminate="selectedClients.size > 0 && selectedClients.size < filteredClients.length"
                    @change="toggleAllClients"
                  />
                </label>
              </th>
              <th>Client</th>
              <th class="hidden lg:table-cell">Contact</th>
              <th class="hidden lg:table-cell">Therapy</th>
              <th>Status</th>
              <th class="w-20">Actions</th>
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
              <!-- Checkbox -->
              <th>
                <label @click.stop>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-sm"
                    :checked="selectedClients.has(client.id)"
                    @change="toggleClientSelection(client.id)"
                  />
                </label>
              </th>
              
              <!-- Client Info -->
              <td>
                <div class="flex items-center gap-3">
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
                    </div>
                    <div class="text-xs lg:text-sm opacity-50">
                      Age: {{ calculateAge(client.date_of_birth) }}
                      <span v-if="client.email" class="hidden lg:inline">
                        • {{ client.email }}
                      </span>
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
                    {{ client.contact_email }}
                  </div>
                </div>
                <span v-else class="text-xs opacity-50">No contact</span>
              </td>
              
              <!-- Therapy Info (Desktop only) -->
              <td class="hidden lg:table-cell">
                <div v-if="client.therapy_title">
                  {{ client.therapy_title }}
                  <br />
                  <span v-if="client.provider_approval_code" class="badge badge-ghost badge-sm">
                    {{ client.provider_approval_code }}
                  </span>
                </div>
                <span v-else class="text-xs opacity-50">Not assigned</span>
              </td>
              
              <!-- Status -->
              <td>
                <span 
                  class="badge badge-sm capitalize"
                  :class="getStatusBadge(client.status)"
                >
                  {{ client.status }}
                </span>
              </td>
              
              <!-- Actions -->
              <th>
                <div class="flex gap-1" @click.stop>
                  <button 
                    class="btn btn-ghost btn-xs"
                    @click="handleClientEdit(client)"
                    title="Edit Client"
                  >
                    Edit
                  </button>
                  <button 
                    class="btn btn-ghost btn-xs text-error"
                    @click="handleClientDelete(client)"
                    title="Delete Client"
                  >
                    Del
                  </button>
                </div>
              </th>
            </tr>
          </tbody>
          
          <!-- Empty State -->
          <tbody v-if="filteredClients.length === 0">
            <tr>
              <td colspan="6" class="text-center py-8">
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
          
          <!-- Footer -->
          <tfoot v-if="filteredClients.length > 0">
            <tr class="bg-base-50">
              <th></th>
              <th>Client</th>
              <th class="hidden lg:table-cell">Contact</th>
              <th class="hidden lg:table-cell">Therapy</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Responsive table scrolling */
.overflow-x-auto {
  scrollbar-width: thin;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>