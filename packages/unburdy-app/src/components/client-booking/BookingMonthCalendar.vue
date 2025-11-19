<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'
import type { MonthData } from '@/types/client-booking'

const props = defineProps<{
  monthData: MonthData
  selectedDate: string | null
}>()

const emit = defineEmits<{
  selectDate: [date: string]
  previousMonth: []
  nextMonth: []
  goToToday: []
}>()

// Helper function to format date as YYYY-MM-DD in local timezone
const formatLocalDate = (year: number, month: number, day: number): string => {
  const yyyy = year.toString()
  const mm = month.toString().padStart(2, '0')
  const dd = day.toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Generate calendar grid (including previous and next month days)
const calendarDays = computed(() => {
  const { year, month, days } = props.monthData
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const lastDayOfMonth = new Date(year, month, 0)
  
  // Get the day of week for first day (0 = Sunday, 1 = Monday, ...)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const startDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1 // Monday = 0
  
  const grid: Array<{
    date: string
    dayNumber: number
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    availableCount: number
    status: 'available' | 'partial' | 'none'
    isPast: boolean
  }> = []
  
  // Add days from previous month
  const prevMonth = new Date(year, month - 2, 1)
  const prevMonthYear = prevMonth.getFullYear()
  const prevMonthNum = prevMonth.getMonth() + 1
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const dateStr = formatLocalDate(prevMonthYear, prevMonthNum, day)
    grid.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      availableCount: 0,
      status: 'none',
      isPast: true
    })
  }
  
  // Add days from current month
  const now = new Date()
  const today = formatLocalDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const dateStr = formatLocalDate(year, month, day)
    const dayData = days.find(d => d.date === dateStr)
    const isPast = dateStr < today
    
    grid.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isSelected: dateStr === props.selectedDate,
      availableCount: dayData?.availableCount || 0,
      status: isPast ? 'none' : (dayData?.status || 'none'),
      isPast
    })
  }
  
  // Add days from next month to complete grid (42 days = 6 weeks)
  const remainingDays = 42 - grid.length
  const nextMonth = new Date(year, month, 1)
  const nextMonthYear = nextMonth.getFullYear()
  const nextMonthNum = nextMonth.getMonth() + 1
  for (let day = 1; day <= remainingDays; day++) {
    const dateStr = formatLocalDate(nextMonthYear, nextMonthNum, day)
    grid.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      availableCount: 0,
      status: 'none',
      isPast: false
    })
  }
  
  return grid
})

const monthName = computed(() => {
  const date = new Date(props.monthData.year, props.monthData.month - 1, 1)
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
})

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const getStatusClasses = (day: typeof calendarDays.value[0]) => {
  if (day.isPast || !day.isCurrentMonth) {
    return 'bg-base-200 text-base-content/30 cursor-not-allowed'
  }
  
  if (day.isSelected) {
    return 'bg-primary text-white ring-2 ring-primary ring-offset-2 font-bold'
  }
  
  if (day.status === 'available') {
    return 'bg-success/20 text-base-content hover:bg-success/30 cursor-pointer border border-success/30'
  }
  
  if (day.status === 'partial') {
    return 'bg-warning/20 text-base-content hover:bg-warning/30 cursor-pointer border border-warning/30'
  }
  
  return 'bg-base-100 text-base-content/50 cursor-not-allowed'
}

const getIndicatorClasses = (status: 'available' | 'partial' | 'none') => {
  if (status === 'available') return 'bg-success'
  if (status === 'partial') return 'bg-warning'
  return 'bg-base-300'
}

const handleDayClick = (day: typeof calendarDays.value[0]) => {
  if (!day.isPast && day.isCurrentMonth && day.status !== 'none') {
    emit('selectDate', day.date)
  }
}
</script>

<template>
  <div class="card bg-base-100/50 shadow-lg">
    <!-- Header -->
    <div class="card-header flex-row items-center justify-between p-4">
      <h2 class="card-title text-lg md:text-xl">{{ monthName }}</h2>
      <div class="flex gap-1">
        <button
          class="btn btn-sm btn-circle btn-ghost"
          @click="emit('previousMonth')"
          title="Vorheriger Monat"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          @click="emit('goToToday')"
          title="Heute"
        >
          <Calendar class="w-4 h-4" />
        </button>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          @click="emit('nextMonth')"
          title="Nächster Monat"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div class="card-body p-4">

    <!-- Weekday headers -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-xs font-semibold text-base-content/70 p-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(day, index) in calendarDays"
        :key="`${day.date}-${index}`"
        class="relative aspect-square"
      >
        <button
          :class="[
            'w-full h-full rounded-lg transition-all duration-200',
            'flex flex-col items-center justify-center',
            'text-sm md:text-base font-medium',
            getStatusClasses(day)
          ]"
          :disabled="day.isPast || !day.isCurrentMonth || day.status === 'none'"
          @click="handleDayClick(day)"
        >
          <span>{{ day.dayNumber }}</span>
          
          <!-- Availability indicator -->
          <div class="flex gap-0.5 mt-1">
            <div
              v-if="!day.isPast && day.isCurrentMonth && day.availableCount > 0"
              :class="['w-1 h-1 rounded-full', getIndicatorClasses(day.status)]"
            />
          </div>
          
          <!-- Available slots count -->
          <span
            v-if="!day.isPast && day.isCurrentMonth && day.availableCount > 0"
            class="text-[10px] opacity-75 mt-0.5"
          >
            {{ day.availableCount }}
          </span>
        </button>
      </div>
    </div>
    </div>

    <!-- Legend -->
    <div class="card-footer p-4">
      <div class="flex flex-wrap gap-3 text-xs">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-success/20 border border-success" />
          <span>Verfügbar</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-warning/20 border border-warning" />
          <span>Teilweise belegt</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-base-200" />
          <span>Keine Slots</span>
        </div>
      </div>
    </div>
  </div>
</template>
