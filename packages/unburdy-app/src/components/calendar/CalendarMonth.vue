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
  date?: Date
}>(), {
  meetings: () => [],
  date: () => new Date()
})

const emit = defineEmits<{
  meetingClick: [meeting: Meeting]
  dateClick: [date: string]
  previousMonth: []
  nextMonth: []
  goToToday: []
}>()

// Screen size detection
const isMobile = ref(false)
const updateScreenSize = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
})

// Get first day of current month
const firstDayOfMonth = computed(() => {
  return new Date(props.date.getFullYear(), props.date.getMonth(), 1)
})

// Get last day of current month
const lastDayOfMonth = computed(() => {
  return new Date(props.date.getFullYear(), props.date.getMonth() + 1, 0)
})

// Get start of calendar grid (includes prev month days)
const calendarStart = computed(() => {
  const firstDay = firstDayOfMonth.value
  const startDate = new Date(firstDay)
  // Get Monday of the week containing first day of month
  const dayOfWeek = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  startDate.setDate(firstDay.getDate() - dayOfWeek)
  return startDate
})

// Generate calendar grid (6 weeks x 7 days = 42 days)
const calendarDays = computed(() => {
  const days = []
  const start = new Date(calendarStart.value)
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === props.date.getMonth()
    const isToday = dateStr === new Date().toISOString().split('T')[0]
    
    // Get meetings for this day
    const dayMeetings = props.meetings.filter(meeting => meeting.date === dateStr)
    
    days.push({
      date,
      dateStr,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      meetings: dayMeetings,
      weekNumber: getWeekNumber(date)
    })
  }
  
  return days
})

// Group days by weeks
const calendarWeeks = computed(() => {
  const weeks = []
  for (let i = 0; i < calendarDays.value.length; i += 7) {
    const week = calendarDays.value.slice(i, i + 7)
    weeks.push({
      weekNumber: week[0]?.weekNumber || 1,
      days: week
    })
  }
  return weeks
})

// Get week number (ISO 8601)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Month year string
const monthYearString = computed(() => {
  return props.date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

// Navigation handlers
const previousMonth = () => {
  emit('previousMonth')
}

const nextMonth = () => {
  emit('nextMonth')
}

const goToToday = () => {
  emit('goToToday')
}

// Handle date click
const handleDateClick = (dateStr: string) => {
  emit('dateClick', dateStr)
}

// Handle meeting click
const handleMeetingClick = (meeting: Meeting) => {
  emit('meetingClick', meeting)
}

// Day names
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Month title for ViewCard
const monthTitle = computed(() => {
  return props.date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })
})
</script>

<template>
  <ViewCard :title="monthTitle">
    <template #actions>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="previousMonth" title="Previous Month">
        <ChevronLeft class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="nextMonth" title="Next Month">
        <ChevronRight class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-primary btn-circle" @click="goToToday" title="Go to Today">
        <CalendarDays class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
    </template>

    <template #content>
      <div class="flex flex-col h-full p-0">
      <div class="bg-base-100/40 flex flex-col" :style="{ height: '80vh' }">
        <!-- Calendar Header with Day Names -->
        <div class="grid border-b border-base-200 bg-base-50 flex-shrink-0" :style="{ gridTemplateColumns: isMobile ? '25px repeat(7, 1fr)' : '35px repeat(7, 1fr)' }">
          <!-- Week number column header -->
          <div class="p-1 text-center text-xs font-medium text-base-content/50 border-r border-base-200">
            <span class="lg:hidden">W</span>
            <span class="hidden lg:block">WK</span>
          </div>
          <!-- Day name headers -->
          <div
            v-for="dayName in dayNames"
            :key="dayName"
            class="p-1 lg:p-2 text-center text-xs font-medium text-base-content/70 border-r border-base-200 last:border-r-0"
          >
            <!-- Mobile: Show first letter only -->
            <span class="lg:hidden">{{ dayName.charAt(0) }}</span>
            <!-- Desktop: Show 3 letters -->
            <span class="hidden lg:block">{{ dayName }}</span>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid flex-1" :style="{ gridTemplateColumns: isMobile ? '25px repeat(7, 1fr)' : '35px repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)' }">
          <template v-for="week in calendarWeeks" :key="`week-${week.weekNumber}`">
            <!-- Week number -->
            <div class="border-r border-b border-base-200 bg-base-50/50 p-1 text-center text-xs font-medium text-base-content/50 flex items-center justify-center">
              {{ week.weekNumber }}
            </div>
            
            <!-- Days in week -->
            <div
              v-for="day in week.days"
              :key="day.dateStr"
              class="border-r border-b border-base-200 last:border-r-0 p-1 lg:p-2 cursor-pointer hover:bg-base-50 transition-colors flex flex-col"
              :class="{
                'bg-base-50': !day.isCurrentMonth,
                'bg-primary/10': day.isToday,
                'text-base-content/50': !day.isCurrentMonth,
                'text-base-content': day.isCurrentMonth
              }"
              @click="handleDateClick(day.dateStr!)"
            >
              <!-- Date number -->
              <div
                class="text-sm font-medium mb-1"
                :class="{
                  'text-primary font-bold': day.isToday,
                  'text-base-content/50': !day.isCurrentMonth
                }"
              >
                {{ day.dayNumber }}
              </div>
              
              <!-- Meetings -->
              <div class="space-y-1">
                <div
                  v-for="meeting in day.meetings.slice(0, 4)"
                  :key="meeting.id"
                  class="text-xs truncate cursor-pointer transition-all duration-200 hover:shadow-md rounded px-1 py-0.5"
                  :class="`bg-${meeting.type} text-${meeting.type}-content border border-${meeting.type}`"
                  @click.stop="handleMeetingClick(meeting)"
                  :title="`${meeting.startTime} - ${meeting.title}`"
                >
                  {{ meeting.startTime }} {{ meeting.title }}
                </div>
                
                <!-- Show more indicator -->
                <div
                  v-if="day.meetings.length > 4"
                  class="text-xs text-base-content/60 font-medium"
                >
                  +{{ day.meetings.length - 4 }} more
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      </div>
    </template>

    <template #footer>
      <div class="text-sm text-base-content/70">
        {{ meetings.length }} meetings this month
      </div>
      <div class="text-sm text-base-content/70">
        {{ monthTitle }}
      </div>
    </template>
  </ViewCard>
</template>

<style scoped>
/* Ensure consistent grid layout */
.grid-cols-8 > * {
  min-width: 0;
}

/* Meeting hover effects */
.space-y-1 > div:hover {
  z-index: 10;
}
</style>