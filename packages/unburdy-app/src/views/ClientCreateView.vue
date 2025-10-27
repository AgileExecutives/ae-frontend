<template>
  <div class="container mx-auto py-6 max-w-2xl">
    <button @click="$router.back()" class="btn btn-ghost mb-4">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Clients
    </button>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Add New Client</h2>
        <p class="text-base-content/70">Enter the client's information below</p>
        
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
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// Using DaisyUI components instead of shadcn-style imports
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useClientStore } from '@/stores/client'

const router = useRouter()
const clientStore = useClientStore()

const saving = ref(false)
const error = ref<string | null>(null)

const clientForm = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
})

const saveClient = async () => {
  saving.value = true
  error.value = null
  try {
    await clientStore.createClient(clientForm.value)
    router.push({ name: 'Clients' })
  } catch (e: any) {
    error.value = e.message || 'Failed to create client'
  } finally {
    saving.value = false
  }
}
</script>
