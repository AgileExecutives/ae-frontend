<template>
  <DrawerLayout>
    <div class="container flex flex-col h-full lg:h-screen mx-auto px-4 py-6">
      <div class="mb-8 hidden lg:flex justify-between">
        <h1 class="text-3xl font-bold text-base-content">Clients</h1>
        <div class="flex items-center">
          <!-- Desktop actions could go here -->
        </div>
      </div>
      <ViewCard title="Invoices"></ViewCard>     
    </div>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ViewCard from '@/components/ViewCard.vue';

</script>