<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
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
  isLoading?: boolean
  error?: string | null
}>(), {
  meetings: () => [],
  startHour: 8,
  endHour: 18,
  slotHeight: 8,
  date: () => new Date(),
  showCurrentTime: true,
  isLoading: false,
  error: null
})

const emit = defineEmits<{
  meetingClick: [meeting: Meeting]
  timeSlotClick: [time: string]
  createMeeting: [startTime: string, endTime: string]
  previousWeek: []
  nextWeek: []    
  goToToday: []
  retryLoad: []
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
    isAllDayInGrid?: boolean
  }> = []

  // Process meetings for each day
  weekDays.value.forEach((day, dayIndex) => {
    if (!day.dateStr) return
    
    // Get all-day events for this day
    const dayAllDayEvents = allDayEvents.value.filter(meeting => {
      if (!meeting.date) return dayIndex === 0
      const meetingDateStr = (meeting.date || '').split('T')[0]
      return meetingDateStr === day.dateStr
    })

    // Get regular timed meetings for this day
    const dayTimedMeetings = timedEvents.value.filter(meeting => {
      // For sample meetings without date, show on current day
      if (!meeting.date) return dayIndex === 0
      
      // Convert ISO format to simple date for comparison
      const meetingDateStr = (meeting.date || '').split('T')[0]
      return meetingDateStr === day.dateStr
    })

    // Sort timed meetings by start time for this day
    dayTimedMeetings.sort((a, b) => a.startTime.localeCompare(b.startTime))

    const dayProcessed: Array<Meeting & {
      startSlot: number
      duration: number
      top: number
      height: number
      column: number
      columnCount: number
      width: string
      left: string
      isAllDayInGrid?: boolean
    }> = []

    // First, process all-day events and place them at the top of the day column
    dayAllDayEvents.forEach((meeting, index) => {
      dayProcessed.push({
        ...meeting,
        startSlot: -dayAllDayEvents.length + index, // Negative values to place at top
        duration: 1,
        top: (-dayAllDayEvents.length + index) * props.slotHeight,
        height: props.slotHeight - 2,
        column: 0,
        columnCount: 1,
        width: `calc(100% - 4px)`,
        left: `2px`,
        isAllDayInGrid: true
      })
    })

    // Then, process regular timed meetings
    dayTimedMeetings.forEach((meeting) => {
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

// Use props meetings directly
const displayMeetings = computed(() => {
  return props.meetings
})

// Separate all-day events from regular timed events
const allDayEvents = computed(() => {
  return displayMeetings.value.filter(meeting => {
    // Check if meeting is all-day based on backend field or time indicators
    return meeting.isAllDay === true ||
           (meeting.startTime === '00:00' && meeting.endTime === '23:59') ||
           (meeting.startTime === '00:00' && meeting.endTime === '00:00')
  })
})

const timedEvents = computed(() => {
  return displayMeetings.value.filter(meeting => {
    // Only timed events (not all-day)
    return meeting.isAllDay !== true &&
           !((meeting.startTime === '00:00' && meeting.endTime === '23:59') ||
             (meeting.startTime === '00:00' && meeting.endTime === '00:00'))
  })
})

// Group all-day events by day
const allDayEventsByDay = computed(() => {
  const eventsByDay: Record<string, typeof allDayEvents.value> = {}
  
  weekDays.value.forEach(day => {
    const dateStr = day.dateStr
    if (dateStr) {
      eventsByDay[dateStr] = allDayEvents.value.filter(meeting => {
        // For sample meetings without date, show on current day
        if (!meeting.date) return dateStr === weekDays.value[0]?.dateStr
        
        // Convert ISO format to simple date for comparison
        const meetingDateStr = (meeting.date || '').split('T')[0]
        return meetingDateStr === dateStr
      })
    }
  })
  
  return eventsByDay
})

// Handle time slot click
const handleTimeSlotClick = (time: string, dateStr?: string) => {
  emit('timeSlotClick', time)
}

// Handle meeting click
const handleMeetingClick = (meeting: Meeting) => {
  emit('meetingClick', meeting)
}

// All-day event display helper
const getAllDayDisplay = (dayEvents: typeof allDayEvents.value) => {
  if (dayEvents.length === 0) return null
  if (dayEvents.length === 1) {
    return {
      type: 'single',
      event: dayEvents[0],
      count: 1
    }
  }
  return {
    type: 'multiple',
    events: dayEvents,
    count: dayEvents.length,
    primary: dayEvents[0]
  }
}

// Helper to safely get all-day events for a specific day
const getAllDayEventsForDay = (dateStr: string) => {
  return allDayEventsByDay.value[dateStr] || []
}

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

// Create a computed that provides safe access to all-day events per day
const safeAllDayEventsByDay = computed(() => {
  const result: Record<string, Meeting[]> = {}
  weekDays.value.forEach(day => {
    if (day.dateStr) {
      const events = getAllDayEventsForDay(day.dateStr)
      result[day.dateStr] = sortAllDayEventsByPriority(events)
    }
  })
  return result
})

// Safe helper functions to avoid TypeScript errors
const getSafeAllDayEvents = (dateStr: string): Meeting[] => {
  return safeAllDayEventsByDay.value[dateStr] || []
}

const hasAllDayEvents = (dateStr: string): boolean => {
  return getSafeAllDayEvents(dateStr).length > 0
}

const getFirstAllDayEvent = (dateStr: string): Meeting | undefined => {
  const events = getSafeAllDayEvents(dateStr)
  return events.length > 0 ? events[0] : undefined
}

// Meeting color mapping for Tailwind CSS classes - solid colors for visibility
const getMeetingClasses = (classification: string, eventType?: string, isAllDay?: boolean) => {
  // Special handling for public holidays - always red
  if (eventType === 'public_holiday' || eventType === 'holiday' || eventType === 'feiertag') {
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
  
  return classes
}

// All-day event color mapping - more compact style
const getAllDayClasses = (classification: string, eventType?: string) => {
  // Special handling for public holidays - always red
  if (eventType === 'public_holiday') {
    return 'bg-red-500/90 text-white border-red-600/50'
  }
  
  // Also check for holiday keyword variations
  if (eventType === 'holiday' || eventType === 'feiertag') {
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
    'error': 'bg-red-500/80 text-white border-red-600/50',
    'school_holiday': 'bg-orange-500/80 text-white border-orange-600/50'
  }
  
  const classes = colorMap[validClassification as keyof typeof colorMap] || colorMap.primary
  
  return classes
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
      <button 
        class="btn btn-xs lg:btn-sm btn-outline btn-circle" 
        :class="{ 'loading loading-spinner': isLoading }"
        :disabled="isLoading"
        @click="previousWeek" 
        title="Previous Week"
      >
        <ChevronLeft v-if="!isLoading" class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button 
        class="btn btn-xs lg:btn-sm btn-outline btn-circle" 
        :class="{ 'loading loading-spinner': isLoading }"
        :disabled="isLoading"
        @click="nextWeek" 
        title="Next Week"
      >
        <ChevronRight v-if="!isLoading" class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button 
        class="btn btn-xs lg:btn-sm btn-primary btn-circle" 
        :class="{ 'loading loading-spinner': isLoading }"
        :disabled="isLoading"
        @click="goToToday" 
        title="Go to Today"
      >
        <CalendarDays v-if="!isLoading" class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
    </template>

    <template #content>
      <div class="flex flex-col h-full p-0">
      <div class="grid border-t border-base-200 flex-shrink-0 min-w-0" style="grid-template-columns: 60px repeat(7, 1fr); padding-right: 8px;">
        <!-- Time Column Header -->
        <div class="p-2 border-r border-base-200 bg-base-50/50 text-center text-xs font-medium text-base-content/70">
          Time
        </div>
        
        <!-- Day Headers -->
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="p-2 border-r border-base-200 bg-base-100/70 text-center min-h-[80px] flex flex-col min-w-0 overflow-hidden"
          :class="{ 'bg-primary/10': day.isToday }"
        >
          <!-- Date info -->
          <div class="flex-shrink-0">
            <div class="text-xs font-medium text-base-content/70">{{ day.dayName }}</div>
            <div 
              class="text-lg font-semibold mt-1"
              :class="{ 'text-primary': day.isToday, 'text-base-content': !day.isToday }"
            >
              {{ day.dayNumber }}
            </div>
          </div>
          
          <!-- All-day events section -->
          <div class="flex-1 mt-2 min-h-[24px] relative group">
            <div v-if="hasAllDayEvents(day.dateStr || '')" class="w-full min-w-0">
              <!-- Single all-day event -->
              <div 
                v-if="getSafeAllDayEvents(day.dateStr || '').length === 1"
                class="text-xs px-2 py-1 rounded border cursor-pointer truncate w-full min-w-0 max-w-full overflow-hidden"
                :class="getAllDayClasses((getFirstAllDayEvent(day.dateStr || '')?.classification) || 'primary', getFirstAllDayEvent(day.dateStr || '')?.type)"
                :title="getFirstAllDayEvent(day.dateStr || '')?.title || ''"
                @click="() => { const event = getFirstAllDayEvent(day.dateStr || ''); if (event) handleMeetingClick(event); }"
              >
                <span class="block truncate">{{ getFirstAllDayEvent(day.dateStr || '')?.title }}</span>
              </div>
              
              <!-- Multiple all-day events stack - Daisy UI style -->
              <div 
                v-else
                class="stack w-full min-w-0"
              >
                <!-- Stack elements (back to front) - only show top 3 for visual effect -->
                <div 
                  v-for="(event, index) in getSafeAllDayEvents(day.dateStr || '').slice(0, 3)"
                  :key="`stack-${event.id}-${index}`"
                  class="text-xs px-2 py-1 rounded border cursor-pointer w-full min-w-0 max-w-full overflow-hidden"
                  :class="getAllDayClasses(event.classification || 'primary', event.type)"
                  :style="{ zIndex: getSafeAllDayEvents(day.dateStr || '').length - index }"
                  @click="() => handleMeetingClick(event)"
                >
                  <span class="block truncate">{{ event.title }}</span>
                </div>
                
                <!-- Hover tooltip with all events (priority order) -->
                <div class="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-base-100 text-base-content p-3 rounded-lg shadow-xl border border-base-300 min-w-[200px] max-w-[300px]">
                    <div class="font-semibold mb-2">All-day events ({{ getSafeAllDayEvents(day.dateStr || '').length }})</div>
                    <div class="text-xs text-base-content/60 mb-2">Priority: Public holidays → Other events → School holidays</div>
                    <div class="space-y-2">
                      <div 
                        v-for="event in getSafeAllDayEvents(day.dateStr || '')"
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
          </div>
        </div>
      </div>

      <!-- Calendar Body -->
      <div 
        class="relative overflow-auto flex-1"
      >
        <div class="grid min-w-0" :style="{ height: `${gridHeight}px`, gridTemplateColumns: '60px repeat(7, 1fr)' }">
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
            class="relative border-r border-base-200 min-w-0 overflow-hidden"
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
              class="absolute rounded shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:z-30 group border"
              :class="getMeetingClasses(meeting.classification || 'primary', meeting.type, meeting.isAllDayInGrid)"
              :style="{
                top: `${meeting.top}px`,
                height: `${meeting.height}px`,
                left: meeting.left,
                width: meeting.width,
                zIndex: meeting.isAllDayInGrid ? 15 : 10
              }"
              @click="handleMeetingClick(meeting)"
            >
              <!-- Meeting Content -->
              <div class="p-1 h-full flex flex-col text-xs">
                <div class="font-medium truncate" :title="meeting.title">{{ meeting.title }}</div>
                <!-- Show time only for regular (non all-day) events -->
                <div v-if="!meeting.isAllDayInGrid" class="text-xs opacity-90">
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
      <div class="text-sm text-base-content/70 flex items-center gap-2">
        <span v-if="isLoading">Loading events...</span>
        <span v-else>{{ displayMeetings.length }} meetings scheduled</span>
        <div v-if="isLoading" class="loading loading-spinner loading-xs"></div>
      </div>
      <div class="text-sm text-base-content/70">
        Current time: {{ currentTimeString }}
      </div>
      <div v-if="error" class="text-sm text-error flex items-center gap-2">
        <span>Error: {{ error }}</span>
        <button class="btn btn-xs btn-outline" @click="$emit('retryLoad')">
          Retry
        </button>
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
