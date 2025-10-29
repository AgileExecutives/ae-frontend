<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'
import ViewCard from '../ViewCard.vue'

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
  previousWeek: []
  nextWeek: []    
  goToToday: []
}>()

// Current time tracking
const currentTime = ref(new Date())
const updateCurrentTime = () => {
  currentTime.value = new Date()
}

let timeInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (props.showCurrentTime) {
    timeInterval = setInterval(updateCurrentTime, 60000) // Update every minute
  }
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Grid calculations
const totalHours = computed(() => props.endHour - props.startHour)
const totalSlots = computed(() => totalHours.value * 12) // 12 slots per hour (5-min resolution)
const gridHeight = computed(() => totalSlots.value * props.slotHeight)

// Week days generation (Monday to Sunday)
const weekDays = computed(() => {
  const days = []
  const startOfWeek = new Date(props.date)
  // Get Monday (day 1) - adjust for Sunday being 0
  const dayOfWeek = startOfWeek.getDay()
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startOfWeek.setDate(startOfWeek.getDate() + daysFromMonday)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    days.push({
      date: day,
      dateStr: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: day.getDate(),
      isToday: day.toDateString() === new Date().toDateString()
    })
  }
  return days
})

// Time slot generation
const timeSlots = computed(() => {
  const slots = []
  for (let hour = props.startHour; hour < props.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const slotIndex = ((hour - props.startHour) * 12) + (minute / 5)
      slots.push({
        time,
        slotIndex,
        isHourMark: minute === 0,
        isHalfHour: minute === 30,
        isQuarterHour: minute === 15 || minute === 45
      })
    }
  }
  return slots
})

// Hour-only slots for grid lines (only show lines for full hours)
const hourSlots = computed(() => {
  const slots = []
  for (let hour = props.startHour; hour <= props.endHour; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`
    const slotIndex = (hour - props.startHour) * 12
    slots.push({
      time,
      slotIndex
    })
  }
  return slots
})

// Convert time string to slot index
const timeToSlotIndex = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const safeHours = hours ?? 0
  const safeMinutes = minutes ?? 0
  return ((safeHours - props.startHour) * 12) + (safeMinutes / 5)
}

// Current time position
const currentTimePosition = computed(() => {
  if (!props.showCurrentTime) return null
  
  const now = currentTime.value
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  if (currentHour < props.startHour || currentHour >= props.endHour) {
    return null // Current time is outside visible range
  }
  
  const exactSlot = ((currentHour - props.startHour) * 12) + (currentMinute / 5)
  return exactSlot * props.slotHeight
})

// Process meetings with overlap detection per day
const processedMeetings = computed(() => {
  const allProcessed: Array<Meeting & {
    startSlot: number
    duration: number
    top: number
    height: number
    column: number
    columnCount: number
    width: string
    left: string
    dayIndex: number
    dayColumn: string
    dayWidth: string
  }> = []

  // Process meetings for each day
  weekDays.value.forEach((day, dayIndex) => {
    const dayMeetings = displayMeetings.value.filter(meeting => {
      // For sample meetings without date, show on current day
      if (!meeting.date) return dayIndex === 0
      return meeting.date === day.dateStr
    })

    // Sort meetings by start time for this day
    dayMeetings.sort((a, b) => a.startTime.localeCompare(b.startTime))

    const dayProcessed: Array<Meeting & {
      startSlot: number
      duration: number
      top: number
      height: number
      column: number
      columnCount: number
      width: string
      left: string
    }> = []

    dayMeetings.forEach((meeting) => {
      const startSlot = timeToSlotIndex(meeting.startTime)
      const endSlot = timeToSlotIndex(meeting.endTime)
      const duration = endSlot - startSlot
      
      // Find overlapping meetings within this day
      const overlapping = dayProcessed.filter(p => 
        !(endSlot <= p.startSlot || startSlot >= (p.startSlot + p.duration))
      )
      
      const column = overlapping.length
      const columnCount = Math.max(1, overlapping.length + 1)
      
      // Update column count for overlapping meetings
      overlapping.forEach(overlap => {
        overlap.columnCount = Math.max(overlap.columnCount, columnCount)
        overlap.width = `calc(${100 / overlap.columnCount}% - 2px)`
        overlap.left = `calc(${100 / overlap.columnCount}% * ${overlap.column} + 1px)`
      })
      
      dayProcessed.push({
        ...meeting,
        startSlot,
        duration,
        top: startSlot * props.slotHeight,
        height: Math.max(duration * props.slotHeight, props.slotHeight * 2), // Minimum height
        column,
        columnCount,
        width: `calc(${100 / columnCount}% - 2px)`,
        left: `calc(${100 / columnCount}% * ${column} + 1px)`
      })
    })

    // Add day positioning to each meeting
    dayProcessed.forEach(meeting => {
      allProcessed.push({
        ...meeting,
        dayIndex,
        dayColumn: `${dayIndex + 2}`, // +2 because first column is time labels
        dayWidth: `calc(${100 / 7}% - 1px)`
      })
    })
  })

  return allProcessed
})

// Use sample data if no meetings provided
const displayMeetings = computed(() => 
  props.meetings.length > 0 ? props.meetings : []
)

// Handle time slot click
const handleTimeSlotClick = (time: string, dateStr?: string) => {
  emit('timeSlotClick', time)
  console.log('Time slot clicked:', time, 'on date:', dateStr)
}

// Handle meeting click
const handleMeetingClick = (meeting: Meeting) => {
  emit('meetingClick', meeting)
}

// Navigation handlers
const previousWeek = () => {
  emit('previousWeek')
}

const nextWeek = () => {
  emit('nextWeek')
}

const goToToday = () => {
  emit('goToToday')
}

// Format date for display
const formattedDate = computed(() => {
  return props.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Current time string
const currentTimeString = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Week title for ViewCard
const weekTitle = computed(() => {
  if (weekDays.value.length === 0) return 'Week View'
  
  // Desktop title
  const desktopTitle = `Week of ${weekDays.value[0]?.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekDays.value[6]?.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  
  // Mobile title
  const mobileTitle = `${weekDays.value[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays.value[6]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  
  // Return desktop title for now - ViewCard can handle responsive display
  return desktopTitle
})
</script>

<template>
  <ViewCard :title="weekTitle">
    <template #actions>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="previousWeek" title="Previous Week">
        <ChevronLeft class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="nextWeek" title="Next Week">
        <ChevronRight class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-primary btn-circle" @click="goToToday" title="Go to Today">
        <CalendarDays class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
    </template>

    <template #content>
      <div class="h-full p-0">
      <div class="grid border-t border-base-200" style="grid-template-columns: 60px repeat(7, 1fr); padding-right: 8px;">
        <!-- Time Column Header -->
        <div class="p-2 border-r border-base-200 bg-base-50/50 text-center text-xs font-medium text-base-content/70">
          Time
        </div>
        
        <!-- Day Headers -->
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="p-2 border-r border-base-200 bg-base-100/70 text-center"
          :class="{ 'bg-primary/10': day.isToday }"
        >
          <div class="text-xs font-medium text-base-content/70">{{ day.dayName }}</div>
          <div 
            class="text-lg font-semibold mt-1"
            :class="{ 'text-primary': day.isToday, 'text-base-content': !day.isToday }"
          >
            {{ day.dayNumber }}
          </div>
        </div>
      </div>

      <!-- Calendar Body -->
      <div 
        class="relative overflow-auto"
        :style="{ height: '70vh' }"
      >
        <div class="grid" :style="{ height: `${gridHeight}px`, gridTemplateColumns: '60px repeat(7, 1fr)' }">
          <!-- Time Labels Column -->
          <div class="relative border-r border-base-200 bg-base-50/50">
            <div
              v-for="(slot, index) in hourSlots"
              :key="`time-${slot.time}`"
              class="absolute right-2 text-xs text-base-content/70 select-none"
              :class="index === 0 ? '' : '-translate-y-1/2'"
              :style="{ top: `${slot.slotIndex * slotHeight + (index === 0 ? 8 : 0)}px` }"
            >
              {{ slot.time }}
            </div>
          </div>

          <!-- Day Columns -->
          <div
            v-for="(day, dayIndex) in weekDays"
            :key="day.dateStr"
            class="relative border-r border-base-200"
            :class="{ 'bg-primary/5': day.isToday }"
          >
            <!-- Hour Grid Lines -->
            <div
              v-for="hourSlot in hourSlots"
              :key="`grid-${day.dateStr}-${hourSlot.time}`"
              class="absolute w-full border-t border-base-200"
              :style="{ top: `${hourSlot.slotIndex * slotHeight}px` }"
            />

            <!-- Clickable Time Slots -->
            <div
              v-for="slot in timeSlots"
              :key="`click-${day.dateStr}-${slot.time}`"
              class="absolute w-full hover:bg-base-200/30 transition-colors cursor-pointer"
              :style="{
                top: `${slot.slotIndex * slotHeight}px`,
                height: `${slotHeight}px`
              }"
              @click="handleTimeSlotClick(slot.time, day.dateStr)"
            />

            <!-- Current Time Indicator -->
            <div
              v-if="day.isToday && currentTimePosition !== null"
              class="absolute w-full h-[2px] bg-error z-20"
              :style="{ top: `${currentTimePosition}px` }"
            >
              <div class="w-2 h-2 bg-error rounded-full -ml-1 -mt-1"></div>
            </div>

            <!-- Meetings for this day -->
            <div
              v-for="meeting in processedMeetings.filter(m => m.dayIndex === dayIndex)"
              :key="meeting.id"
              class="absolute rounded shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:z-30 group"
              :class="`bg-${meeting.type} text-${meeting.type}-content border border-${meeting.type}`"
              :style="{
                top: `${meeting.top}px`,
                height: `${meeting.height}px`,
                left: meeting.left,
                width: meeting.width,
                zIndex: 10
              }"
              @click="handleMeetingClick(meeting)"
            >
              <!-- Meeting Content -->
              <div class="p-1 h-full flex flex-col text-xs">
                <div class="font-medium truncate" :title="meeting.title">{{ meeting.title }}</div>
                <div class="text-xs opacity-90">
                  {{ meeting.startTime }}–{{ meeting.endTime }}
                </div>
                <div 
                  v-if="meeting.description && meeting.height > 32" 
                  class="text-xs opacity-75 mt-1 line-clamp-2 flex-1"
                  :title="meeting.description"
                >
                  {{ meeting.description }}
                </div>
              </div>

              <!-- Tooltip -->
              <div class="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">
                <div class="bg-base-100 text-base-content p-3 rounded-lg shadow-xl border border-base-300 min-w-[200px] max-w-[300px]">
                  <div class="font-semibold">{{ meeting.title }}</div>
                  <div class="text-sm opacity-75 mt-1">
                    {{ meeting.startTime }} - {{ meeting.endTime }}
                  </div>
                  <div v-if="meeting.description" class="text-sm mt-2">
                    {{ meeting.description }}
                  </div>
                  <div v-if="meeting.attendees?.length" class="text-sm mt-2">
                    <div class="font-medium">Attendees:</div>
                    <div class="mt-1">{{ meeting.attendees.join(', ') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>

    <template #footer>
      <div class="text-sm text-base-content/70">
        {{ displayMeetings.length }} meetings scheduled
      </div>
      <div class="text-sm text-base-content/70">
        Current time: {{ currentTimeString }}
      </div>
    </template>
  </ViewCard>
</template>

<style scoped>
/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--b2));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--b3));
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.2);
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tooltip positioning */
.tooltip {
  position: relative;
}
</style>
