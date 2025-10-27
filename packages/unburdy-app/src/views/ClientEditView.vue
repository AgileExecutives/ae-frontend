<template>
  <div class="container mx-auto py-6 max-w-2xl">
    <button @click="$router.back()" class="btn btn-ghost mb-4">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Client
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-base-content/50" />
    </div>

    <div v-else class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Edit Client</h2>
        <p class="text-base-content/70">Update the client's information</p>
        
        <form @submit.prevent="saveClient" class="space-y-4">
          <!-- Error Message -->
          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>

          <div class="form-control w-full">
            <label class="label" for="first_name">
              <span class="label-text">First Name *</span>
            </label>
            <input id="first_name" v-model="clientForm.first_name" required class="input input-bordered w-full" />
          </div>

          <div class="form-control w-full">
            <label class="label" for="last_name">
              <span class="label-text">Last Name *</span>
            </label>
            <input id="last_name" v-model="clientForm.last_name" required class="input input-bordered w-full" />
          </div>

          <div class="form-control w-full">
            <label class="label" for="date_of_birth">
              <span class="label-text">Date of Birth</span>
            </label>
            <input id="date_of_birth" v-model="clientForm.date_of_birth" type="date" class="input input-bordered w-full" />
          </div>

          <div class="flex gap-4">
            <button type="button" @click="$router.back()" class="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">
              <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Using DaisyUI components instead of shadcn-style imports
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useClientStore } from '@/stores/client'

const route = useRoute()
const router = useRouter()
const clientStore = useClientStore()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const clientForm = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
})

const loadClient = async () => {
  loading.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    const client = await clientStore.fetchClient(id)
    clientForm.value = {
      first_name: client.first_name,
      last_name: client.last_name,
      date_of_birth: client.date_of_birth || '',
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load client'
  } finally {
    loading.value = false
  }
}

const saveClient = async () => {
  saving.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    await clientStore.updateClient(id, clientForm.value)
    router.push({ name: 'ClientDetail', params: { id } })
  } catch (e: any) {
    error.value = e.message || 'Failed to update client'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadClient()
})
</script>
