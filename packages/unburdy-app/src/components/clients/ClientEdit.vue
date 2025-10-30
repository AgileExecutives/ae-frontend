<template>
  <div class="space-y-6">
    <form @submit.prevent="handleSubmit">
      <!-- Personal Information -->
      <div class="space-y-3 -mt-6">
        <h4 :class="formClasses.heading">Personal Information</h4>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">First Name</span>
              </label>
              <input 
                v-model="formData.first_name"
                type="text" 
                :class="formClasses.input"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Last Name</span>
              </label>
              <input 
                v-model="formData.last_name"
                type="text" 
                :class="formClasses.input"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Date of Birth</span>
              </label>
              <input 
                v-model="formData.date_of_birth"
                type="date" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Gender</span>
              </label>
              <select v-model="formData.gender" :class="formClasses.select">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Undisclosed</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Status</span>
              </label>
              <select v-model="formData.status" :class="formClasses.select">
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Primary Language</span>
              </label>
              <input 
                v-model="formData.primary_language"
                type="text" 
                :class="formClasses.input"
                placeholder="e.g., English, German, Spanish"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Email</span>
              </label>
              <input 
                v-model="formData.email"
                type="email" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Phone</span>
              </label>
              <input 
                v-model="formData.phone"
                type="tel" 
                :class="formClasses.input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Address Information -->
      <div class="space-y-3">
        <h4 :class="formClasses.heading">Address</h4>
        <div class="space-y-4">
          <div class="form-control flex justify-between">
            <label class="label">
              <span :class="formClasses.label">Street Address</span>
            </label>
            <input 
              v-model="formData.street_address"
              type="text" 
              :class="formClasses.input"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">ZIP Code</span>
              </label>
              <input 
                v-model="formData.zip"
                type="text" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">City</span>
              </label>
              <input 
                v-model="formData.city"
                type="text" 
                :class="formClasses.input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Person -->
      <div class="space-y-3">
        <h4 :class="formClasses.heading">Contact Person</h4>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">First Name</span>
              </label>
              <input 
                v-model="formData.contact_first_name"
                type="text" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Last Name</span>
              </label>
              <input 
                v-model="formData.contact_last_name"
                type="text" 
                :class="formClasses.input"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Email</span>
              </label>
              <input 
                v-model="formData.contact_email"
                type="email" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Phone</span>
              </label>
              <input 
                v-model="formData.contact_phone"
                type="tel" 
                :class="formClasses.input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Alternative Contact -->
      <div class="space-y-3">
        <h4 :class="formClasses.heading">Alternative Contact</h4>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">First Name</span>
              </label>
              <input 
                v-model="formData.alternative_first_name"
                type="text" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Last Name</span>
              </label>
              <input 
                v-model="formData.alternative_last_name"
                type="text" 
                :class="formClasses.input"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Email</span>
              </label>
              <input 
                v-model="formData.alternative_email"
                type="email" 
                :class="formClasses.input"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span :class="formClasses.label">Phone</span>
              </label>
              <input 
                v-model="formData.alternative_phone"
                type="tel" 
                :class="formClasses.input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Therapy Information -->
      <div class="space-y-3">
        <h4 :class="formClasses.heading">Therapy Information</h4>
        <div class="space-y-4">
          <div class="form-control flex justify-between">
            <label class="label">
              <span :class="formClasses.label">Diagnosis</span>
            </label>
            <input 
              v-model="formData.therapy_title"
              type="text" 
              :class="formClasses.input"
            />
          </div>
          <div class="form-control">
            <label class="label cursor-pointer">
              <span :class="formClasses.label">Individual Invoicing</span>
              <input 
                v-model="formData.invoiced_individually"
                type="checkbox" 
                :class="formClasses.checkbox"
              />
            </label>
          </div>
          <div class="form-control flex justify-between" v-show="!formData.invoiced_individually">
            <label class="label">
              <span :class="formClasses.label">Cost Provider</span>
            </label>
            <select 
              v-model="formData.cost_provider_id" 
              :class="formClasses.select"
              :disabled="formData.invoiced_individually"
            >
              <option value="">Select Cost Provider...</option>
              <option 
                v-for="provider in costProviders" 
                :key="provider.id" 
                :value="provider.id"
              >
                {{ provider.organization }} - {{ provider.department }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control" v-show="!formData.invoiced_individually">
              <label class="label">
                <span :class="formClasses.label">Provider Approval Code</span>
              </label>
              <input 
                v-model="formData.provider_approval_code"
                type="text" 
                :class="formClasses.input"
              />
            </div>

          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-3">
        <h4 :class="formClasses.heading">Notes</h4>
        <div class="form-control">
          <textarea 
            v-model="formData.notes"
            :class="formClasses.textarea + ' w-full'"
            rows="4"
            placeholder="Additional notes about the client..."
          ></textarea>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import type { Client, CostProvider } from '@agile-exec/api-client'
import { getApiClient } from '@/config/api-config'
import { appConfig, MOCK_COST_PROVIDER_DATA } from '@/config/app-config'

interface Props {
  client: Client | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [client: Partial<Client>]
  cancel: []
  'name-change': [firstName: string, lastName: string]
}>()

// API client
const apiClient = getApiClient()

// Cost providers data
const costProviders = ref<CostProvider[]>([])
const loadingCostProviders = ref(false)

// Form data
const formData = reactive<Partial<Client> & { cost_provider_id?: number }>({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  primary_language: '',
  email: '',
  phone: '',
  street_address: '',
  zip: '',
  city: '',
  contact_first_name: '',
  contact_last_name: '',
  contact_email: '',
  contact_phone: '',
  alternative_first_name: '',
  alternative_last_name: '',
  alternative_email: '',
  alternative_phone: '',
  therapy_title: '',
  provider_approval_code: '',
  status: 'active',
  invoiced_individually: false,
  notes: '',
  cost_provider_id: undefined
})

// Load cost providers
const loadCostProviders = async () => {
  loadingCostProviders.value = true
  try {
    if (appConfig.MOCK_API) {
      // Use mock data
      costProviders.value = MOCK_COST_PROVIDER_DATA.cost_providers as CostProvider[]
    } else {
      // Use real API
      const response = await apiClient.getCostProviders({ limit: 100 })
      if (response.success && response.data) {
        costProviders.value = response.data
      }
    }
  } catch (error) {
    console.error('Failed to load cost providers:', error)
    // Fallback to mock data on error
    costProviders.value = MOCK_COST_PROVIDER_DATA.cost_providers as CostProvider[]
  } finally {
    loadingCostProviders.value = false
  }
}

// Load cost providers on mount
onMounted(() => {
  loadCostProviders()
})

// Initialize form data when client changes
watch(
  () => props.client,
  (newClient) => {
    if (newClient) {
      // Copy client data to form
      Object.keys(formData).forEach(key => {
        const clientKey = key as keyof Client
        if (newClient[clientKey] !== undefined) {
          // Handle date formatting
          if (key.includes('date') && newClient[clientKey]) {
            const dateValue = newClient[clientKey] as string
            // Convert ISO date to YYYY-MM-DD format for input[type="date"]
            // @ts-ignore - Dynamic key assignment
            formData[clientKey] = dateValue.split('T')[0]
          } else {
            // @ts-ignore - Dynamic key assignment
            formData[clientKey] = newClient[clientKey]
          }
        }
      })
    }
  },
  { immediate: true }
)

// Watch for name changes to update the drawer title
watch(
  [() => formData.first_name, () => formData.last_name],
  ([firstName, lastName]) => {
    if (firstName || lastName) {
      emit('name-change', firstName || '', lastName || '')
    }
  }
)

const handleSubmit = () => {
  // Convert form data back to proper format
  const clientData: Partial<Client> = { ...formData }
  
  // Convert date fields back to ISO format if needed
  if (clientData.date_of_birth) {
    clientData.date_of_birth = new Date(clientData.date_of_birth).toISOString()
  }

  emit('save', clientData)
}

// Centralized form size configuration - change 'sm' to 'xs', 'md', etc. to adjust all form elements
const FORM_SIZE: 'xs' | 'sm' | 'md' | 'lg' = 'md'

// Computed size classes based on the centralized size setting
const formClasses = computed(() => {
  // Map form size to label size
  const sizeMap: Record<string, string> = {
    xs: 'xs',
    sm: 'xs', 
    md: 'sm',
    lg: 'base'
  }
  const labelSize = sizeMap[FORM_SIZE] || 'xs'
  
  return {
    input: `input input-${FORM_SIZE} input-bordered`,
    select: `select select-${FORM_SIZE} select-bordered`, 
    textarea: `textarea textarea-${FORM_SIZE} textarea-bordered`,
    checkbox: `checkbox checkbox-${FORM_SIZE}`,
    label: `label-text text-${labelSize}`,
    heading: `font-semibold text-${FORM_SIZE} uppercase tracking-wide opacity-70`
  }
})

// Expose form validation and submission methods
defineExpose({
  handleSubmit,
  formData
})
</script>