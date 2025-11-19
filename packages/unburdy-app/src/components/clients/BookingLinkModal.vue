<template>
  <div class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Buchungslink generieren</h3>
      
      <div v-if="client" class="mb-4">
        <p class="text-sm text-base-content/70">
          Buchungslink für: <strong>{{ client.first_name }} {{ client.last_name }}</strong>
        </p>
      </div>

      <!-- Template Selection -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text">Buchungsvorlage *</span>
        </label>
        <select
          v-model.number="selectedTemplateId"
          class="select select-bordered"
          :class="{ 'select-error': errors.template }"
          :disabled="loadingTemplates"
        >
          <option :value="undefined" disabled>
            {{ loadingTemplates ? 'Laden...' : 'Vorlage auswählen' }}
          </option>
          <option
            v-for="template in templates"
            :key="template.id"
            :value="template.id"
          >
            {{ template.name }}
          </option>
        </select>
        <label v-if="errors.template" class="label">
          <span class="label-text-alt text-error">{{ errors.template }}</span>
        </label>
      </div>

      <!-- Link Validity -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text">Gültigkeit des Links *</span>
        </label>
        <div class="flex flex-col gap-2">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="radio"
              name="validity"
              class="radio"
              value="one-time-booking-link"
              v-model="tokenPurpose"
            />
            <span class="label-text">
              <strong>Einmalig</strong> - Link ist nur für eine Buchung gültig
            </span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="radio"
              name="validity"
              class="radio"
              value="permanent-booking-link"
              v-model="tokenPurpose"
            />
            <span class="label-text">
              <strong>6 Monate</strong> - Link ist 6 Monate gültig
            </span>
          </label>
        </div>
        <label v-if="errors.validity" class="label">
          <span class="label-text-alt text-error">{{ errors.validity }}</span>
        </label>
      </div>

      <!-- Generated Link Display -->
      <div v-if="generatedLink" class="alert alert-success mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="flex-1">
          <h3 class="font-bold">Link erfolgreich generiert!</h3>
          <div class="text-xs mt-2">
            <div class="flex items-center gap-2 mt-1">
              <input
                type="text"
                :value="generatedLink.url"
                readonly
                class="input input-sm input-bordered flex-1 bg-base-200"
              />
              <button
                class="btn btn-sm btn-ghost"
                @click="copyToClipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Kopieren
              </button>
            </div>
            <div v-if="generatedLink.expires_at" class="text-xs opacity-70 mt-2">
              Gültig bis: {{ formatDate(generatedLink.expires_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="alert alert-error mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="handleCancel" :disabled="loading">
          {{ generatedLink ? 'Schließen' : 'Abbrechen' }}
        </button>
        <button
          v-if="!generatedLink"
          class="btn btn-primary"
          @click="handleGenerate"
          :disabled="loading || loadingTemplates"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          {{ loading ? 'Generiere...' : 'Link generieren' }}
        </button>
      </div>
    </div>
    <label class="modal-backdrop" @click="handleCancel"></label>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getApiClient } from '@/config/api-config'
import { useAuthStore } from '@/stores/auth'
import type { Client } from '@agile-exec/api-client'
import type { BookingTemplate } from '@/types/booking'

interface BookingLinkResponse {
  token: string
  url: string
  expires_at?: string
  created_at?: string
  purpose?: string
}

const props = defineProps<{
  modelValue: boolean
  client: Client | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const selectedTemplateId = ref<number | undefined>(undefined)
const tokenPurpose = ref<'one-time-booking-link' | 'permanent-booking-link'>('one-time-booking-link')
const templates = ref<BookingTemplate[]>([])
const loadingTemplates = ref(false)
const loading = ref(false)
const generatedLink = ref<BookingLinkResponse | null>(null)
const error = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

// Fetch templates when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await fetchTemplates()
  } else {
    // Reset state when closing
    selectedTemplateId.value = undefined
    tokenPurpose.value = 'one-time-booking-link'
    generatedLink.value = null
    error.value = null
    errors.value = {}
  }
})

const fetchTemplates = async () => {
  loadingTemplates.value = true
  error.value = null
  try {
    const apiClient = getApiClient()
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'Benutzer nicht angemeldet'
      return
    }
    
    const response = await apiClient.listBookingTemplatesByUser({
      user_id: userId
    })
    
    if (response?.success && response?.data) {
      templates.value = Array.isArray(response.data) ? response.data : []
      // Auto-select first template if available
      if (templates.value.length > 0 && templates.value[0]?.id) {
        selectedTemplateId.value = templates.value[0].id
      }
    } else {
      error.value = response?.message || response?.error || 'Fehler beim Laden der Vorlagen'
      templates.value = []
    }
  } catch (err) {
    console.error('Failed to fetch templates:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Vorlagen'
    templates.value = []
  } finally {
    loadingTemplates.value = false
  }
}

const handleGenerate = async () => {
  errors.value = {}
  error.value = null

  // Validation
  if (!selectedTemplateId.value) {
    errors.value.template = 'Bitte wählen Sie eine Vorlage aus'
    return
  }

  if (!props.client?.id) {
    error.value = 'Client ID fehlt'
    return
  }

  loading.value = true
  try {
    const apiClient = getApiClient()
    const response = await apiClient.createBookingLink({
      client_id: props.client.id,
      template_id: selectedTemplateId.value,
      token_purpose: tokenPurpose.value
    })

    if (response?.success && response?.data) {
      generatedLink.value = {
        token: response.data.token || '',
        url: response.data.url || '',
        expires_at: response.data.expires_at,
        created_at: response.data.created_at,
        purpose: response.data.purpose
      }
    } else {
      error.value = response?.message || response?.error || 'Fehler beim Generieren des Links'
    }
  } catch (err) {
    console.error('Failed to generate booking link:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Generieren des Links'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const copyToClipboard = async () => {
  if (!generatedLink.value?.url) return
  
  try {
    await navigator.clipboard.writeText(generatedLink.value.url)
    // Could add a toast notification here
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
