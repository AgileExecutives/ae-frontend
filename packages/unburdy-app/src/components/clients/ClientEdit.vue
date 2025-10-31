<template>
  <div class="flex flex-col h-full">
    <form @submit.prevent="handleSubmit" class="flex flex-col h-full">
      <!-- Scrollable form content -->
      <div class="flex-1 overflow-y-auto space-y-6 p-4 min-h-0">
          <!-- Personal Information -->
          <div class="space-y-3">
            <h4 :class="formClasses.heading">Personal Information</h4>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">First Name</span>
                  </label>
                  <input v-model="formData.first_name" type="text" :class="formClasses.input" required />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Last Name</span>
                  </label>
                  <input v-model="formData.last_name" type="text" :class="formClasses.input" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Date of Birth</span>
                  </label>
                  <input v-model="formData.date_of_birth" type="date" :class="formClasses.input" />
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
                  <input v-model="formData.primary_language" type="text" :class="formClasses.input"
                    placeholder="e.g., English, German, Spanish" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Email</span>
                  </label>
                  <input v-model="formData.email" type="email" :class="formClasses.input" />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Phone</span>
                  </label>
                  <input v-model="formData.phone" type="tel" :class="formClasses.input" />
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
                <input v-model="formData.street_address" type="text" :class="formClasses.input" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">ZIP Code</span>
                  </label>
                  <input v-model="formData.zip" type="text" :class="formClasses.input" />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">City</span>
                  </label>
                  <input v-model="formData.city" type="text" :class="formClasses.input" />
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
                  <input v-model="formData.contact_first_name" type="text" :class="formClasses.input" />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Last Name</span>
                  </label>
                  <input v-model="formData.contact_last_name" type="text" :class="formClasses.input" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Email</span>
                  </label>
                  <input v-model="formData.contact_email" type="email" :class="formClasses.input" />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Phone</span>
                  </label>
                  <input v-model="formData.contact_phone" type="tel" :class="formClasses.input" />
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
                  <input v-model="formData.alternative_first_name" type="text" :class="formClasses.input" />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Last Name</span>
                  </label>
                  <input v-model="formData.alternative_last_name" type="text" :class="formClasses.input" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Email</span>
                  </label>
                  <input v-model="formData.alternative_email" type="email" :class="formClasses.input" />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span :class="formClasses.label">Phone</span>
                  </label>
                  <input v-model="formData.alternative_phone" type="tel" :class="formClasses.input" />
                </div>
              </div>
            </div>
          </div>

          <!-- Therapy Information -->
          <div class="space-y-3">
            <h4 :class="formClasses.heading">Therapy Information</h4>
            <div class="grid grid-cols-2 gap-4">
            
              <div class="form-control col-span-2 flex justify-between">
                <label class="label">
                  <span :class="formClasses.label">Diagnosis</span>
                </label>
                <GroupedSeachSelect 
                  v-model="formData.therapy_title" 
                  :options="diagnosticStds || []"
                />
              </div>
              <div class="form-control col-span-2">
                <label class="label cursor-pointer">
                  <span :class="formClasses.label">Individual Invoicing</span>
                  <input v-model="formData.invoiced_individually" type="checkbox" :class="formClasses.checkbox" />
                </label>
              </div>
              <div class="form-control col-span-2 flex justify-between" v-show="!formData.invoiced_individually">
                <label class="label">
                  <span :class="formClasses.label">Cost Provider</span>
                </label>

                <select v-model="formData.cost_provider_id" :class="formClasses.select"
                  :disabled="formData.invoiced_individually">
                  <option value="">Select Cost Provider...</option>
                  <option v-for="provider in costProviders" :key="provider.id" :value="Number(provider.id)">
                    {{ provider.organization }} - {{ provider.department }}
                  </option>
                </select>
              </div>
                <div class="form-control" v-show="!formData.invoiced_individually">
                  <label class="label">
                    <span :class="formClasses.label">Provider Approval Code</span>
                  </label>
                  <input v-model="formData.provider_approval_code" type="text" :class="formClasses.input" />
              </div>
                <div class="form-control" v-show="!formData.invoiced_individually">
                  <label class="label">
                    <span :class="formClasses.label">Provider Approval Date</span>
                  </label>
                  <input v-model="formData.provider_approval_date" type="date" :class="formClasses.input" />
                </div>
            </div>

            <!-- Notes -->
            <div class="space-y-3">
              <h4 :class="formClasses.heading">Notes</h4>
              <div class="form-control">
                <textarea v-model="formData.notes" :class="formClasses.textarea + ' w-full'" rows="4"
                  placeholder="Additional notes about the client..."></textarea>
              </div>
            </div>
          </div>
        </div>

          <!-- Sticky bottom action bar -->
    <div class="flex-shrink-0 p-4 border-t border-base-300 bg-base-100 flex justify-end gap-2">

      <button type="button" class="btn btn-neutral btn-sm flex-grow" @click="emit('cancel')">
        Cancel
      </button>
        <button type="submit" 
          class="btn btn-primary btn-sm px-6"
        >
          Save
        </button>
    </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import type { Client, CostProvider } from '@agile-exec/api-client'
import { getApiClient } from '@/config/api-config'
import { appConfig, MOCK_COST_PROVIDER_DATA, MOCK_DIAGNOSTIC_STANDARDS_DATA } from '@/config/app-config'
import { useI18n } from 'vue-i18n'
import GroupedSeachSelect from '../GroupedSeachSelect.vue'

// Type definition for DiagnosticStandard
interface DiagnosticStandard {
  icd10: number
  abbreviation: string
  title: string
  category: string
  description: string
}

interface Props {
  client: Client | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [client: Partial<Client>]
  cancel: []
  'name-change': [firstName: string, lastName: string]
}>()

const {locale} = useI18n()

// API client
const apiClient = getApiClient()

// Cost providers data
const costProviders = ref<CostProvider[]>([])
const loadingCostProviders = ref(false)

// Diagnostic standards data
const diagnosticStandards = ref<DiagnosticStandard[]>([])
const loadingDiagnosticStandards = ref(false)

// Form data
const formData = reactive<Partial<Client> & { cost_provider_id?: number }>({
  id: undefined,
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
      // Use real API - fetch from getCostProviders endpoint
      const response = await apiClient.getCostProviders()
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

// Load diagnostic standards
const loadDiagnosticStandards = async () => {
  loadingDiagnosticStandards.value = true
  try {
    if (appConfig.MOCK_API) {
      // Use mock data
      diagnosticStandards.value = MOCK_DIAGNOSTIC_STANDARDS_DATA.diagnostic_standards as DiagnosticStandard[]
    } else {
      // Use real API - fetch static JSON data
      const response = await apiClient.getStatic('diagnostic_std')
      if (response.success && response.data) {
        // Handle both direct array and nested object structures
        const data = response.data.diagnostic_standards || response.data
        diagnosticStandards.value = (locale.value === 'en') ? data.en : data.de
      }
    }
  } catch (error) {
    console.error('Failed to load diagnostic standards:', error)
    // Fallback to mock data on error
    diagnosticStandards.value = MOCK_DIAGNOSTIC_STANDARDS_DATA.diagnostic_standards as DiagnosticStandard[]
  } finally {
    loadingDiagnosticStandards.value = false
  }
}

// Load cost providers and diagnostic standards on mount
onMounted(() => {
  loadCostProviders()
  loadDiagnosticStandards()
})

// Watch for cost providers loading
watch(
  () => costProviders.value,
  (newProviders) => {
    if (newProviders && newProviders.length > 0 && formData.cost_provider_id) {
      // Check if the stored cost provider ID exists in the loaded providers
      const existingProvider = newProviders.find(p => Number(p.id) === formData.cost_provider_id)
      if (!existingProvider) {
        // Reset to empty if the stored ID doesn't exist
        formData.cost_provider_id = undefined
      }
    }
  }
)

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
            let formattedDate: string
            if (dateValue.includes('T')) {
              // ISO format: "2025-10-01T00:00:00Z" → "2025-10-01"
              formattedDate = dateValue.split('T')[0] || dateValue
            } else {
              // Already in YYYY-MM-DD format
              formattedDate = dateValue
            }
            console.log(`📅 Date field ${key}: "${dateValue}" → "${formattedDate}"`)
            // @ts-ignore - Dynamic key assignment
            formData[clientKey] = formattedDate
          } else {
            // @ts-ignore - Dynamic key assignment
            formData[clientKey] = newClient[clientKey]
          }
        }
      })
      console.log('ClientEdit watch - newClient:', newClient)
      formData.therapy_title = newClient.therapy_title || ''
      
      // Handle cost provider ID - could come from cost_provider_id directly or from cost_provider.id
      const costProviderId = newClient.cost_provider_id || newClient.cost_provider?.id
      formData.cost_provider_id = costProviderId ? Number(costProviderId) : undefined
      
      // Explicitly handle provider_approval_date in case it's not processed in the main loop
      if (newClient.provider_approval_date) {
        const dateValue = newClient.provider_approval_date as string
        if (dateValue.includes('T')) {
          formData.provider_approval_date = dateValue.split('T')[0] || dateValue
        } else {
          formData.provider_approval_date = dateValue
        }
        console.log(`📅 Explicit provider_approval_date: "${dateValue}" → "${formData.provider_approval_date}"`)
      }
    }
  },
  { immediate: true }
)

// Watch for name changes to update the drawer title
watch(
  [() => formData.first_name, () => formData.last_name],
  ([firstName, lastName]) => {
    // Always emit name change, even if fields are empty, to update the drawer title
    emit('name-change', firstName || '', lastName || '')
  },
  { immediate: true }
)

const handleSubmit = () => {
  // Convert form data back to proper format
  const clientData: Partial<Client> = { ...formData }

  // Convert date fields back to ISO format if needed
  if (clientData.date_of_birth) {
    clientData.date_of_birth = new Date(clientData.date_of_birth).toISOString()
  }
  
  if (clientData.provider_approval_date) {
    clientData.provider_approval_date = new Date(clientData.provider_approval_date).toISOString()
  }

  console.log('ClientEdit handleSubmit - clientData:', clientData)
  console.log('ClientEdit handleSubmit - has id:', !!clientData.id, 'id value:', clientData.id)

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

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    (result[groupKey] ||= []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}
// Group diagnostic standards by category for organized dropdown
const groupedDiagnosticStandards = computed(() => {
  return groupBy<DiagnosticStandard>(diagnosticStandards.value, 'category')
})

const diagnosticStds = computed(() => {
  return diagnosticStandards.value.map(std => {
    return {
      label: std.abbreviation + ' - ' + std.title,
      value: std.abbreviation + ' - ' + std.title,
      category: std.category
    }
  })
})



// Expose form validation and submission methods
defineExpose({
  handleSubmit,
  formData
})
</script>