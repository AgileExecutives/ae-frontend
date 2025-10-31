<template>
  <div class="relative w-full">
    <select
      ref="selectRef" 
      class="select select-bordered w-full z-10"
      v-model="selected"
      @change="updateSelected"
    >
      <optgroup
        v-for="(groupItems, groupName) in groupedOptions"
        :label="groupName"
        :key="groupName"
        class="w-full"
      >
        <option
          v-for="opt in groupItems"
          :key="opt.value"
          :value="opt.value"
          class="w-full"
        >
          {{ opt.label }}
        </option>
      </optgroup>
    </select>

    <div class="flex items-start w-[calc(100%-2.1rem)] inset-1 absolute ">
      <input
        type="text"
        v-model="search"
        class="input border-transparent h-[calc(100%-0.08rem)] flex-grow z-20"
        placeholder="Search..."
        @input="onSearchChanged"
        @keydown.enter.prevent="handleEnterKey"
      />
      <button class="border-transparent bg-base-100 z-10 h-[calc(100%-0.07rem)]" @click.prevent="clearInput">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler size-5 icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> 
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";

type Option = {
  label: string;
  value: string;
  category: string;
};

const props = defineProps<{
  options: Option[];
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();



const selectRef = ref<HTMLSelectElement | null>(null);
const search = ref("");
const selected = ref(props.modelValue ?? "");

// Semaphore to prevent reactivity cycles
const isUpdatingInternally = ref(false);

// Debounce timer for search input
let searchTimeout: NodeJS.Timeout | null = null;

onMounted(() => {
  // Ensure search field shows modelValue on mount, regardless of options state
  if (props.modelValue && !search.value) {
    isUpdatingInternally.value = true;
    search.value = props.modelValue;
    selected.value = props.modelValue;
    isUpdatingInternally.value = false;
  }
});

const clearInput = () => {
  isUpdatingInternally.value = true;
  search.value = "";
  selected.value = "";
  emit("update:modelValue", "");
  isUpdatingInternally.value = false;
};

const onSearchChanged = () => {
  // Clear selected when searching (this allows filtering to work)
  if (search.value !== selected.value) {
    selected.value = "";
  }
  
  // Clear any existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Debounce the emit to prevent too many updates to parent
  searchTimeout = setTimeout(() => {
    if (!isUpdatingInternally.value) {
      isUpdatingInternally.value = true;
      emit("update:modelValue", search.value);
      isUpdatingInternally.value = false;
    }
  }, 300);
};

const handleEnterKey = () => {
  isUpdatingInternally.value = true;
  
  // Get the first available option from filtered results
  const firstGroup = Object.values(groupedOptions.value)[0];
  if (firstGroup && firstGroup.length > 0) {
    const firstOption = firstGroup[0];
    if (firstOption) {
      selected.value = firstOption.value;
      search.value = firstOption.value;
      emit("update:modelValue", firstOption.value);
    }
  } else if (search.value.trim()) {
    // If no options match but there's search text, emit the search text
    selected.value = search.value;
    emit("update:modelValue", search.value);
  }
  
  isUpdatingInternally.value = false;
};

function openSelect() {
  if (selectRef.value) {
    selectRef.value.focus();
    const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    selectRef.value.dispatchEvent(e);
  }
}

const updateSelected = () => {
  isUpdatingInternally.value = true;
  search.value = selected.value;
  emit("update:modelValue", selected.value);
  isUpdatingInternally.value = false;
};

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    console.log("🎯 ModelValue prop changed:", newValue);
    if (isUpdatingInternally.value) {
      console.log("🎯 Skipping prop update - internal update in progress");
      return;
    }
    
    if (newValue !== selected.value) {
      isUpdatingInternally.value = true;
      selected.value = newValue ?? "";
      search.value = newValue ?? "";
      console.log("🎯 Updated search field to:", newValue);
      isUpdatingInternally.value = false;
    }
  },
  { immediate: true }
);

// Watch for options loading - when options become available, ensure search field is populated
watch(
  () => props.options,
  (newOptions) => {
    console.log("🎯 Options changed:", { count: newOptions?.length || 0 });
    
    // If options just loaded and we have a modelValue but search is empty, populate search
    if (newOptions && newOptions.length > 0 && props.modelValue && !search.value) {
      console.log("🎯 Options loaded, populating search with modelValue:", props.modelValue);
      isUpdatingInternally.value = true;
      search.value = props.modelValue;
      selected.value = props.modelValue;
      isUpdatingInternally.value = false;
    }
  },
  { immediate: true }
);

// Watch for internal changes
watch(selected, (v) => {
  console.log("🎯 Selected changed internally:", v);
  if (isUpdatingInternally.value) {
    console.log("🎯 Skipping emit - internal update in progress");
    return;
  }
  
  isUpdatingInternally.value = true;
  emit("update:modelValue", v);
  isUpdatingInternally.value = false;
});

const groupedOptions = computed(() => {
  if (!props.options || props.options.length === 0) {
    return {};
  }
  
  // Filter based on search input (always filter, even if something is selected)
  const query = search.value.trim().toLowerCase();
  const filtered = query
    ? props.options.filter((o) =>
        o.label.toLowerCase().includes(query)
      )
    : props.options;

  const grouped = filtered.reduce<Record<string, Option[]>>((acc, opt) => {
    if (!acc[opt.category]) {
      acc[opt.category] = [];
    }
    acc[opt.category]!.push(opt);
    return acc;
  }, {});
  
  return grouped;
});
</script>
