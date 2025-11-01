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
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 lg:px-4">
      <ViewHeader :title="calendarTitle">
        <template #buttons>
          <!-- Calendar Color Indicator -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <div 
                class="w-3 h-3 rounded-full" 
                :class="`bg-${calendar.calendarColor.value}`"
                :title="`Calendar Color: ${calendar.calendarColor.value}`"
              ></div>
              <span class="text-sm text-base-content/70 hidden lg:inline">{{ calendar.calendarColor.value }}</span>
            </div>
          
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
                :date="calendar.currentDate.value"
                :meetings="calendar.currentDayEvents.value"
                :start-hour="7"
                :end-hour="21"
                :slot-height="6"
                :show-current-time="true"
                @meeting-click="handleMeetingClick"
                @time-slot-click="handleTimeSlotClick"
                @previous-day="() => { const d = new Date(calendar.currentDate.value); d.setDate(d.getDate() - 1); calendar.goToDate(d) }"
                @next-day="() => { const d = new Date(calendar.currentDate.value); d.setDate(d.getDate() + 1); calendar.goToDate(d) }"
                @go-to-today="calendar.goToToday"
              />

              <!-- Week View -->
              <CalendarWeek
                v-if="showWeekView"
                :date="calendar.currentDate.value"
                :meetings="calendar.currentWeekEvents.value"
                :start-hour="7"
                :end-hour="21"
                :slot-height="6"
                :show-current-time="true"
                :is-loading="calendar.isLoading.value"
                :error="calendar.error.value"
                @meeting-click="handleMeetingClick"
                @time-slot-click="handleTimeSlotClick"
                @previous-week="calendar.prevWeek"
                @next-week="calendar.nextWeek"
                @go-to-today="calendar.goToToday"
                @retry-load="calendar.loadWeekEvents"
              />
              
              <!-- Month View -->
              <CalendarMonth
                v-if="showMonthView"
                :date="calendar.currentDate.value"
                :meetings="calendar.getMonthEvents()"
                @meeting-click="handleMeetingClick"
                @date-click="handleDateClick"
                @week-click="handleWeekClick"
                @previous-month="calendar.prevMonth"
                @next-month="calendar.nextMonth"
                @go-to-today="calendar.goToToday"
              />
              
              <!-- Year View -->
              <CalendarYear
                v-if="showYearView"
                :date="calendar.currentDate.value"
                :meetings="calendar.getYearEvents()"
                @meeting-click="handleMeetingClick"
                @month-click="handleMonthClick"
                @previous-year="calendar.prevYear"
                @next-year="calendar.nextYear"
                @go-to-today="calendar.goToToday"
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
                  <span class="text-sm">{{ formatMeetingDate(selectedMeeting.date || '') }}</span>
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
import { useCalendar } from '@/composables/useCalendar'

// Use the calendar composable
const calendar = useCalendar()

// Calendar view types
enum CalendarViewType {
  Day = 'day',
  Week = 'week', 
  Month = 'month',
  Year = 'year'
}

// Meeting type for the calendar component 
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

// Use calendar.currentDate.value directly - no local reference needed

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

// Calendar title with name from composable
const calendarTitle = computed(() => {
  return calendar.calendarName.value || 'Calendar'
})

// View type computed properties
const showDayView = computed(() => currentCalendarView.value === CalendarViewType.Day)
const showWeekView = computed(() => currentCalendarView.value === CalendarViewType.Week)
const showMonthView = computed(() => currentCalendarView.value === CalendarViewType.Month)
const showYearView = computed(() => currentCalendarView.value === CalendarViewType.Year)

// Use composable data directly - no need for local variables

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
const selectedMeeting = ref<Meeting | null>(null)

// Stats are computed on-demand from composable - no local caching needed

// Use composable navigation directly - no wrapper functions needed

// Handle view change from mobile navbar
const handleViewChange = (view: 'week' | 'month' | 'year' | 'day') => {
  currentCalendarView.value = view as CalendarViewType
}

// Use composable methods directly - no wrapper functions needed

// View change helper functions
const setWeekView = () => currentCalendarView.value = CalendarViewType.Week
const setMonthView = () => currentCalendarView.value = CalendarViewType.Month
const setYearView = () => currentCalendarView.value = CalendarViewType.Year
const setDayView = () => currentCalendarView.value = CalendarViewType.Day

// Use composable data directly - no local computed needed

// Meeting details functions
const formatMeetingDate = (dateStr?: string) => {
  if (!dateStr) return 'No date'
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
      date: selectedMeeting.value.date || '',
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
  newMeeting.value.date = calendar.currentDate.value.toISOString().split('T')[0] || ''
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

const handleWeekClick = (dateStr: string) => {
  console.log('Week clicked, switching to week view for date:', dateStr)
  // Parse the date and set it as current date
  const date = new Date(dateStr)
  calendar.goToDate(date)
  // Switch to week view
  setWeekView()
}

const handleMonthClick = (monthIndex: number) => {
  console.log('Month clicked:', monthIndex)
  const newDate = new Date(calendar.currentDate.value)
  newDate.setMonth(monthIndex)
  calendar.goToDate(newDate)
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

const saveMeeting = async () => {
  console.log('Save meeting not yet implemented with composable')
  // TODO: Implement calendar event creation through composable
  closeAddMeeting()
}

onMounted(async () => {
  // Set current date to today
  calendar.goToToday()
  // Initialize view based on screen size
  initializeView()
  // Listen for resize events
  window.addEventListener('resize', initializeView)
  // Initialize calendar data
  await calendar.ensureInitialized()
  await calendar.loadWeekEvents()
  
  // Debug: Log current week meetings and calendar metadata
  console.log('📅 Calendar View - Current week meetings:', calendar.currentWeekEvents.value)
  console.log('📅 Calendar View - Calendar events:', calendar.events.value)
  console.log('📅 Calendar View - Current date:', calendar.currentDate.value)
  console.log('📅 Calendar View - Calendar name:', calendar.calendarName.value)
  console.log('📅 Calendar View - Calendar color:', calendar.calendarColor.value)
})

onUnmounted(() => {
  window.removeEventListener('resize', initializeView)
})
</script>