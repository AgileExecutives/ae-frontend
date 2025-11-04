<template>
  <DrawerLayout>
    <RightDrawer
      v-model="isDrawerOpen"
      :title="drawerTitle"
      id="client-details-drawer"
      v-model:pinned="drawerPinned"
      @close="closeClientDetails"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 lg:px-4">
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
            <ClientList />
          </div>
        </div>
        
        <!-- Mobile Floating Action Button -->
        <button 
          class="btn btn-primary btn-circle fixed bottom-6 right-6 z-50 lg:hidden shadow-lg"
          @click="handleAddClient"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </template>

      <template #form>
        <div v-if="(selectedClient || isEditMode) && isDrawerOpen" class="h-full flex flex-col">
          <ClientDetail 
            v-if="!isEditMode"
            :client="selectedClient"
            @edit="editClient"
            @delete="client => showDeleteModal(client)"
            @cancel="closeClientDetails"
          />
          <ClientEdit 
            v-else
            :client="selectedClient"
            @save="saveClient"
            @cancel="cancelEdit"
            @name-change="handleNameChange"
          />
        </div>
      </template>
    </RightDrawer>

    <!-- Delete/Archive Modal -->
    <div class="modal" :class="{ 'modal-open': showDeleteConfirmModal }" id="delete-confirm-modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">What would you like to do with this client?</h3>
        <div v-if="clientToDelete" class="py-4">
          <p class="mb-4">
            Choose how to handle <strong>{{ clientToDelete.first_name }} {{ clientToDelete.last_name }}</strong>:
          </p>
          <div class="space-y-3">
            <div class="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="font-bold">Archive Client (Recommended)</h4>
                <p class="text-sm">Client data is preserved but hidden from active lists. Can be restored later.</p>
              </div>
            </div>
            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 class="font-bold">Permanently Delete</h4>
                <p class="text-sm">All client data will be permanently removed. This action cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-action">
          <button 
            class="btn btn-outline" 
            @click="closeDeleteModal"
          >
            Cancel
          </button>
          <button 
            class="btn btn-warning" 
            @click="permanentlyDeleteClient"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Forever
          </button>
          <button 
            class="btn btn-primary" 
            @click="archiveClientWithDrawerClose"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8l6 6 6-6" />
            </svg>
            Archive Client
          </button>
        </div>
      </div>
    </div>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ClientList from '@/components/clients/ClientList.vue'
import ClientDetail from '@/components/clients/ClientDetail.vue'
import ClientEdit from '@/components/clients/ClientEdit.vue'
import ViewHeader from '@/components/ViewHeader.vue'
import RightDrawer from '@/components/RightDrawer.vue'
import { useClients } from '@/composables/useClients'

// Use the clients composable for drawer management and client operations
const {
  // ========== REACTIVE DATA STORE ==========
  currentClient: selectedClient, // Current client for drawer
  
  // ========== UI STATE ==========
  isLoading: loading,
  error,
  isDrawerOpen,
  drawerPinned,
  isEditMode,
  showDeleteConfirmModal,
  clientToDelete,
  
  // ========== COMPUTED PROPERTIES ==========
  fullClientName,
  drawerTitle,
  
  // ========== CORE METHODS ==========
  ensureInitialized,
  saveClient,
  archiveClient,
  deleteClient,
  
  // ========== UI EVENT HANDLERS ==========
  handleAddClient,
  closeClientDetails,
  handleNameChange,
  editClient,
  cancelEdit,
  showDeleteModal,
  closeDeleteModal
} = useClients()

// Load clients when component mounts
onMounted(async () => {
  await ensureInitialized()
})

// Additional UI handlers not in composable

const permanentlyDeleteClient = async () => {
  if (!clientToDelete.value?.id) return
  
  const clientToRemove = clientToDelete.value
  
  try {
    const result = await deleteClient(clientToRemove)
    if (result && !result.success) {
      alert(result.error || 'Failed to delete client.')
      return
    }
    
    console.log('🗑️ Delete successful, checking if drawer should close...')
    console.log('🗑️ Deleted client ID:', clientToRemove.id)
    console.log('🗑️ Selected client ID:', selectedClient.value?.id)
    console.log('🗑️ Is drawer open:', isDrawerOpen.value)
    
    // Always close the drawer after successful delete (more aggressive approach)
    if (isDrawerOpen.value) {
      console.log('🗑️ Closing drawer...')
      closeClientDetails()
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete client:', error)
    alert('Failed to delete client. Please try again.')
  }
}

const archiveClientWithDrawerClose = async () => {
  if (!clientToDelete.value?.id) return
  
  const clientToArchive = clientToDelete.value
  
  try {
    const result = await archiveClient(clientToArchive)
    if (result && !result.success) {
      alert(result.error || 'Failed to archive client.')
      return
    }
    
    // Close the drawer if the archived client was selected
    if (selectedClient.value?.id === clientToArchive.id) {
      closeClientDetails()
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to archive client:', error)
    alert('Failed to archive client. Please try again.')
  }
}


</script>