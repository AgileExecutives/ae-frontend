<template>
  <div class="w-full h-full" :class="{ 'lg:flex': isPinned && isOpen }">
    <div class="drawer drawer-end" :class="[
      { 'lg:drawer-open': isPinned && isOpen },
      isPinned && isOpen ? 'lg:flex-1' : 'w-full'
    ]">
      <input :id="drawerId" type="checkbox" class="drawer-toggle" v-model="isOpen" />
      <div class="drawer-content transition-all duration-300">
        <slot name="content" />
      </div>
      <div class="drawer-side z-[70]">
        <label :for="drawerId" aria-label="close sidebar" class="drawer-overlay lg:hidden"></label>
        <label :for="drawerId" aria-label="close sidebar" class="drawer-overlay hidden lg:block" v-if="!isPinned"></label>
        <div class="min-h-full bg-base-200 flex flex-col" :class="[
          `w-full lg:${width}`,
          { 'shadow-xl': !isPinned, 'border-l border-base-300': isPinned }
        ]">
        <!-- Drawer Header -->
        <div class="flex justify-between items-center p-4 border-b border-base-300">
          <h2 class="text-xl font-bold">{{ title }}</h2>
          <div class="flex gap-1">
            <!-- Pin Toggle Button (Desktop only) -->
            <button 
              class="btn btn-ghost btn-sm btn-circle tooltip tooltip-left hidden lg:flex" 
              :data-tip="isPinned ? 'Unpin drawer' : 'Pin drawer'"
              @click="togglePin"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                :class="{ 'rotate-45': isPinned }"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <!-- Close Button (Always on mobile, conditionally on desktop) -->
            <button class="btn btn-ghost btn-sm btn-circle lg:hidden" @click="close">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <!-- Close Button (Desktop - only when not pinned) -->
            <button class="btn btn-ghost btn-sm btn-circle hidden lg:flex" @click="close" v-if="!isPinned">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Drawer Content -->
        <div class="flex-1 p-4 overflow-y-auto">
          <slot name="form" />
        </div>
        
        <!-- Drawer Footer -->
        <div class="p-4 border-t border-base-300 bg-base-100">
          <div class="flex gap-2">
            <button class="btn btn-ghost flex-1" @click="close">Cancel</button>
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  title: string
  modelValue?: boolean
  id?: string
  pinned?: boolean
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  id: 'right-drawer',
  pinned: false,
  width: 'w-96'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:pinned': [value: boolean]
  'close': []
}>()

// Generate unique drawer ID
const drawerId = computed(() => `${props.id}-toggle`)

// Internal state that syncs with v-model
const isOpen = ref(props.modelValue)
const isPinned = ref(props.pinned)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
})

// Watch for external changes to pinned
watch(() => props.pinned, (newValue) => {
  isPinned.value = newValue
})

// Watch for internal changes and emit them
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(isPinned, (newValue) => {
  emit('update:pinned', newValue)
})

// Close function
const close = () => {
  isOpen.value = false
  emit('close')
}

// Toggle pin function
const togglePin = () => {
  isPinned.value = !isPinned.value
}

// Expose methods for parent component
defineExpose({
  close
})
</script>

<style scoped>
/* Ensure drawer appears above other content */
.drawer-side {
  z-index: 70;
}
</style>