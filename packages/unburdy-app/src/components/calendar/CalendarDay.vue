<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'

interface Meeting {
  id: string
  title: string
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
  type: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  description?: string
  attendees?: string[]
  date?: string // YYYY-MM-DD format, optional for sample meetings
}

const props = withDefaults(defineProps<{
  meetings?: Meeting[]
  startHour?: number
  endHour?: number
  slotHeight?: number
  date?: Date
  showCurrentTime?: boolean
}>(), {
  meetings: () => [],
  startHour: 8,
  endHour: 18,
  slotHeight: 8,
  date: () => new Date(),
  showCurrentTime: true
})

const emit = defineEmits<{
  meetingClick: [meeting: Meeting]
  timeSlotClick: [time: string]
  createMeeting: [startTime: string, endTime: string]
  previousDay: []
  nextDay: []    
  goToToday: []
}>()

// Screen size detection
const isMobile = ref(false)
const updateScreenSize = () => {
  isMobile.value = window.innerWidth < 1024
}

// Current time tracking
const currentTime = ref(new Date())
const updateCurrentTime = () => {
  currentTime.value = new Date()
}

let timeInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
  
  if (props.showCurrentTime) {
    timeInterval = setInterval(updateCurrentTime, 60000) // Update every minute
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
  
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Calculate the current day data
const dayData = computed(() => {
  const date = new Date(props.date)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  return {
    date,
    dateStr: date.toISOString().split('T')[0],
    dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
    dayNumber: date.getDate(),
    isToday
  }
})

// Generate hour slots for the day
const hourSlots = computed(() => {
  const slots = []
  for (let hour = props.startHour; hour <= props.endHour; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour,
      slotIndex: hour - props.startHour
    })
  }
  return slots
})

// Calculate total grid height
const gridHeight = computed(() => {
  const totalHours = props.endHour - props.startHour + 1
  const slotsPerHour = 12 // 5-minute slots
  return totalHours * slotsPerHour * props.slotHeight
})

// Generate 5-minute time slots
const timeSlots = computed(() => {
  const slots = []
  for (let hour = props.startHour; hour <= props.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const slotIndex = ((hour - props.startHour) * 12) + (minute / 5)
      
      slots.push({
        time: timeString,
        hour,
        minute,
        slotIndex,
        top: slotIndex * props.slotHeight
      })
    }
  }
  return slots
})

// Process meetings for the current day
const processedMeetings = computed(() => {
  return props.meetings
    .filter(meeting => meeting.date === dayData.value.dateStr)
    .map(meeting => {
      const startTime = meeting.startTime.split(':').map(Number)
      const endTime = meeting.endTime.split(':').map(Number)
      
      const safeStartHour = startTime[0] ?? 0
      const safeStartMin = startTime[1] ?? 0
      const safeEndHour = endTime[0] ?? 0
      const safeEndMin = endTime[1] ?? 0
      
      const startMinutes = (safeStartHour - props.startHour) * 60 + safeStartMin
      const endMinutes = (safeEndHour - props.startHour) * 60 + safeEndMin
      
      const top = (startMinutes / 5) * props.slotHeight
      const height = ((endMinutes - startMinutes) / 5) * props.slotHeight
      
      return {
        ...meeting,
        top,
        height,
        left: 0,
        width: '100%'
      }
    })
})

// Navigation functions
const previousDay = () => {
  emit('previousDay')
}

const nextDay = () => {
  emit('nextDay')
}

const goToToday = () => {
  emit('goToToday')
}

// Handle meeting click
const handleMeetingClick = (meeting: Meeting) => {
  emit('meetingClick', meeting)
}

// Handle time slot click
const handleTimeSlotClick = (timeString: string) => {
  emit('timeSlotClick', timeString)
}

// Current time indicator position
const currentTimePosition = computed(() => {
  if (!props.showCurrentTime || !dayData.value.isToday) return null
  
  const now = currentTime.value
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  if (currentHour < props.startHour || currentHour > props.endHour) return null
  
  const totalMinutes = (currentHour - props.startHour) * 60 + currentMinute
  return (totalMinutes / 5) * props.slotHeight
})

// Current time string
const currentTimeString = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<template>
  <div class="card bg-base-100/60 shadow-xl">
    <!-- Header -->
    <div class="card-header p-2 lg:p-4 border-b border-base-200">
      <div class="flex justify-between items-center">
        <div class="flex-1 min-w-0">
          <!-- Desktop title -->
          <h2 class="card-title hidden lg:block">{{ dayData.dayName }}, {{ dayData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</h2>
          <!-- Mobile title -->
          <h2 class="card-title text-sm lg:hidden">{{ dayData.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }}</h2>
        </div>
        <div class="flex gap-1 lg:gap-2">
          <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="previousDay" title="Previous Day">
            <ChevronLeft class="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
          <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="nextDay" title="Next Day">
            <ChevronRight class="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
          <button class="btn btn-xs lg:btn-sm btn-primary btn-circle" @click="goToToday" title="Go to Today">
            <CalendarDays class="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="card-body p-0">

      <!-- Calendar Body -->
      <div 
        class="relative overflow-auto"
        :style="{ height: 'calc(100vh - 16rem - 10px)' }"
      >
        <div class="grid" :style="{ height: `${gridHeight}px`, gridTemplateColumns: isMobile ? '40px 1fr' : '60px 1fr' }">
          <!-- Time Labels Column -->
          <div class="relative border-r border-base-200 bg-base-50/50">
            <div
              v-for="(slot, index) in hourSlots"
              :key="`time-${slot.time}`"
              class="absolute right-2 text-xs text-base-content/70 select-none"
              :class="index === 0 ? '' : '-translate-y-1/2'"
              :style="{ top: `${slot.slotIndex * 12 * props.slotHeight + (index === 0 ? 8 : 0)}px` }"
            >
              {{ slot.time }}
            </div>
          </div>

          <!-- Day Column -->
          <div
            class="relative border-r border-base-200"
            :class="{ 'bg-primary/5': dayData.isToday }"
          >
            <!-- Hour Grid Lines -->
            <div
              v-for="hourSlot in hourSlots"
              :key="`grid-${dayData.dateStr}-${hourSlot.time}`"
              class="absolute w-full border-t border-base-200"
              :style="{ top: `${hourSlot.slotIndex * 12 * props.slotHeight}px` }"
            />

            <!-- Clickable Time Slots -->
            <div
              v-for="slot in timeSlots"
              :key="`slot-${dayData.dateStr}-${slot.time}`"
              class="absolute w-full cursor-pointer hover:bg-base-200/30 transition-colors"
              :style="{
                top: `${slot.top}px`,
                height: `${props.slotHeight}px`
              }"
              @click="handleTimeSlotClick(slot.time)"
            />

            <!-- Current Time Indicator -->
            <div
              v-if="currentTimePosition !== null && dayData.isToday"
              class="absolute w-full border-t-2 border-red-500 z-20"
              :style="{ top: `${currentTimePosition}px` }"
            >
              <div class="absolute -left-2 -top-1 bg-red-500 text-white text-xs px-1 rounded">
                {{ currentTimeString }}
              </div>
            </div>

            <!-- Meetings -->
            <div
              v-for="meeting in processedMeetings"
              :key="meeting.id"
              class="absolute z-10 p-1 rounded shadow-sm cursor-pointer transition-all hover:shadow-md"
              :class="`bg-${meeting.type} text-${meeting.type}-content`"
              :style="{
                top: `${meeting.top}px`,
                height: `${meeting.height}px`,
                left: '2px',
                right: '2px'
              }"
              @click="handleMeetingClick(meeting)"
            >
              <div class="text-xs font-semibold truncate">{{ meeting.title }}</div>
              <div class="text-xs opacity-75">{{ meeting.startTime }} - {{ meeting.endTime }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure proper scrolling */
.overflow-auto {
  scrollbar-width: thin;
}

.overflow-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>