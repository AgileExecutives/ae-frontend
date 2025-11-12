<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Sun, CloudSun, Moon } from 'lucide-vue-next'
import type { GroupedSlots, TimeSlot } from '@/types/client-booking'

const props = defineProps<{
  selectedDate: string
  groupedSlots: GroupedSlots
}>()

const emit = defineEmits<{
  selectSlot: [slot: TimeSlot]
}>()

const formattedDate = computed(() => {
  const date = new Date(props.selectedDate)
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const totalSlots = computed(() => {
  return (
    props.groupedSlots.morning.length +
    props.groupedSlots.afternoon.length +
    props.groupedSlots.evening.length
  )
})

const timeGroups = computed(() => [
  {
    id: 'morning',
    label: 'Vormittag',
    icon: Sun,
    slots: props.groupedSlots.morning,
    color: 'text-yellow-500'
  },
  {
    id: 'afternoon',
    label: 'Nachmittag',
    icon: CloudSun,
    slots: props.groupedSlots.afternoon,
    color: 'text-orange-500'
  },
  {
    id: 'evening',
    label: 'Abend',
    icon: Moon,
    slots: props.groupedSlots.evening,
    color: 'text-indigo-500'
  }
])

const formatTime = (time: string) => {
  return time.slice(0, 5) // HH:mm
}

const handleSlotClick = (slot: TimeSlot) => {
  if (slot.isAvailable) {
    emit('selectSlot', slot)
  }
}
</script>

<template>
  <div class="card bg-base-100/50 shadow-lg">
    <!-- Header -->
    <div class="card-header p-4 md:p-6">
      <div class="flex items-center gap-2">
        <Clock class="w-5 h-5 text-primary" />
        <h2 class="card-title text-lg md:text-xl">Verfügbare Termine</h2>
      </div>
      <p class="text-sm text-base-content/70">{{ formattedDate }}</p>
      <p class="text-xs text-base-content/50 mt-1">
        {{ totalSlots }} {{ totalSlots === 1 ? 'Termin' : 'Termine' }} verfügbar
      </p>
    </div>
    
    <div class="card-body p-4 md:p-6">
      <!-- No slots available -->
      <div
        v-if="totalSlots === 0"
        class="text-center py-12"
      >
        <div class="text-base-content/30 mb-2">
          <Clock class="w-12 h-12 mx-auto" />
        </div>
        <p class="text-base-content/70 font-medium">Keine Termine verfügbar</p>
        <p class="text-sm text-base-content/50 mt-1">
          Bitte wählen Sie einen anderen Tag
        </p>
      </div>

      <!-- Slots grouped by time of day -->
      <div
        v-else
        class="space-y-6"
      >
        <div
          v-for="group in timeGroups"
          :key="group.id"
        >
          <div
            v-if="group.slots.length > 0"
            class="space-y-3"
          >
            <!-- Group header -->
            <div class="flex items-center gap-2">
              <component
                :is="group.icon"
                :class="['w-4 h-4', group.color]"
              />
              <h3 class="font-semibold text-base-content/90">{{ group.label }}</h3>
              <span class="text-xs text-base-content/50">({{ group.slots.length }})</span>
            </div>

            <!-- Slots grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              <button
                v-for="slot in group.slots"
                :key="slot.id"
                :class="[
                  'btn btn-sm',
                  slot.isAvailable
                    ? 'btn-outline hover:btn-primary'
                    : 'btn-disabled',
                  'flex-col h-auto py-2 px-3'
                ]"
                :disabled="!slot.isAvailable"
                @click="handleSlotClick(slot)"
              >
                <span class="font-semibold">{{ formatTime(slot.startTime) }}</span>
                <span class="text-xs opacity-75">{{ formatTime(slot.endTime) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Helper text -->
    <div
      v-if="totalSlots > 0"
      class="card-footer p-4 md:p-6"
    >
      <p class="text-xs text-base-content/60 text-center">
        Klicken Sie auf einen Termin, um die Buchung fortzusetzen
      </p>
    </div>
  </div>
</template>
