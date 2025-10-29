<template>
  <DrawerLayout :active-view="currentView" @view-change="handleViewChange">
    <RightDrawer 
      :title="showAddMeeting ? 'Add New Meeting' : 'Meeting Details'" 
      v-model="showMeetingDetails" 
      v-model:pinned="drawerPinned"
      id="meeting-drawer"
      width="480px"
      @close="closeMeetingDetails"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 px-4">
      <ViewHeader title="Calendar">
        <template #buttons>
          <!-- View Toggle Buttons -->
          <div class="btn-group flex gap-2">
            <button 
              class="btn btn-sm" 
              :class="{ 'btn-active': showWeekView }"
              @click="setWeekView"
            >
              Week
            </button>
            <button 
              class="btn btn-sm" 
              :class="{ 'btn-active': showMonthView }"
              @click="setMonthView"
            >
              Month
            </button>
            <button 
              class="btn btn-sm" 
              :class="{ 'btn-active': showYearView }"
              @click="setYearView"
            >
              Year
            </button>
          </div>
          
          <button class="btn btn-primary ml-2" @click="openAddMeeting">
            <span class="mr-2">Add Meeting</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </template>
      </ViewHeader>
        <!-- Calendar Views -->
        <div class="flex-1 min-h-0">
        <!-- Day View -->
              <CalendarDay
                v-if="showDayView"
                :date="currentDate"
                :meetings="currentDayMeetings"
                :start-hour="7"
                :end-hour="21"
                :slot-height="6"
                :show-current-time="true"
                @meeting-click="handleMeetingClick"
                @time-slot-click="handleTimeSlotClick"
                @previous-day="previousDay"
                @next-day="nextDay"
                @go-to-today="goToToday"
              />

              <!-- Week View -->
              <CalendarWeek
                v-if="showWeekView"
                :date="currentDate"
                :meetings="currentWeekMeetings"
                :start-hour="7"
                :end-hour="21"
                :slot-height="6"
                :show-current-time="true"
                @meeting-click="handleMeetingClick"
                @time-slot-click="handleTimeSlotClick"
                @previous-week="previousWeek"
                @next-week="nextWeek"
                @go-to-today="goToToday"
              />
              
              <!-- Month View -->
              <CalendarMonth
                v-if="showMonthView"
                :date="currentDate"
                :meetings="currentMonthMeetings"
                @meeting-click="handleMeetingClick"
                @date-click="handleDateClick"
                @previous-month="previousMonth"
                @next-month="nextMonth"
                @go-to-today="goToToday"
              />
              
              <!-- Year View -->
              <CalendarYear
                v-if="showYearView"
                :date="currentDate"
                :meetings="currentYearMeetings"
                @meeting-click="handleMeetingClick"
                @month-click="handleMonthClick"
                @previous-year="previousYear"
                @next-year="nextYear"
                @go-to-today="goToToday"
              />
        </div>
        
        <!-- Mobile Floating Action Button -->
        <button 
          class="btn btn-primary btn-circle fixed bottom-6 right-6 z-50 lg:hidden shadow-lg"
          @click="openAddMeeting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        </div>
      </template>

      <template #form>
        <div class="space-y-4" v-if="showAddMeeting">
          <!-- Add Meeting Form -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Title</span>
            </label>
            <input 
              v-model="newMeeting.title" 
              type="text" 
              placeholder="Meeting title" 
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date</span>
            </label>
            <input 
              v-model="newMeeting.date" 
              type="date" 
              class="input input-bordered w-full"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Start Time</span>
              </label>
              <input 
                v-model="newMeeting.startTime" 
                type="time" 
                class="input input-bordered w-full"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">End Time</span>
              </label>
              <input 
                v-model="newMeeting.endTime" 
                type="time" 
                class="input input-bordered w-full"
              />
            </div>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Description</span>
            </label>
            <textarea 
              v-model="newMeeting.description" 
              class="textarea textarea-bordered" 
              placeholder="Meeting description"
            ></textarea>
          </div>
        </div>

        <!-- Meeting Details Display -->
        <div class="space-y-4" v-else-if="selectedMeeting">
          <div class="card bg-base-100 border">
            <div class="card-body p-4">
              <h3 class="card-title text-lg">{{ selectedMeeting.title }}</h3>
              
              <div class="space-y-3">
                <!-- Date and Time -->
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm">{{ formatMeetingDate(selectedMeeting.date) }}</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm">{{ selectedMeeting.startTime }} - {{ selectedMeeting.endTime }}</span>
                </div>

                <!-- Type Badge -->
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span class="badge" :class="`badge-${selectedMeeting.type}`">{{ selectedMeeting.type }}</span>
                </div>

                <!-- Description -->
                <div v-if="selectedMeeting.description" class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/70 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-sm">{{ selectedMeeting.description }}</p>
                </div>

                <!-- Attendees -->
                <div v-if="selectedMeeting.attendees && selectedMeeting.attendees.length > 0" class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/70 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium">Attendees:</p>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span v-for="attendee in selectedMeeting.attendees" :key="attendee" class="badge badge-outline badge-sm">{{ attendee }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <button v-if="showAddMeeting" class="btn btn-primary flex-1" @click="saveMeeting">Save Meeting</button>
        <button v-else-if="selectedMeeting" class="btn btn-primary flex-1" @click="editMeeting">Edit Meeting</button>
      </template>
    </RightDrawer>
  </DrawerLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CalendarWeek from '@/components/calendar/CalendarWeek.vue' 
import CalendarMonth from '@/components/calendar/CalendarMonth.vue'
import CalendarYear from '@/components/calendar/CalendarYear.vue'
import CalendarDay from '@/components/calendar/CalendarDay.vue'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import RightDrawer from '@/components/RightDrawer.vue'
import ViewHeader from '@/components/ViewHeader.vue'

// Calendar view types
enum CalendarViewType {
  Day = 'day',
  Week = 'week', 
  Month = 'month',
  Year = 'year'
}

// Local type definition for Meeting with date
interface LocalMeeting {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  description?: string
  type: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  attendees?: string[]
}

// Current date for the calendar
const currentDate = ref(new Date())

// View states  
const isMobile = ref(false)
const currentCalendarView = ref<CalendarViewType>(CalendarViewType.Week)

// Initialize view based on screen size
const initializeView = () => {
  isMobile.value = window.innerWidth < 1024
  if (isMobile.value) {
    currentCalendarView.value = CalendarViewType.Day
  } else {
    currentCalendarView.value = CalendarViewType.Week
  }
}

// Current view computed for mobile navbar
const currentView = computed((): 'week' | 'month' | 'year' | 'day' => {
  return currentCalendarView.value as 'week' | 'month' | 'year' | 'day'
})

// View type computed properties
const showDayView = computed(() => currentCalendarView.value === CalendarViewType.Day)
const showWeekView = computed(() => currentCalendarView.value === CalendarViewType.Week)
const showMonthView = computed(() => currentCalendarView.value === CalendarViewType.Month)
const showYearView = computed(() => currentCalendarView.value === CalendarViewType.Year)

// Sample meetings data
const meetings = ref<LocalMeeting[]>([
  // Monday
  {
    id: '1',
    title: 'Team Standupf',
    startTime: '09:00',
    endTime: '09:30',
    type: 'primary',
    description: 'Daily team synchronization',
    attendees: ['Alice', 'Bob', 'Charlie'],
    date: '2025-10-27' // Monday
  },
  {
    id: '2',
    title: 'Sprint Planning',
    startTime: '14:00',
    endTime: '16:00',
    type: 'warning',
    description: 'Next sprint planning meeting',
    attendees: ['Scrum Team'],
    date: '2025-10-27'
  },
  // Tuesday
  {
    id: '3',
    title: 'Design Review',
    startTime: '10:15',
    endTime: '11:00',
    type: 'secondary',
    description: 'UI/UX design feedback session',
    attendees: ['Design Team'],
    date: '2025-10-28' // Tuesday
  },
  {
    id: '4',
    title: 'Client Call',
    startTime: '10:30',
    endTime: '11:15',
    type: 'accent',
    description: 'Project status update with client',
    attendees: ['Client', 'PM'],
    date: '2025-10-28'
  },
  // Wednesday
  {
    id: '5',
    title: 'All Hands',
    startTime: '11:00',
    endTime: '12:00',
    type: 'info',
    description: 'Company wide meeting',
    attendees: ['Everyone'],
    date: '2025-10-29' // Wednesday
  },
  {
    id: '6',
    title: 'Code Review',
    startTime: '14:00',
    endTime: '15:30',
    type: 'success',
    description: 'Pull request review session',
    attendees: ['Dev Team'],
    date: '2025-10-29'
  },
  // Thursday
  {
    id: '7',
    title: 'Product Demo',
    startTime: '15:00',
    endTime: '16:00',
    type: 'primary',
    description: 'Weekly product demonstration',
    attendees: ['Product Team'],
    date: '2025-10-30' // Thursday
  },
  // Friday
  {
    id: '8',
    title: 'Team Retrospective',
    startTime: '08:30',
    endTime: '09:15',
    type: 'error',
    description: 'Weekly team retrospective',
    attendees: ['Full Team'],
    date: '2025-10-31' // Friday
  },
  {
    id: '9',
    title: 'Happy Hour',
    startTime: '17:00',
    endTime: '18:00',
    type: 'success',
    description: 'End of week celebration',
    date: '2025-10-31'
  },
  {
    id: '10',
    title: 'Happy Hour',
    startTime: '17:00',
    endTime: '18:00',
    type: 'success',
    description: 'End of week celebration',
    date: '2025-10-28'
  }
])

// Add meeting modal
const showAddMeeting = ref(false)
const newMeeting = ref({
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  description: ''
})

// Meeting details drawer
const showMeetingDetails = ref(false)
const drawerPinned = ref(false)
const selectedMeeting = ref<LocalMeeting | null>(null)

// Computed properties for stats
const todayMeetings = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return meetings.value.filter((meeting: LocalMeeting) => meeting.date === today)
})

const weekMeetings = computed(() => {
  const startOfWeek = new Date(currentDate.value)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  
  return meetings.value.filter((meeting: LocalMeeting) => {
    const meetingDate = new Date(meeting.date)
    return meetingDate >= startOfWeek && meetingDate <= endOfWeek
  })
})

const upcomingMeetingsText = computed(() => {
  const upcoming = todayMeetings.value.filter((meeting: LocalMeeting) => {
    const now = new Date()
    const meetingTime = new Date(`${meeting.date} ${meeting.startTime}`)
    return meetingTime > now
  })
  return `${upcoming.length} upcoming`
})

const todayHours = computed(() => {
  return todayMeetings.value.reduce((total: number, meeting: LocalMeeting) => {
    const [startHour, startMin] = meeting.startTime.split(':').map(Number)
    const [endHour, endMin] = meeting.endTime.split(':').map(Number)
    const safeStartHour = startHour ?? 0
    const safeStartMin = startMin ?? 0
    const safeEndHour = endHour ?? 0
    const safeEndMin = endMin ?? 0
    const duration = (safeEndHour * 60 + safeEndMin) - (safeStartHour * 60 + safeStartMin)
    return total + (duration / 60)
  }, 0).toFixed(1)
})

// Navigation functions
const previousWeek = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 7)
  currentDate.value = newDate
}

const nextWeek = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 7)
  currentDate.value = newDate
}

const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

const previousYear = () => {
  const newDate = new Date(currentDate.value)
  newDate.setFullYear(newDate.getFullYear() - 1)
  currentDate.value = newDate
}

const nextYear = () => {
  const newDate = new Date(currentDate.value)
  newDate.setFullYear(newDate.getFullYear() + 1)
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
}

const previousDay = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 1)
  currentDate.value = newDate
}

const nextDay = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 1)
  currentDate.value = newDate
}

// Handle view change from mobile navbar
const handleViewChange = (view: 'week' | 'month' | 'year' | 'day') => {
  currentCalendarView.value = view as CalendarViewType
}

// View change helper functions
const setWeekView = () => currentCalendarView.value = CalendarViewType.Week
const setMonthView = () => currentCalendarView.value = CalendarViewType.Month
const setYearView = () => currentCalendarView.value = CalendarViewType.Year
const setDayView = () => currentCalendarView.value = CalendarViewType.Day

// Convert local meetings to calendar format
const currentDayMeetings = computed(() => {
  const today = currentDate.value.toISOString().split('T')[0]
  return meetings.value
    .filter((meeting: LocalMeeting) => meeting.date === today)
    .map((meeting: LocalMeeting) => ({
      id: meeting.id,
      title: meeting.title,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      type: meeting.type,
      description: meeting.description,
      attendees: meeting.attendees,
      date: meeting.date
    }))
})

const currentWeekMeetings = computed(() => {
  return weekMeetings.value.map((meeting: LocalMeeting) => ({
    id: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    type: meeting.type,
    description: meeting.description,
    attendees: meeting.attendees,
    date: meeting.date
  }))
})

// Month meetings
const monthMeetings = computed(() => {
  const startOfMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  const endOfMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0)
  
  return meetings.value.filter((meeting: LocalMeeting) => {
    const meetingDate = new Date(meeting.date)
    return meetingDate >= startOfMonth && meetingDate <= endOfMonth
  })
})

const currentMonthMeetings = computed(() => {
  return monthMeetings.value.map((meeting: LocalMeeting) => ({
    id: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    type: meeting.type,
    description: meeting.description,
    attendees: meeting.attendees,
    date: meeting.date
  }))
})

// Year meetings
const yearMeetings = computed(() => {
  const startOfYear = new Date(currentDate.value.getFullYear(), 0, 1)
  const endOfYear = new Date(currentDate.value.getFullYear(), 11, 31)
  
  return meetings.value.filter((meeting: LocalMeeting) => {
    const meetingDate = new Date(meeting.date)
    return meetingDate >= startOfYear && meetingDate <= endOfYear
  })
})

const currentYearMeetings = computed(() => {
  return yearMeetings.value.map((meeting: LocalMeeting) => ({
    id: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    type: meeting.type,
    description: meeting.description,
    attendees: meeting.attendees,
    date: meeting.date
  }))
})

// Meeting details functions
const formatMeetingDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const closeMeetingDetails = () => {
  showMeetingDetails.value = false
  selectedMeeting.value = null
  showAddMeeting.value = false
}

const openAddMeeting = () => {
  selectedMeeting.value = null
  showAddMeeting.value = true
  showMeetingDetails.value = true
  // Set default date to today
  newMeeting.value.date = new Date().toISOString().split('T')[0] || ''
  newMeeting.value.startTime = '09:00'
  newMeeting.value.endTime = '10:00'
}

const editMeeting = () => {
  if (selectedMeeting.value) {
    // Convert selected meeting to edit form
    newMeeting.value = {
      title: selectedMeeting.value.title,
      date: selectedMeeting.value.date,
      startTime: selectedMeeting.value.startTime,
      endTime: selectedMeeting.value.endTime,
      description: selectedMeeting.value.description || ''
    }
    showAddMeeting.value = true
  }
}

// Event handlers
const handleMeetingClick = (meeting: any) => {
  console.log('Meeting clicked:', meeting)
  selectedMeeting.value = meeting
  showAddMeeting.value = false
  showMeetingDetails.value = true
}

const handleTimeSlotClick = (time: string) => {
  console.log('Time slot clicked:', time)
  selectedMeeting.value = null
  newMeeting.value.date = currentDate.value.toISOString().split('T')[0] || ''
  newMeeting.value.startTime = time
  
  // Set end time to 1 hour later
  const [hours, minutes] = time.split(':').map(Number)
  const safeHours = hours ?? 0
  const safeMinutes = minutes ?? 0
  const endTime = new Date()
  endTime.setHours(safeHours + 1, safeMinutes)
  newMeeting.value.endTime = endTime.toTimeString().substring(0, 5)
  
  showAddMeeting.value = true
  showMeetingDetails.value = true
}

const handleDateClick = (dateStr: string) => {
  console.log('Date clicked:', dateStr)
  selectedMeeting.value = null
  newMeeting.value.date = dateStr
  newMeeting.value.startTime = '09:00'
  newMeeting.value.endTime = '10:00'
  showAddMeeting.value = true
  showMeetingDetails.value = true
}

const handleMonthClick = (monthIndex: number) => {
  console.log('Month clicked:', monthIndex)
  const newDate = new Date(currentDate.value)
  newDate.setMonth(monthIndex)
  currentDate.value = newDate
  // Switch to month view when a month is clicked
  currentCalendarView.value = CalendarViewType.Month
}

const closeAddMeeting = () => {
  showAddMeeting.value = false
  selectedMeeting.value = null
  showMeetingDetails.value = false
  newMeeting.value = {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: ''
  }
}

const saveMeeting = () => {
  if (newMeeting.value.title && newMeeting.value.date && newMeeting.value.startTime && newMeeting.value.endTime) {
    const meeting: LocalMeeting = {
      id: Date.now().toString(),
      title: newMeeting.value.title,
      date: newMeeting.value.date,
      startTime: newMeeting.value.startTime,
      endTime: newMeeting.value.endTime,
      description: newMeeting.value.description,
      type: 'primary'
    }
    
    meetings.value.push(meeting)
    closeAddMeeting()
  }
}

onMounted(() => {
  // Set current date to today
  currentDate.value = new Date()
  // Initialize view based on screen size
  initializeView()
  // Listen for resize events
  window.addEventListener('resize', initializeView)
})

onUnmounted(() => {
  window.removeEventListener('resize', initializeView)
})
</script>