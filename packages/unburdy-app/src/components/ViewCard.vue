<template>
    <div class="card bg-base-100/40 h-full shadow-xl">
    <!-- Header -->
    <div class="card-header p-2 lg:p-4 border-b border-base-200">
      <div class="flex justify-between items-center">
        <div class="flex-1 min-w-0">
          <h2 class="card-title text-sm lg:text-base"> {{ title }} </h2>
        </div>
        <div class="flex gap-1 lg:gap-2">
            <slot name="actions" />
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="card-body h-full p-0">
        <slot name="content" />
    </div>

    <!-- Footer Stats -->
    <div class="card-footer p-3 border-t border-base-200 bg-base-50">
      <div class="flex justify-between items-center text-sm">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
    title: {
        type: String,
        required: true
    }
})
</script>