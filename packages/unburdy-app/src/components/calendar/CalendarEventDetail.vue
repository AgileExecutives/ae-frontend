<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6 p-4 border-b border-base-300">
      <div class="flex-1">
        <h2 class="text-2xl font-bold mb-2">{{ event.title }}</h2>
        <div class="flex items-center gap-2">
          <span :class="classificationBadgeClass" class="badge badge-sm">
            {{ formatClassification(event.classification) }}
          </span>
          <span v-if="event.type" class="text-sm text-base-content/60">
            {{ formatType(event.type) }}
          </span>
        </div>
      </div>
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </label>
        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
          <li>
            <a @click="$emit('edit')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Event
            </a>
          </li>
          <li>
            <a @click="duplicateEvent">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </a>
          </li>
          <li class="border-t border-base-300 mt-1 pt-1">
            <a @click="confirmDelete" class="text-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Event
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto space-y-6">
      <!-- Date & Time Section -->
      <div class="card bg-base-200/50">
        <div class="card-body p-4">
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            When
          </h3>
          
          <!-- Date Display -->
          <div class="flex items-start gap-3 mb-3">
            <div class="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="font-medium">{{ formattedDate }}</p>
              <p v-if="event.isMultiDay && event.endDate" class="text-sm text-base-content/60">
                Multi-day event until {{ formatDateShort(event.endDate) }}
              </p>
            </div>
          </div>

          <!-- Time Display -->
          <div v-if="!event.isAllDay" class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="font-medium">{{ event.startTime }} - {{ event.endTime }}</p>
              <p class="text-sm text-base-content/60">{{ duration }}</p>
            </div>
          </div>
          <div v-else class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="font-medium">All Day</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div v-if="event.description" class="card bg-base-200/50">
        <div class="card-body p-4">
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Description
          </h3>
          <div class="prose prose-sm max-w-none">
            <p class="whitespace-pre-wrap">{{ event.description }}</p>
          </div>
        </div>
      </div>

      <!-- Attendees Section -->
      <div v-if="event.attendees && event.attendees.length > 0" class="card bg-base-200/50">
        <div class="card-body p-4">
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Attendees
          </h3>
          <div class="flex flex-wrap gap-2">
            <div v-for="attendee in event.attendees" :key="attendee" class="avatar placeholder">
              <div class="bg-neutral text-neutral-content rounded-full w-10 h-10">
                <span class="text-xs">{{ getInitials(attendee) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="card bg-base-200/50">
        <div class="card-body p-4">
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Details
          </h3>
          <dl class="space-y-2">
            <div class="flex justify-between">
              <dt class="text-base-content/60">Event ID</dt>
              <dd class="font-medium">{{ event.id }}</dd>
            </div>
            <div v-if="event.type" class="flex justify-between">
              <dt class="text-base-content/60">Type</dt>
              <dd class="font-medium">{{ formatType(event.type) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-base-300 mt-4">
      <div class="flex gap-2">
        <button @click="$emit('edit')" class="btn btn-primary flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Event
        </button>
        <button @click="confirmDelete" class="btn btn-error btn-outline flex-1">
          Delete
        </button>
        <button @click="$emit('close')" class="btn btn-ghost">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Meeting } from '@/types/calendar'

const props = defineProps<{
  event: Meeting
}>()

const emit = defineEmits<{
  edit: []
  close: []
  delete: []
  duplicate: [Meeting]
}>()

const formattedDate = computed(() => {
  if (!props.event.date) return 'No date'
  const date = new Date(props.event.date)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const duration = computed(() => {
  if (props.event.isAllDay) return 'All day'
  
  const start = props.event.startTime.split(':').map(Number)
  const end = props.event.endTime.split(':').map(Number)
  
  if (!start[0] || !start[1] || !end[0] || !end[1]) return ''
  
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  const diff = endMinutes - startMinutes
  
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  
  if (hours === 0) return `${minutes} minutes`
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`
})

const classificationBadgeClass = computed(() => {
  const base = 'badge-'
  const map: Record<string, string> = {
    'primary': 'badge-primary',
    'secondary': 'badge-secondary',
    'accent': 'badge-accent',
    'info': 'badge-info',
    'success': 'badge-success',
    'warning': 'badge-warning',
    'error': 'badge-error',
    'school_holiday': 'badge-warning'
  }
  return map[props.event.classification] || 'badge-primary'
})

const formatClassification = (classification: string) => {
  return classification.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete "${props.event.title}"?`)) {
    emit('delete')
  }
}

const duplicateEvent = () => {
  const duplicated = {
    ...props.event,
    id: '',
    title: `${props.event.title} (Copy)`
  }
  emit('duplicate', duplicated)
}
</script>
