<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Clients</h1>
        <p class="text-base-content/70">Manage your clients</p>
      </div>
      <button @click="router.push({ name: 'ClientCreate' })" class="btn btn-primary">
        <Plus class="mr-2 h-4 w-4" />
        Add Client
      </button>
    </div>

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

    <!-- Clients List -->
    <div v-if="!loading && clients.length > 0" class="grid gap-4">
      <div v-for="client in clients" :key="client.id" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
        <div class="card-body">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="card-title">{{ client.first_name }} {{ client.last_name }}</h2>
              <p v-if="client.date_of_birth" class="text-base-content/70">
                DOB: {{ formatDate(client.date_of_birth) }}
              </p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm btn-square" @click="viewClient(client.id)">
                <Eye class="h-4 w-4" />
              </button>
              <button class="btn btn-ghost btn-sm btn-square" @click="deleteClient(client.id)">
                <Trash2 class="h-4 w-4 text-error" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && clients.length === 0" class="card bg-base-100 shadow-xl">
      <div class="card-body flex flex-col items-center justify-center py-12">
        <Users class="h-12 w-12 text-base-content/50 mb-4" />
        <h3 class="text-lg font-semibold mb-2">No clients yet</h3>
        <p class="text-base-content/70 mb-4">Add your first client to get started</p>
        <button @click="router.push({ name: 'ClientCreate' })" class="btn btn-primary">
          <Plus class="mr-2 h-4 w-4" />
          Add First Client
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// Using DaisyUI components instead of shadcn-style imports
import {
  Plus,
  Eye,
  Trash2,
  Users,
  Loader2,
} from 'lucide-vue-next'
import { useClientStore } from '@/stores/client'
import type { Client } from '@agile-exec/api-client'

const router = useRouter()
const clientStore = useClientStore()

const loading = ref(false)
const error = ref<string | null>(null)
const clients = ref<Client[]>([])

const loadClients = async () => {
  loading.value = true
  error.value = null
  try {
    clients.value = await clientStore.fetchClients()
  } catch (e: any) {
    error.value = e.message || 'Failed to load clients'
  } finally {
    loading.value = false
  }
}

const viewClient = (id: number) => {
  router.push({ name: 'ClientDetail', params: { id } })
}

const deleteClient = async (id: number) => {
  if (!confirm('Are you sure you want to delete this client?')) return
  
  try {
    await clientStore.deleteClient(id)
    await loadClients()
  } catch (e: any) {
    error.value = e.message || 'Failed to delete client'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  loadClients()
})
</script>
