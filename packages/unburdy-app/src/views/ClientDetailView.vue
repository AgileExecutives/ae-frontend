<template>
  <div class="container mx-auto py-6">
    <button @click="$router.back()" class="btn btn-ghost mb-4">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Clients
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-base-content/50" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card bg-error text-error-content mb-6">
      <div class="card-body">
        <p>{{ error }}</p>
      </div>
    </div>

    <!-- Client Details -->
    <div v-else-if="client" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold mb-2">{{ client.first_name }} {{ client.last_name }}</h1>
          <p v-if="client.date_of_birth" class="text-base-content/70">
            DOB: {{ formatDate(client.date_of_birth) }}
          </p>
        </div>
        <div class="flex gap-2">
          <button @click="router.push({ name: 'ClientEdit', params: { id: client.id } })" class="btn btn-outline">
            <Pencil class="mr-2 h-4 w-4" />
            Edit
          </button>
          <button @click="deleteClient" class="btn btn-error">
            <Trash2 class="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <!-- Client Information -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Client Information</h2>
          
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-base-content/70">First Name</dt>
              <dd class="mt-1">{{ client.first_name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-base-content/70">Last Name</dt>
              <dd class="mt-1">{{ client.last_name }}</dd>
            </div>
            <div v-if="client.date_of_birth">
              <dt class="text-sm font-medium text-base-content/70">Date of Birth</dt>
              <dd class="mt-1">{{ formatDate(client.date_of_birth) }}</dd>
            </div>
            <div v-if="client.created_at">
              <dt class="text-sm font-medium text-base-content/70">Created</dt>
              <dd class="mt-1">{{ formatDate(client.created_at) }}</dd>
            </div>
            <div v-if="client.updated_at">
              <dt class="text-sm font-medium text-base-content/70">Last Updated</dt>
              <dd class="mt-1">{{ formatDate(client.updated_at) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Activity Section -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Activity</h2>
          <p class="text-base-content/70">Client activity and history</p>
          
          <p class="text-base-content/70 text-center py-8">
            No activity yet
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Using DaisyUI components instead of shadcn-style imports
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-vue-next'
import { useClientStore } from '@/stores/client'
import type { components } from '@agile-exec/api-client'

type Client = components['schemas']['models.CustomerResponse']

const route = useRoute()
const router = useRouter()
const clientStore = useClientStore()

const loading = ref(false)
const error = ref<string | null>(null)
const client = ref<Client | null>(null)

const loadClient = async () => {
  loading.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    client.value = await clientStore.fetchClient(id)
  } catch (e: any) {
    error.value = e.message || 'Failed to load client'
  } finally {
    loading.value = false
  }
}

const deleteClient = async () => {
  if (!client.value || !confirm('Are you sure you want to delete this client?')) return
  
  try {
    await clientStore.deleteClient(client.value.id)
    router.push({ name: 'Clients' })
  } catch (e: any) {
    error.value = e.message || 'Failed to delete client'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  loadClient()
})
</script>
