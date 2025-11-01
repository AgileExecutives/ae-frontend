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
      
      // Convert ISO format and parse date components to avoid timezone issues
      const meetingDateStr = (meeting.date || '').split('T')[0] || ''
      const [year, month] = meetingDateStr.split('-').map(Number)
      return year === currentYear && month === index + 1
    })
    
    // Group meetings by classification for stats
    const meetingsByClassification = monthMeetings.reduce((acc, meeting) => {
      acc[meeting.classification] = (acc[meeting.classification] || 0) + 1
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
      meetingsByClassification,
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

// Badge color mapping for Tailwind CSS classes
const getBadgeClass = (classification: string) => {
  const colorMap = {
    'primary': 'badge-primary',
    'secondary': 'badge-secondary',
    'accent': 'badge-accent',
    'info': 'badge-info',
    'success': 'badge-success',
    'warning': 'badge-warning',
    'error': 'badge-error',
    'school_holiday': 'badge-warning', // Orange-like styling for school holidays
    'neutral': 'badge-neutral'
  }
  return colorMap[classification as keyof typeof colorMap] || colorMap.primary
}

// Helper function to get meetings for a specific day
const getMeetingsForDay = (year: number, monthIndex: number, day: number) => {
  return props.meetings.filter(meeting => {
    if (!meeting.date) return false
    
    // Convert ISO format and parse date components to avoid timezone issues
    const meetingDateStr = (meeting.date || '').split('T')[0] || ''
    const [meetingYear, meetingMonth, meetingDay] = meetingDateStr.split('-').map(Number)
    return meetingYear === year && meetingMonth === monthIndex + 1 && meetingDay === day
  })
}

// Helper function to check if a day has public holidays
const hasPublicHoliday = (year: number, monthIndex: number, day: number) => {
  const dayMeetings = getMeetingsForDay(year, monthIndex, day)
  const hasHoliday = dayMeetings.some(meeting => 
    meeting.type === 'public_holiday' || 
    meeting.type === 'holiday' || 
    meeting.type === 'feiertag'
  )
  
  // Debug logging for public holidays
  if (hasHoliday) {
    console.log('🎄 Year view - Public holiday detected:', { year, month: monthIndex + 1, day, meetings: dayMeetings })
  }
  
  return hasHoliday
}

// Helper function to check if a day has school holidays
const hasSchoolHoliday = (year: number, monthIndex: number, day: number) => {
  const dayMeetings = getMeetingsForDay(year, monthIndex, day)
  const hasHoliday = dayMeetings.some(meeting => 
    meeting.classification === 'school_holiday' || 
    meeting.type === 'school_holiday'
  )
  
  // Debug logging for school holidays
  if (hasHoliday) {
    console.log('🏫 Year view - School holiday detected:', { year, month: monthIndex + 1, day, meetings: dayMeetings })
  }
  
  return hasHoliday
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
        <!-- Year Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 lg:p-4 overflow-y-auto h-full">
          <div
            v-for="month in monthsData"
            :key="month.index"
            class="card bg-base-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-fit"
            :class="{
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
                  :class="getBadgeClass(getPrimaryMeetingType(month.meetingsByClassification))"
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
                    class="aspect-square flex flex-col items-center justify-center min-h-[12px] lg:min-h-[16px] rounded-sm relative"
                    :class="{
                      'text-base-content/30': !day.isCurrentMonth,
                      'bg-primary text-primary-content font-bold ring-2 ring-primary ring-offset-1 ring-offset-base-100 shadow-md transform scale-105': day.isToday,
                      'text-red-500': dayIndex % 7 === 6 && day.isCurrentMonth && !day.isToday && !hasPublicHoliday(month.year, month.index, day.dayNumber || 0) && !hasSchoolHoliday(month.year, month.index, day.dayNumber || 0),
                      'text-base-content': day.isCurrentMonth && dayIndex % 7 !== 6 && !day.isToday && !hasPublicHoliday(month.year, month.index, day.dayNumber || 0) && !hasSchoolHoliday(month.year, month.index, day.dayNumber || 0)
                    }"
                  >
                    <!-- Meeting dots indicator -->
                    <div 
                      v-if="day.dayNumber && day.isCurrentMonth"
                      class="flex gap-0.5 mb-0.5 lg:mb-1 flex-wrap justify-center max-w-full"
                    >
                      <div
                        v-for="dotIndex in Math.min(getMeetingsForDay(month.year, month.index, day.dayNumber).length, 4)"
                        :key="dotIndex"
                        class="w-0.5 h-0.5 lg:w-1 lg:h-1 rounded-full bg-current opacity-60"
                      ></div>
                      <!-- Show "+more" indicator if more than 4 meetings -->
                      <span 
                        v-if="getMeetingsForDay(month.year, month.index, day.dayNumber).length > 4"
                        class="text-[6px] lg:text-[8px] opacity-60 font-bold"
                      >
                        +{{ getMeetingsForDay(month.year, month.index, day.dayNumber).length - 4 }}
                      </span>
                    </div>
                    
                    <span v-if="day.dayNumber" class="font-medium relative z-10 text-[10px] lg:text-xs">{{ day.dayNumber }}</span>
                    
                    <!-- Holiday indicator bars -->
                    <div 
                      v-if="day.isCurrentMonth && day.dayNumber && hasPublicHoliday(month.year, month.index, day.dayNumber)"
                      class="absolute bottom-0 left-0 right-0 h-1 lg:h-1.5 bg-red-500 rounded-b-sm"
                    ></div>
                    <div 
                      v-else-if="day.isCurrentMonth && day.dayNumber && hasSchoolHoliday(month.year, month.index, day.dayNumber)"
                      class="absolute bottom-0 left-0 right-0 h-1 lg:h-1.5 bg-orange-500/80 rounded-b-sm"
                    ></div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <!-- Stats -->
        <div class="flex flex-col gap-1">
          <div class="text-sm text-base-content/70">
            {{ meetings.length }} meetings this year
          </div>
          <div class="text-sm text-base-content/70">
            {{ yearTitle }}
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex flex-col gap-2">
          <div class="text-xs font-semibold text-base-content/80">Legend:</div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <!-- Meeting dots -->
            <div class="flex items-center gap-2">
              <div class="flex gap-0.5">
                <div class="w-0.5 h-0.5 lg:w-1 lg:h-1 rounded-full bg-current opacity-60"></div>
                <div class="w-0.5 h-0.5 lg:w-1 lg:h-1 rounded-full bg-current opacity-60"></div>
                <div class="w-0.5 h-0.5 lg:w-1 lg:h-1 rounded-full bg-current opacity-60"></div>
              </div>
              <span class="text-base-content/70">Meetings</span>
            </div>
            
            <!-- Public holidays -->
            <div class="flex items-center gap-2">
              <div class="w-4 h-2 bg-red-500 rounded-sm"></div>
              <span class="text-base-content/70">Public Holidays</span>
            </div>
            
            <!-- School holidays -->
            <div class="flex items-center gap-2">
              <div class="w-4 h-2 bg-orange-500 rounded-sm"></div>
              <span class="text-base-content/70">School Holidays</span>
            </div>
            
            <!-- Today indicator -->
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-primary text-primary-content rounded-sm flex items-center justify-center text-[8px] font-bold ring-2 ring-primary ring-offset-1 ring-offset-base-100 shadow-md transform scale-105">1</div>
              <span class="text-base-content/70">Today</span>
            </div>
            
            <!-- Weekend indicator -->
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 flex items-center justify-center text-[8px] font-medium text-red-500">S</div>
              <span class="text-base-content/70">Sunday</span>
            </div>
          </div>
        </div>
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