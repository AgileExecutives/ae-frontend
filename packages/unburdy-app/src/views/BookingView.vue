<template>
  <DrawerLayout>
    <RightDrawer
      v-model="isDrawerOpen"
      :title="drawerTitle"
      id="booking-template-drawer"
      v-model:pinned="drawerPinned"
      @close="closeTemplateDetails"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 lg:px-4">
          <ViewHeader title="Buchungsvorlagen">
            <template #buttons>
              <button class="btn btn-primary" @click="handleAddTemplate">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Vorlage erstellen
              </button>
            </template>
          </ViewHeader>
          
          <!-- Template List Component -->
          <div class="flex-1 min-h-0">
            <BookingTemplateList
              @template-click="handleTemplateClick"
              @template-edit="handleTemplateEdit"
              @template-delete="showDeleteModal"
              @add-template="handleAddTemplate"
            />
          </div>
        </div>
        
        <!-- Mobile Floating Action Button -->
        <button 
          class="btn btn-primary btn-circle fixed bottom-6 right-6 z-50 lg:hidden shadow-lg"
          @click="handleAddTemplate"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </template>

      <template #form>
        <div v-if="(selectedTemplate || isEditMode) && isDrawerOpen" class="h-full flex flex-col">
          <BookingTemplateDetail 
            v-if="!isEditMode"
            :template="selectedTemplate"
            @edit="editTemplate"
            @delete="template => showDeleteModal(template)"
            @cancel="closeTemplateDetails"
          />
          <BookingTemplateEdit 
            v-else
            :template="selectedTemplate"
            @save="saveTemplate"
            @cancel="cancelEdit"
          />
        </div>
      </template>
    </RightDrawer>

    <!-- Delete Confirm Modal -->
    <div class="modal" :class="{ 'modal-open': showDeleteConfirmModal }" id="delete-confirm-modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Vorlage löschen?</h3>
        <div v-if="templateToDelete" class="py-4">
          <p class="mb-4">
            Möchten Sie die Vorlage <strong>{{ templateToDelete.name }}</strong> wirklich löschen?
          </p>
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 class="font-bold">Achtung</h4>
              <p class="text-sm">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            </div>
          </div>
        </div>
        <div class="modal-action">
          <button 
            class="btn btn-outline" 
            @click="closeDeleteModal"
          >
            Abbrechen
          </button>
          <button 
            class="btn btn-error" 
            @click="confirmDelete"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Löschen
          </button>
        </div>
      </div>
    </div>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import BookingTemplateList from '@/components/booking/BookingTemplateList.vue'
import BookingTemplateDetail from '@/components/booking/BookingTemplateDetail.vue'
import BookingTemplateEdit from '@/components/booking/BookingTemplateEdit.vue'
import ViewHeader from '@/components/ViewHeader.vue'
import RightDrawer from '@/components/RightDrawer.vue'
import { useBooking } from '@/composables/useBooking'

// Use the booking composable for drawer management and template operations
const {
  // ========== REACTIVE DATA STORE ==========
  currentTemplate: selectedTemplate, // Current template for drawer
  
  // ========== UI STATE ==========
  isLoading: loading,
  error,
  isDrawerOpen,
  drawerPinned,
  isEditMode,
  showDeleteConfirmModal,
  templateToDelete,
  
  // ========== COMPUTED PROPERTIES ==========
  drawerTitle,
  
  // ========== CORE METHODS ==========
  ensureInitialized,
  saveTemplate,
  deleteTemplate,
  
  // ========== UI EVENT HANDLERS ==========
  handleAddTemplate,
  handleTemplateClick,
  handleTemplateEdit,
  closeTemplateDetails,
  editTemplate,
  cancelEdit,
  showDeleteModal,
  closeDeleteModal
} = useBooking()

// Load templates when component mounts
onMounted(async () => {
  await ensureInitialized()
})

// Additional UI handlers not in composable

const confirmDelete = async () => {
  if (!templateToDelete.value?.id) return
  
  const templateToRemove = templateToDelete.value
  
  try {
    const result = await deleteTemplate(templateToRemove)
    if (result && !result.success) {
      alert(result.error || 'Fehler beim Löschen der Vorlage.')
      return
    }
    
    // Always close the drawer after successful delete
    if (isDrawerOpen.value) {
      closeTemplateDetails()
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete template:', error)
    alert('Fehler beim Löschen der Vorlage. Bitte versuchen Sie es erneut.')
  }
}
</script>
