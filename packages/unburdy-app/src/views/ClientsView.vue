<template>
  <DrawerLayout>
    <RightDrawer
      v-model="isDrawerOpen"
      :title="selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'Client Details'"
      id="client-details-drawer"
      width="480px"
      v-model:pinned="drawerPinned"
      @close="closeClientDetails"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto px-4 py-6">
          <ViewHeader title="Clients">
            <template #buttons>
              <button class="btn btn-primary" @click="handleAddClient">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Client
              </button>
            </template>
          </ViewHeader>
          
          <!-- Client List Component -->
          <div class="flex-1 min-h-0">
            <ClientList
              :clients="clients"
              :search-query="searchQuery"
              :selected-status="selectedStatus"
              @client-click="handleClientClick"
              @client-edit="handleClientEdit"
              @client-delete="handleClientDelete"
              @status-filter="handleStatusFilter"
              @search-change="handleSearchChange"
            />
          </div>
        </div>
      </template>

      <template #form>
        <div v-if="selectedClient" class="space-y-6">
          <!-- Client Avatar and Basic Info -->
          <div class="text-center">
            <div class="avatar placeholder mb-4">
              <div 
                class="w-20 h-20 rounded-full text-white text-lg font-semibold flex items-center justify-center"
                :class="getAvatarData(selectedClient).colorClass"
              >
                {{ getAvatarData(selectedClient).initials }}
              </div>
            </div>
            <div class="text-sm opacity-70">
              Age: {{ calculateAge(selectedClient.date_of_birth) }}
            </div>
            <div class="mt-2">
              <span 
                class="badge badge-lg capitalize"
                :class="getStatusBadge(selectedClient.status)"
              >
                {{ selectedClient.status }}
              </span>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Personal Information</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm opacity-70">Date of Birth:</span>
                <span class="text-sm">{{ selectedClient.date_of_birth }}</span>
              </div>
              <div v-if="selectedClient.email" class="flex justify-between">
                <span class="text-sm opacity-70">Email:</span>
                <span class="text-sm">{{ selectedClient.email }}</span>
              </div>
              <div v-if="selectedClient.phone" class="flex justify-between">
                <span class="text-sm opacity-70">Phone:</span>
                <span class="text-sm">{{ selectedClient.phone }}</span>
              </div>
            </div>
          </div>

          <!-- Contact Person -->
          <div v-if="selectedClient.contact_first_name || selectedClient.contact_last_name" class="space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Contact Person</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm opacity-70">Name:</span>
                <span class="text-sm">{{ selectedClient.contact_first_name }} {{ selectedClient.contact_last_name }}</span>
              </div>
              <div v-if="selectedClient.contact_email" class="flex justify-between">
                <span class="text-sm opacity-70">Email:</span>
                <span class="text-sm">{{ selectedClient.contact_email }}</span>
              </div>
              <div v-if="selectedClient.contact_phone" class="flex justify-between">
                <span class="text-sm opacity-70">Phone:</span>
                <span class="text-sm">{{ selectedClient.contact_phone }}</span>
              </div>
            </div>
          </div>

          <!-- Therapy Information -->
          <div v-if="selectedClient.therapy_title || selectedClient.provider_approval_code" class="space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Therapy Information</h4>
            <div class="space-y-2">
              <div v-if="selectedClient.therapy_title" class="flex justify-between">
                <span class="text-sm opacity-70">Title:</span>
                <span class="text-sm">{{ selectedClient.therapy_title }}</span>
              </div>
              <div v-if="selectedClient.provider_approval_code" class="flex justify-between">
                <span class="text-sm opacity-70">Approval Code:</span>
                <span class="text-sm">{{ selectedClient.provider_approval_code }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm opacity-70">Individual Invoicing:</span>
                <span class="text-sm">{{ selectedClient.invoiced_individually ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <button 
          v-if="selectedClient"
          class="btn btn-primary flex-1"
          @click="handleClientEdit(selectedClient)"
        >
          Edit Client
        </button>
        <button 
          v-if="selectedClient"
          class="btn btn-error btn-outline"
          @click="handleClientDelete(selectedClient)"
        >
          Delete
        </button>
      </template>
    </RightDrawer>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ClientList from '@/components/clients/ClientList.vue'
import ViewHeader from '@/components/ViewHeader.vue'
import RightDrawer from '@/components/RightDrawer.vue'

interface Client {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
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

// State
const searchQuery = ref()
const selectedStatus = ref<'all' | 'waiting' | 'active' | 'archived'>('all')
const isDrawerOpen = ref(false)
const selectedClient = ref<Client | null>(null)
const drawerPinned = ref(false)

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

// Test data - sample clients
const clients = ref<Client[]>([
  {
    id: 1,
    first_name: 'Emma',
    last_name: 'Johnson',
    date_of_birth: '2010-03-15',
    contact_first_name: 'Sarah',
    contact_last_name: 'Johnson',
    contact_email: 'sarah.johnson@email.com',
    contact_phone: '+1-555-0123',
    email: 'emma.johnson@email.com',
    phone: '+1-555-0124',
    invoiced_individually: false,
    therapy_title: 'Speech Therapy',
    provider_approval_code: 'ST-2024-001',
    status: 'active'
  },
  {
    id: 2,
    first_name: 'Liam',
    last_name: 'Smith',
    date_of_birth: '2008-07-22',
    contact_first_name: 'Michael',
    contact_last_name: 'Smith',
    contact_email: 'michael.smith@email.com',
    contact_phone: '+1-555-0125',
    email: 'liam.smith@email.com',
    phone: '+1-555-0126',
    invoiced_individually: true,
    therapy_title: 'Occupational Therapy',
    provider_approval_code: 'OT-2024-002',
    status: 'active'
  },
  {
    id: 3,
    first_name: 'Sophia',
    last_name: 'Davis',
    date_of_birth: '2012-11-08',
    contact_first_name: 'Jennifer',
    contact_last_name: 'Davis',
    contact_email: 'jennifer.davis@email.com',
    contact_phone: '+1-555-0127',
    email: 'sophia.davis@email.com',
    phone: '+1-555-0128',
    invoiced_individually: false,
    therapy_title: 'Physical Therapy',
    provider_approval_code: 'PT-2024-003',
    status: 'waiting'
  },
  {
    id: 4,
    first_name: 'Mason',
    last_name: 'Wilson',
    date_of_birth: '2009-05-14',
    contact_first_name: 'Robert',
    contact_last_name: 'Wilson',
    contact_email: 'robert.wilson@email.com',
    contact_phone: '+1-555-0129',
    email: 'mason.wilson@email.com',
    phone: '+1-555-0130',
    invoiced_individually: true,
    therapy_title: 'Behavioral Therapy',
    provider_approval_code: 'BT-2024-004',
    status: 'active'
  },
  {
    id: 5,
    first_name: 'Isabella',
    last_name: 'Brown',
    date_of_birth: '2011-01-30',
    contact_first_name: 'Lisa',
    contact_last_name: 'Brown',
    contact_email: 'lisa.brown@email.com',
    contact_phone: '+1-555-0131',
    email: 'isabella.brown@email.com',
    phone: '+1-555-0132',
    invoiced_individually: false,
    therapy_title: 'Speech Therapy',
    provider_approval_code: 'ST-2024-005',
    status: 'archived'
  },
  {
    id: 6,
    first_name: 'Ethan',
    last_name: 'Taylor',
    date_of_birth: '2007-09-12',
    contact_first_name: 'David',
    contact_last_name: 'Taylor',
    contact_email: 'david.taylor@email.com',
    contact_phone: '+1-555-0133',
    email: 'ethan.taylor@email.com',
    phone: '+1-555-0134',
    invoiced_individually: true,
    therapy_title: 'Occupational Therapy',
    provider_approval_code: 'OT-2024-006',
    status: 'waiting'
  },
  {
    id: 7,
    first_name: 'Ava',
    last_name: 'Anderson',
    date_of_birth: '2013-04-18',
    contact_first_name: 'Michelle',
    contact_last_name: 'Anderson',
    contact_email: 'michelle.anderson@email.com',
    contact_phone: '+1-555-0135',
    email: 'ava.anderson@email.com',
    phone: '+1-555-0136',
    invoiced_individually: false,
    therapy_title: 'Physical Therapy',
    provider_approval_code: 'PT-2024-007',
    status: 'active'
  },
  {
    id: 8,
    first_name: 'Noah',
    last_name: 'Martinez',
    date_of_birth: '2010-12-05',
    contact_first_name: 'Carlos',
    contact_last_name: 'Martinez',
    contact_email: 'carlos.martinez@email.com',
    contact_phone: '+1-555-0137',
    email: 'noah.martinez@email.com',
    phone: '+1-555-0138',
    invoiced_individually: false,
    therapy_title: 'Speech Therapy',
    provider_approval_code: 'ST-2024-008',
    status: 'archived'
  }
])

// Event handlers
const handleClientClick = (client: Client) => {
  console.log('Client clicked:', client)
  selectedClient.value = client
  isDrawerOpen.value = true
}

const closeClientDetails = () => {
  isDrawerOpen.value = false
  selectedClient.value = null
}

const handleClientEdit = (client: Client) => {
  console.log('Edit client:', client)
  // TODO: Open edit modal or navigate to edit form
}

const handleClientDelete = (client: Client) => {
  console.log('Delete client:', client)
  // TODO: Show confirmation dialog and delete
  if (confirm(`Are you sure you want to delete ${client.first_name} ${client.last_name}?`)) {
    const index = clients.value.findIndex(c => c.id === client.id)
    if (index > -1) {
      clients.value.splice(index, 1)
    }
  }
}

const handleStatusFilter = (status: 'all' | 'waiting' | 'active' | 'archived') => {
  selectedStatus.value = status
  console.log('Status filter changed:', status)
}

const handleSearchChange = (query: string) => {
  searchQuery.value = query
  console.log('Search query changed:', query)
}

const handleAddClient = () => {
  console.log('Add new client')
  // TODO: Open add client modal or navigate to add form
}
</script>