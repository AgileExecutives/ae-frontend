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
  monthClick: [month: number]
  previousYear: []
  nextYear: []
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

// Year string
const yearString = computed(() => {
  return props.date.getFullYear().toString()
})

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Generate months data
const monthsData = computed(() => {
  const currentYear = props.date.getFullYear()
  const currentMonth = new Date().getMonth()
  const currentDate = new Date()
  
  return monthNames.map((name, index) => {
    // Get first and last day of the month
    const firstDay = new Date(currentYear, index, 1)
    const lastDay = new Date(currentYear, index + 1, 0)
    
    // Calculate starting position (0 = Monday, 6 = Sunday)
    const startDay = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    
    // Generate calendar days array
    const calendarDays = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      calendarDays.push({ dayNumber: null, isCurrentMonth: false })
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(currentYear, index, day)
      const isToday = currentYear === currentDate.getFullYear() && 
                     index === currentDate.getMonth() && 
                     day === currentDate.getDate()
      
      calendarDays.push({
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
        dayOfWeek: (startDay + day - 1) % 7
      })
    }
    
    // Fill remaining cells to complete 6 weeks (42 cells)
    while (calendarDays.length < 42) {
      calendarDays.push({ dayNumber: null, isCurrentMonth: false })
    }
    
    // Count meetings in this month
    const monthMeetings = props.meetings.filter(meeting => {
      if (!meeting.date) return false
      const meetingDate = new Date(meeting.date)
      return meetingDate.getFullYear() === currentYear && 
             meetingDate.getMonth() === index
    })
    
    // Group meetings by type for stats
    const meetingsByType = monthMeetings.reduce((acc, meeting) => {
      acc[meeting.type] = (acc[meeting.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      name,
      index,
      year: currentYear,
      firstDay,
      lastDay,
      calendarDays,
      isCurrentMonth: currentYear === currentDate.getFullYear() && index === currentMonth,
      totalMeetings: monthMeetings.length,
      meetingsByType,
      meetings: monthMeetings
    }
  })
})

// Navigation handlers
const previousYear = () => {
  emit('previousYear')
}

const nextYear = () => {
  emit('nextYear')
}

const goToToday = () => {
  emit('goToToday')
}

// Handle month click
const handleMonthClick = (monthIndex: number) => {
  emit('monthClick', monthIndex)
}

// Handle meeting click
const handleMeetingClick = (meeting: Meeting) => {
  emit('meetingClick', meeting)
}

// Get primary meeting type for month color
const getPrimaryMeetingType = (meetingsByType: Record<string, number>) => {
  const types = Object.keys(meetingsByType)
  if (types.length === 0) return 'neutral'
  
  // Return the type with most meetings
  return types.reduce((a, b) => (meetingsByType[a] || 0) > (meetingsByType[b] || 0) ? a : b)
}

// Year title for ViewCard
const yearTitle = computed(() => {
  return props.date.getFullYear().toString()
})
</script>

<template>
  <ViewCard :title="yearTitle">
    <template #actions>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="previousYear" title="Previous Year">
        <ChevronLeft class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-outline btn-circle" @click="nextYear" title="Next Year">
        <ChevronRight class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
      <button class="btn btn-xs lg:btn-sm btn-primary btn-circle" @click="goToToday" title="Go to Today">
        <CalendarDays class="w-3 h-3 lg:w-4 lg:h-4" />
      </button>
    </template>

    <template #content>
      <div class="flex flex-col h-full p-0">
      <div class="bg-base-100/40 flex flex-col" :style="{ height: '80vh' }">
        <!-- Year Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 lg:p-4 overflow-y-auto flex-1">
          <div
            v-for="month in monthsData"
            :key="month.index"
            class="card bg-base-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-fit"
            :class="{
              'ring-2 ring-primary': month.isCurrentMonth,
              'hover:bg-base-100': !month.isCurrentMonth
            }"
            @click="handleMonthClick(month.index)"
          >
            <div class="card-body p-1 lg:p-2">
              <!-- Month Header -->
              <div class="flex justify-between items-center mb-1 lg:mb-2">
                <h3 
                  class="font-semibold text-[10px] lg:text-xs"
                  :class="{ 'text-primary': month.isCurrentMonth }"
                >
                  <!-- Mobile: Show abbreviated month -->
                  <span class="lg:hidden">{{ month.name.substring(0, 3) }}</span>
                  <!-- Desktop: Show full month -->
                  <span class="hidden lg:block">{{ month.name }}</span>
                </h3>
                <div 
                  v-if="month.totalMeetings > 0"
                  class="badge badge-xs"
                  :class="`badge-${getPrimaryMeetingType(month.meetingsByType)}`"
                >
                  {{ month.totalMeetings }}
                </div>
              </div>

              <!-- Mini Calendar Grid -->
              <div class="grid grid-cols-7 gap-px text-xs">
                <!-- Day headers -->
                <div v-for="(day, index) in ['M', 'T', 'W', 'T', 'F', 'S', 'S']" 
                     :key="day" 
                     class="text-center text-[8px] lg:text-[10px] font-semibold py-0.5 lg:py-1"
                     :class="index === 6 ? 'text-red-500/50' : 'text-base-content/50'">
                  {{ day }}
                </div>
                
                <!-- Calendar days -->
                <template v-for="(day, dayIndex) in month.calendarDays" :key="`${month.index}-${dayIndex}`">
                  <div 
                    class="aspect-square flex items-center justify-center min-h-[12px] lg:min-h-[16px]"
                    :class="{
                      'text-base-content/30': !day.isCurrentMonth,
                      'bg-primary text-primary-content rounded-sm': day.isToday,
                      'text-red-500': dayIndex % 7 === 6 && day.isCurrentMonth,
                      'text-base-content': day.isCurrentMonth && dayIndex % 7 !== 6
                    }"
                  >
                    <span v-if="day.dayNumber">{{ day.dayNumber }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>

    <template #footer>
      <div class="text-sm text-base-content/70">
        {{ meetings.length }} meetings this year
      </div>
      <div class="text-sm text-base-content/70">
        {{ yearTitle }}
      </div>
    </template>
  </ViewCard>
</template>

<style scoped>
/* Ensure grid items are properly sized */
.grid-cols-7 > div {
  min-width: 0;
}

.aspect-square {
  aspect-ratio: 1;
}
</style>