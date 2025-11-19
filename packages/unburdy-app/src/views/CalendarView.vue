<template>
  <DrawerLayout :active-view="currentView" @view-change="handleViewChange">
    <!-- Settings Drawer -->
    <RightDrawer
      title="Calendar Settings"
      v-model="showSettings"
      v-model:pinned="settingsDrawerPinned"
      id="settings-drawer"
      width="480px"
      @close="closeSettings"
    >
      <template #content>
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 lg:px-4">
          <ViewHeader :title="calendarTitle">
            <template #buttons>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="`bg-${calendarColor}`"
                    :title="`Calendar Color: ${calendarColor}`"
                  ></div>
                  <span class="text-sm text-base-content/70 hidden lg:inline">{{ calendarColor }}</span>
                </div>

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

              <button class="btn btn-ghost btn-sm" @click="openSettings" title="Calendar Settings">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button class="btn btn-primary ml-2" @click="openAddMeeting">
                <span class="mr-2">Add Meeting</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </template>
          </ViewHeader>

          <div class="flex-1 min-h-0">
            <CalendarDay
              v-if="showDayView"
              :date="currentDate"
              :meetings="currentDayEvents"
              :start-hour="7"
              :end-hour="21"
              :slot-height="6"
              :show-current-time="true"
              @meeting-click="handleMeetingClick"
              @time-slot-click="handleTimeSlotClick"
              @previous-day="() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); goToDate(d) }"
              @next-day="() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); goToDate(d) }"
              @go-to-today="goToToday"
            />

            <CalendarWeek
              v-if="showWeekView"
              :date="currentDate"
              :meetings="currentWeekEvents"
              :start-hour="7"
              :end-hour="21"
              :slot-height="6"
              :show-current-time="true"
              :is-loading="isLoading"
              :error="error"
              @meeting-click="handleMeetingClick"
              @time-slot-click="handleTimeSlotClick"
              @previous-week="prevWeek"
              @next-week="nextWeek"
              @go-to-today="goToToday"
              @retry-load="loadAllCalendarData"
            />

            <CalendarMonth
              v-if="showMonthView"
              :date="currentDate"
              :meetings="getMonthEvents(currentDate)"
              @meeting-click="handleMeetingClick"
              @date-click="handleDateClick"
              @week-click="handleWeekClick"
              @previous-month="prevMonth"
              @next-month="nextMonth"
              @go-to-today="goToToday"
            />

            <CalendarYear
              v-if="showYearView"
              :date="currentDate"
              :meetings="getYearEvents(currentDate)"
              @meeting-click="handleMeetingClick"
              @month-click="handleMonthClick"
              @previous-year="prevYear"
              @next-year="nextYear"
              @go-to-today="goToToday"
            />
          </div>

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
        <CalendarSettings
          :initial-name="calendarName"
          :initial-color="calendarColor"
          :initial-availability="calendarAvailability"
          @save="saveSettings"
          @cancel="closeSettings"
        />
      </template>
    </RightDrawer>

    <!-- Meeting Details Drawer -->
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
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="`bg-${calendarColor}`"
                    :title="`Calendar Color: ${calendarColor}`"
                  ></div>
                  <span class="text-sm text-base-content/70 hidden lg:inline">{{ calendarColor }}</span>
                </div>

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

          <div class="flex-1 min-h-0">
            <CalendarDay
              v-if="showDayView"
              :date="currentDate"
              :meetings="currentDayEvents"
              :start-hour="7"
              :end-hour="21"
              :slot-height="6"
              :show-current-time="true"
              @meeting-click="handleMeetingClick"
              @time-slot-click="handleTimeSlotClick"
              @previous-day="() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); goToDate(d) }"
              @next-day="() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); goToDate(d) }"
              @go-to-today="goToToday"
            />

            <CalendarWeek
              v-if="showWeekView"
              :date="currentDate"
              :meetings="currentWeekEvents"
              :start-hour="7"
              :end-hour="21"
              :slot-height="6"
              :show-current-time="true"
              :is-loading="isLoading"
              :error="error"
              @meeting-click="handleMeetingClick"
              @time-slot-click="handleTimeSlotClick"
              @previous-week="prevWeek"
              @next-week="nextWeek"
              @go-to-today="goToToday"
              @retry-load="loadAllCalendarData"
            />

            <CalendarMonth
              v-if="showMonthView"
              :date="currentDate"
              :meetings="getMonthEvents(currentDate)"
              @meeting-click="handleMeetingClick"
              @date-click="handleDateClick"
              @week-click="handleWeekClick"
              @previous-month="prevMonth"
              @next-month="nextMonth"
              @go-to-today="goToToday"
            />

            <CalendarYear
              v-if="showYearView"
              :date="currentDate"
              :meetings="getYearEvents(currentDate)"
              @meeting-click="handleMeetingClick"
              @month-click="handleMonthClick"
              @previous-year="prevYear"
              @next-year="nextYear"
              @go-to-today="goToToday"
            />
          </div>

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
        <!-- Edit Mode -->
        <CalendarEventEdit
          v-if="showAddMeeting"
          :event="selectedMeeting || undefined"
          :initial-date="newMeeting.date"
          :initial-time="newMeeting.startTime"
          @save="saveMeeting"
          @cancel="closeMeetingDetails"
        />

        <!-- Detail View Mode -->
        <CalendarEventDetail
          v-else-if="selectedMeeting"
          :event="selectedMeeting"
          @edit="showAddMeeting = true"
          @close="closeMeetingDetails"
          @delete="deleteMeeting"
          @duplicate="handleDuplicate"
        />
      </template>

      <template #actions>
        <!-- Actions are now handled inside the components -->
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
import CalendarEventDetail from '@/components/calendar/CalendarEventDetail.vue'
import CalendarEventEdit from '@/components/calendar/CalendarEventEdit.vue'
import CalendarSettings from '@/components/calendar/CalendarSettings.vue'
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import RightDrawer from '@/components/RightDrawer.vue'
import ViewHeader from '@/components/ViewHeader.vue'
import { useCalendar } from '@/composables/useCalendar'
import { useCalendarApi } from '@/composables/useCalendarApi'
import { useCalendarStore } from '@/stores/calendarStore'
import type { Meeting } from '@/types/calendar'
import type { WeeklyAvailability } from '@/types/client-booking'

const {
  currentDate,
  currentDayEvents,
  currentWeekEvents,
  isLoading,
  error,
  calendarName,
  calendarColor,
  loadAllCalendarData,
  getMonthEvents,
  getYearEvents,
  prevWeek,
  nextWeek,
  prevMonth,
  nextMonth,
  prevYear,
  nextYear,
  goToToday,
  goToDate,
  ensureInitialized,
} = useCalendar()

const { createCalendarEntry, updateCalendarEntry, deleteCalendarEntry, updateCalendar } = useCalendarApi()
const calendarStore = useCalendarStore()

enum CalendarViewType {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year'
}

const isMobile = ref(false)
const currentCalendarView = ref<CalendarViewType>(CalendarViewType.Week)

const initializeView = () => {
  isMobile.value = window.innerWidth < 1024
  currentCalendarView.value = isMobile.value ? CalendarViewType.Day : CalendarViewType.Week
}

const currentView = computed(() => currentCalendarView.value)
const calendarTitle = computed(() => calendarName.value || 'Calendar')

const showDayView = computed(() => currentCalendarView.value === CalendarViewType.Day)
const showWeekView = computed(() => currentCalendarView.value === CalendarViewType.Week)
const showMonthView = computed(() => currentCalendarView.value === CalendarViewType.Month)
const showYearView = computed(() => currentCalendarView.value === CalendarViewType.Year)

const showAddMeeting = ref(false)
const newMeeting = ref({
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  description: ''
})

const showMeetingDetails = ref(false)
const drawerPinned = ref(false)
const selectedMeeting = ref<Meeting | null>(null)

// Settings drawer state
const showSettings = ref(false)
const settingsDrawerPinned = ref(false)
const calendarAvailability = ref<WeeklyAvailability>({})

const handleViewChange = (view: 'week' | 'month' | 'year' | 'day') => {
  currentCalendarView.value = view as CalendarViewType
}

const setWeekView = () => currentCalendarView.value = CalendarViewType.Week
const setMonthView = () => currentCalendarView.value = CalendarViewType.Month
const setYearView = () => currentCalendarView.value = CalendarViewType.Year

const closeMeetingDetails = () => {
  showMeetingDetails.value = false
  selectedMeeting.value = null
  showAddMeeting.value = false
}

const openAddMeeting = () => {
  selectedMeeting.value = null
  showAddMeeting.value = true
  showMeetingDetails.value = true
  newMeeting.value.date = new Date().toISOString().split('T')[0] || ''
  newMeeting.value.startTime = '09:00'
  newMeeting.value.endTime = '10:00'
}

const handleMeetingClick = (meeting: Meeting) => {
  selectedMeeting.value = meeting
  showAddMeeting.value = false
  showMeetingDetails.value = true
}

const handleTimeSlotClick = (time: string) => {
  selectedMeeting.value = null
  newMeeting.value.date = currentDate.value.toISOString().split('T')[0] || ''
  newMeeting.value.startTime = time

  const [hours, minutes] = time.split(':').map(Number)
  const endTime = new Date()
  endTime.setHours((hours || 0) + 1, minutes || 0)
  newMeeting.value.endTime = endTime.toTimeString().substring(0, 5)

  showAddMeeting.value = true
  showMeetingDetails.value = true
}

const handleDateClick = (dateStr: string) => {
  selectedMeeting.value = null
  newMeeting.value.date = dateStr
  newMeeting.value.startTime = '09:00'
  newMeeting.value.endTime = '10:00'
  showAddMeeting.value = true
  showMeetingDetails.value = true
}

const handleWeekClick = (dateStr: string) => {
  goToDate(new Date(dateStr))
  setWeekView()
}

const handleMonthClick = (monthIndex: number) => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(monthIndex)
  goToDate(newDate)
  currentCalendarView.value = CalendarViewType.Month
}

const handleDuplicate = (meeting: Meeting) => {
  selectedMeeting.value = meeting
  showAddMeeting.value = true
}

const saveMeeting = async (meeting: Meeting) => {
  try {
    if (meeting.id && selectedMeeting.value?.id) {
      // Update existing meeting
      const result = await updateCalendarEntry(meeting)
      if (result.success) {
        closeMeetingDetails()
      }
    } else {
      // Create new meeting
      const result = await createCalendarEntry(meeting)
      if (result.success) {
        closeMeetingDetails()
      }
    }
  } catch (err) {
    console.error('Error saving meeting:', err)
  }
}

const deleteMeeting = async () => {
  if (!selectedMeeting.value?.id) return
  
  try {
    const result = await deleteCalendarEntry(selectedMeeting.value.id)
    if (result.success) {
      closeMeetingDetails()
    }
  } catch (err) {
    console.error('Error deleting meeting:', err)
  }
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = async (settings: { name: string; color: string; availability: WeeklyAvailability }) => {
  try {
    // Validate calendar ID exists
    if (!calendarStore.calendarId) {
      console.error('No calendar ID available')
      return
    }

    // Call API to update calendar
    const result = await updateCalendar({
      id: calendarStore.calendarId,
      name: settings.name,
      color: settings.color,
      weekly_availability: settings.availability
    })
    
    if (result.success) {
      // Update local store only after successful API call
      calendarStore.setCalendarInfo(settings.name, settings.color)
      calendarAvailability.value = settings.availability
      closeSettings()
      
      // Optionally reload calendar data to get updated values
      await loadAllCalendarData(true)
    } else {
      console.error('Failed to update calendar:', result.error)
    }
  } catch (err) {
    console.error('Error saving settings:', err)
  }
}

onMounted(async () => {
  await ensureInitialized()
  goToToday()
  initializeView()
  window.addEventListener('resize', initializeView)
})

onUnmounted(() => {
  window.removeEventListener('resize', initializeView)
})
</script>