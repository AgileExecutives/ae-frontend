<template>
  <DrawerLayout>
    <RightDrawer 
      title="Invoice Creation" 
      v-model="showInvoiceDrawer" 
      v-model:pinned="drawerPinned"
      id="invoice-drawer"
      width="w-80"
      @close="resetForm"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto px-4 py-6">
          <div class="mb-8 hidden lg:flex justify-between">
            <h1 class="text-3xl font-bold text-base-content">Invoices</h1>
            <div class="flex items-center">
              <!-- Desktop actions could go here -->
            </div>
          </div>
          <ViewCard title="Invoices">
            <template #actions>
              <button class="btn btn-primary" @click="openInvoiceDrawer">Add Invoice</button>
            </template>
          </ViewCard>     
        </div>
      </template>

      <template #form>

      </template>

      <template #actions>
        <button class="btn btn-primary flex-1" @click="saveInvoice">Create Invoice</button>
      </template>
    </RightDrawer>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ViewCard from '@/components/ViewCard.vue'
import RightDrawer from '@/components/RightDrawer.vue'

// Invoice drawer state
const showInvoiceDrawer = ref(false)
const drawerPinned = ref(false)

// Invoice form data
const invoiceForm = ref({
  clientId: '',
  invoiceNumber: '',
  issueDate: '',
  dueDate: '',
  description: '',
  amount: '',
  currency: 'USD',
  taxRate: ''
})

// Reset form function
const resetForm = () => {
  invoiceForm.value = {
    clientId: '',
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    description: '',
    amount: '',
    currency: 'USD',
    taxRate: ''
  }
}

// Drawer control functions
const openInvoiceDrawer = () => {
  showInvoiceDrawer.value = true
}

// Save invoice function
const saveInvoice = () => {
  // TODO: Implement invoice saving logic
  console.log('Saving invoice:', invoiceForm.value)
  
  // For now, just close the drawer
  showInvoiceDrawer.value = false
  
  // TODO: Add success notification
  // TODO: Refresh invoice list
}
</script>