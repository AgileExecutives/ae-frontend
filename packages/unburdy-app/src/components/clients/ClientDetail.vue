<template>
  <div v-if="client" class="flex flex-col h-full">
    <!-- Scrollable content area -->
    <div class="flex-1 overflow-y-auto space-y-6 p-4 min-h-0">
      <!-- Client Avatar and Basic Info -->
      <div class="text-center">
        <div class="avatar placeholder mb-4">
          <div 
            class="size-16 lg:size-20 rounded-full text-white text-lg font-semibold flex items-center justify-center"
            :class="getAvatarData(client).colorClass"
          >
            {{ getAvatarData(client).initials }}
          </div>
        </div>
        <div class="text-sm opacity-70">
          Age: {{ client.date_of_birth ? calculateAge(client.date_of_birth) : 'N/A' }}
        </div>
        <div class="mt-2">
          <span 
            class="badge bagedge-sm lg:badge-md lg:badge-lg capitalize"
            :class="getStatusBadge(client.status)"
          >
            {{ client.status }}
          </span>
        </div>
      </div>

      <!-- Personal -->
      <div class="space-y-3">
      <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Personal</h4>
      <div class="space-y-2">
        <div v-if="client.therapy_title" class="flex justify-between">
          <span class="text-sm opacity-70">Diagnosis:</span>
          <span class="text-sm">{{ client.therapy_title }}</span>
        </div>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="flex gap-2 text-nowrap">
            <span class="text-sm opacity-70">Date of birth:</span>
            <span class="text-sm">{{ formatDate(client.date_of_birth) }}</span>
          </div>
          <div v-if="client.gender" class="flex gap-2 justify-end">
            <span class="text-sm opacity-70">Gender:</span>
            <span class="text-sm capitalize">{{ client.gender }}</span>
          </div>
        </div>
      </div>
    </div>

      <!-- Contact -->
      <div class="space-y-3">
      <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Contact</h4>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2">
        <div v-if="client.street_address" class="flex gap-2">
          <span class="text-sm">{{ client.street_address }}</span>
        </div>
        <div v-if="client.email" class="flex gap-2 justify-end">
          <span class="text-sm opacity-70">Email:</span>
          <span class="text-sm">{{ client.email }}</span>
        </div>
        <div v-if="client.city || client.zip" class="flex gap-2">
          <span class="text-sm">{{ client.zip }} {{ client.city }}</span>
        </div>
        <div v-if="client.phone" class="flex gap-2 justify-end">
          <span class="text-sm opacity-70">Phone:</span>
          <span class="text-sm">{{ client.phone }}</span>
        </div>
      </div>
    </div>

      <!-- Parent -->
      <div v-if="client.contact_first_name || client.contact_last_name || client.contact_email || client.contact_phone" class="space-y-3">
      <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Parent</h4>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2">
        <div class="flex gap-2">
          <span class="text-sm">{{ client.contact_first_name }} {{ client.contact_last_name }}</span>
        </div>
        <div v-if="client.contact_phone" class="flex gap-2 justify-end">
          <span class="text-sm opacity-70">Phone:</span>
          <span class="text-sm">{{ client.contact_phone }}</span>
        </div>
        <div v-if="client.contact_email" class="flex gap-2">
          <span class="text-sm opacity-70">Email:</span>
          <span class="text-sm">{{ client.contact_email }}</span>
        </div>
      </div>
    </div>

      <!-- Alternative -->
      <div v-if="client.alternative_first_name || client.alternative_last_name || client.alternative_email || client.alternative_phone" class="space-y-3">
      <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Alternative</h4>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2">
        <div class="flex gap-2">
          <span class="text-sm">{{ client.alternative_first_name }} {{ client.alternative_last_name }}</span>
        </div>
        <div v-if="client.alternative_phone" class="flex gap-2 justify-end">
          <span class="text-sm opacity-70">Phone:</span>
          <span class="text-sm">{{ client.alternative_phone }}</span>
        </div>
        <div v-if="client.alternative_email" class="flex gap-2">
          <span class="text-sm opacity-70">Email:</span>
          <span class="text-sm">{{ client.alternative_email }}</span>
        </div>
      </div>
    </div>

      <!-- Therapy Cost -->
      <div class="space-y-3">
      <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Therapy Cost Provider</h4>
        <div v-if="client.invoiced_individually" class="text-sm col-span-2">
          <span class="font-medium">Individually paid</span>
        </div>

      <div v-if="client.provider_approval_code"class="grid grid-cols-2 gap-x-4 gap-y-2">
        <div  class="flex gap-2">
          <span class="text-sm opacity-70">Approval:</span>
          <span class="text-sm">{{ client.provider_approval_code }}</span>
        </div>
        <div v-if="client.provider_approval_code && client.approval_date" class="flex gap-2 justify-end">
          <span class="text-sm opacity-70">Approval Date:</span>
          <span class="text-sm">{{ formatDate(client.approval_date) }}</span>
        </div>
      </div>
              <div v-else class="text-sm col-span-2 opacity-50">
          <span>Cost provider information not available</span>
        </div>
    </div>



      <!-- Notes -->
      <div v-if="client.notes" class="space-y-3">
        <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Notes</h4>
        <div class="text-sm">{{ client.notes }}</div>
      </div>

      <!-- Timestamps -->
      <div class="space-y-3">
        <h4 class="font-semibold text-sm uppercase tracking-wide opacity-70">Record Information</h4>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
          <div v-if="client.created_at" class="flex gap-2">
            <span class="text-sm opacity-70">Created:</span>
            <span class="text-sm">{{ formatDate(client.created_at) }}</span>
          </div>
          <div v-if="client.updated_at" class="flex gap-2 justify-end">
            <span class="text-sm opacity-70">Updated:</span>
            <span class="text-sm">{{ formatDate(client.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky bottom action bar -->
    <div class="flex-shrink-0 p-4 border-t border-base-300 bg-base-100 flex justify-end gap-2">

      <button type="button" class="btn btn-neutral btn-sm flex-grow" @click="emit('cancel')">
        Cancel
      </button>
      <button 
        class="btn btn-error btn-outline btn-sm px-6"
          @click="client && emit('delete', client)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
        <button type="button" 
          class="btn btn-primary btn-sm px-6"
          @click="client && emit('edit', client)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Client } from '@agile-exec/api-client'

interface Props {
  client: Client | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [client: Client]
  delete: [client: Client]
  cancel: []
}>()

// Generate avatar initials and color
const getAvatarData = (client: Client) => {
  const initials = `${(client.first_name || '').charAt(0)}${(client.last_name || '').charAt(0)}`.toUpperCase()
  
  // Generate consistent color based on name
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
  ]
  
  const nameHash = ((client.first_name || '') + (client.last_name || '')).split('').reduce((acc: number, char: string) => {
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

// Format date for display
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>