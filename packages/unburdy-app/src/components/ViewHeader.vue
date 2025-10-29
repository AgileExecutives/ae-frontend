<template>
  <div class="px-6 hidden lg:flex justify-between sticky top-0 z-40 py-4 -mx-4 px-4">
    <h1 class="text-3xl font-bold text-base-content">{{ title }}</h1>
    <div class="flex items-center">
      <slot name="buttons" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>