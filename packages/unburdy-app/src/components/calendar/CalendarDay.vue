<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'
import ViewCard from '../ViewCard.vue'

interface Meeting {
  id: string
  title: string
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
  classification: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'school_holiday'
  type?: string // Original backend type for holidays and other identification
  description?: string
  attendees?: string[]
  date?: string // Start date - YYYY-MM-DD format
  endDate?: string // End date - YYYY-MM-DD format (for multi-day events)
  isAllDay?: boolean // All-day event flag
  isMultiDay?: boolean // Flag to indicate if event spans multiple days
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

// Debug watch for meetings prop
watch(() => props.meetings, (newMeetings) => {
  console.log('📅 CalendarDay received meetings:', newMeetings.length)
  newMeetings.forEach(meeting => {
    if (meeting.title && meeting.title.includes('Allerheiligen')) {
      console.log('📅 CalendarDay received Allerheiligen:', meeting)
    }
  })
}, { immediate: true })

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

// Priority system for all-day events: public_holiday > other all day > school_holiday
const getEventPriority = (event: Meeting): number => {
  if (event.type === 'public_holiday' || event.type === 'holiday' || event.type === 'feiertag') {
    return 3 // Highest priority
  }
  if (event.classification === 'school_holiday' || event.type === 'school_holiday') {
    return 1 // Lowest priority
  }
  return 2 // Other all-day events - medium priority
}

// Sort all-day events by priority (highest first)
const sortAllDayEventsByPriority = (events: Meeting[]): Meeting[] => {
  return [...events].sort((a, b) => getEventPriority(b) - getEventPriority(a))
}

// Separate all-day events from regular timed events
const allDayEvents = computed(() => {
  const allDay = props.meetings.filter(meeting => {
    // Check if meeting is all-day based on backend field or time indicators
    const isAllDay = meeting.isAllDay === true ||
                      (meeting.startTime === '00:00' && meeting.endTime === '23:59')
    
    // Debug logging for Allerheiligen
    if (meeting.title && meeting.title.includes('Allerheiligen')) {
      console.log('📅 CalendarDay - Allerheiligen all-day check:', {
        title: meeting.title,
        isAllDay: meeting.isAllDay,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        passesFilter: isAllDay
      })
    }
    
    return isAllDay
  })
  
  console.log('📅 CalendarDay - All-day events:', allDay.length, 'out of', props.meetings.length, 'total meetings')
  return sortAllDayEventsByPriority(allDay)
})

const timedEvents = computed(() => {
  return props.meetings.filter(meeting => {
    // Only timed events (not all-day)
    return meeting.isAllDay !== true &&
           !((meeting.startTime === '00:00' && meeting.endTime === '23:59') ||
             (meeting.startTime === '00:00' && meeting.endTime === '00:00'))
  })
})

// Process timed meetings for the current day (excluding all-day events)
const processedMeetings = computed(() => {
  console.log('📅 CalendarDay - Processing', timedEvents.value.length, 'timed meetings for', dayData.value.dateStr)
  return timedEvents.value
    .filter(meeting => {
      if (!meeting.date) return false
      
      // Convert ISO format to simple date for comparison
      const meetingDateStr = (meeting.date || '').split('T')[0]
      const isMatch = meetingDateStr === dayData.value.dateStr
      if (isMatch) {
        console.log('📅 CalendarDay - Found matching meeting:', meeting.title, 'for', dayData.value.dateStr)
      }
      return isMatch
    })
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

// Meeting color mapping for Tailwind CSS classes - solid colors for visibility
const getMeetingClasses = (classification: string, eventType?: string) => {
  // Special handling for public holidays - always red
  if (eventType === 'public_holiday' || eventType === 'holiday' || eventType === 'feiertag') {
    console.log('🎄 Public holiday detected in day view, applying red styling:', eventType)
    return 'bg-red-500 text-white border-red-600'
  }
  
  // Ensure we have a valid classification, default to primary
  const validClassification = classification || 'primary'
  
  // Using solid, explicit colors to ensure visibility
  const colorMap = {
    'primary': 'bg-blue-500 text-white border-blue-600',
    'secondary': 'bg-purple-500 text-white border-purple-600',
    'accent': 'bg-pink-500 text-white border-pink-600',
    'info': 'bg-cyan-500 text-white border-cyan-600',
    'success': 'bg-green-500 text-white border-green-600',
    'warning': 'bg-yellow-500 text-black border-yellow-600',
    'error': 'bg-red-500 text-white border-red-600',
    'school_holiday': 'bg-orange-500/80 text-white border-orange-600'
  }
  
  const classes = colorMap[validClassification as keyof typeof colorMap] || colorMap.primary
  console.log('🎨 Day view meeting classes:', { classification: validClassification, eventType, classes })
  return classes
}

// All-day event color mapping - more compact style
const getAllDayClasses = (classification: string, eventType?: string) => {
  // Special handling for public holidays - always red
  if (eventType === 'public_holiday' || eventType === 'holiday' || eventType === 'feiertag') {
    console.log('🎄 Public holiday detected in day view all-day event, applying red styling:', eventType)
    return 'bg-red-500/90 text-white border-red-600/50'
  }
  
  // Ensure we have a valid classification, default to primary
  const validClassification = classification || 'primary'
  
  // Compact styling for all-day events
  const colorMap = {
    'primary': 'bg-blue-500/80 text-white border-blue-600/50',
    'secondary': 'bg-purple-500/80 text-white border-purple-600/50',
    'accent': 'bg-pink-500/80 text-white border-pink-600/50',
    'info': 'bg-cyan-500/80 text-white border-cyan-600/50',
    'success': 'bg-green-500/80 text-white border-green-600/50',
    'warning': 'bg-yellow-500/80 text-black border-yellow-600/50',
    'error': 'bg-red-500/80 text-white border-red-600/50'
  }
  
  return colorMap[validClassification as keyof typeof colorMap] || colorMap.primary
}

// Day title for ViewCard
const dayTitle = computed(() => {
  if (!dayData.value) return 'Day View'
  
  // Desktop title
  const desktopTitle = dayData.value.date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  // Mobile title
  const mobileTitle = dayData.value.date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  
  // Return desktop title for now - ViewCard can handle responsive display
  return desktopTitle
})
</script>

<template>
  <ViewCard :title="dayTitle">
    <template #actions>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="previousDay" title="Previous Day">
        <ChevronLeft class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="nextDay" title="Next Day">
        <ChevronRight class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-primary btn-circle" @click="goToToday" title="Go to Today">
        <CalendarDays class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
    </template>

    <template #content>
      <div class="flex flex-col h-full p-0">

      <!-- All-Day Events Section -->
      <div v-if="allDayEvents.length > 0" class="border-b border-base-200 p-2 bg-base-50/50 relative group">
        <div class="text-xs font-medium text-base-content/70 mb-2">All Day</div>
        
        <!-- Single all-day event -->
        <div v-if="allDayEvents.length === 1 && allDayEvents[0]" class="space-y-1">
          <div 
            class="text-xs px-2 py-1 rounded border cursor-pointer"
            :class="getAllDayClasses(allDayEvents[0].classification || 'primary', allDayEvents[0].type)"
            :title="allDayEvents[0].title"
            @click="handleMeetingClick(allDayEvents[0])"
          >
            {{ allDayEvents[0].title }}
          </div>
        </div>
        
        <!-- Multiple all-day events stack - Daisy UI style -->
        <div v-else class="relative">
          <div class="stack">
            <!-- Stack elements (back to front) - only show top 3 for visual effect -->
            <div 
              v-for="(event, index) in allDayEvents.slice(0, 3)"
              :key="`stack-${event.id}-${index}`"
              class="text-xs px-2 py-1 rounded border cursor-pointer"
              :class="getAllDayClasses(event.classification || 'primary', event.type)"
              :style="{ zIndex: allDayEvents.length - index }"
              @click="handleMeetingClick(event)"
            >
              {{ event.title }}
            </div>
          </div>
          
          <!-- Hover tooltip with all events (priority order) -->
          <div class="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none group-hover:pointer-events-auto">
            <div class="bg-base-100 text-base-content p-3 rounded-lg shadow-xl border border-base-300 min-w-[200px] max-w-[300px]">
              <div class="font-semibold mb-2">All-day events ({{ allDayEvents.length }})</div>
              <div class="text-xs text-base-content/60 mb-2">Priority: Public holidays → Other events → School holidays</div>
              <div class="space-y-2">
                <div 
                  v-for="event in allDayEvents"
                  :key="event.id"
                  class="text-sm p-2 rounded cursor-pointer hover:bg-base-200"
                  :class="getAllDayClasses(event.classification || 'primary', event.type)"
                  @click="handleMeetingClick(event)"
                >
                  <div class="font-medium">{{ event.title }}</div>
                  <div v-if="event.description" class="text-xs opacity-75 mt-1">{{ event.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar Body -->
      <div 
        class="relative overflow-auto flex-1"
      >
        <div class="grid" :style="{ height: `${gridHeight}px`, gridTemplateColumns: isMobile ? '40px 1fr' : '60px 1fr' }">
          <!-- Time Labels Column -->
          <div class="relative border-r border-base-200 bg-base-50/50">
            <div
              v-for="(slot, index) in hourSlots"
              :key="`time-${slot.time}`"
              class="absolute text-xs text-base-content/70 select-none"
              :class="[
                index === 0 ? '' : '-translate-y-1/2',
                isMobile ? 'right-1' : 'right-2'
              ]"
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
              :class="getMeetingClasses(meeting.classification, meeting.type)"
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
    </template>

    <template #footer>
      <div class="text-sm text-base-content/70">
        {{ meetings.length }} meetings today
      </div>
      <div class="text-sm text-base-content/70">
        Current time: {{ currentTimeString }}
      </div>
    </template>
  </ViewCard>
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