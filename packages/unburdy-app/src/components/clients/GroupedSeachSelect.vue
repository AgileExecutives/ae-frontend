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
      <button class="border-transparent bg-base-100 z-10 h-[calc(100%-0.07rem)]"  @click.prevent="clearInput">
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
// ABSOLUTE FIRST LINE - should show no matter what
console.log("=== COMPONENT LOADING START ===");

import { ref, computed, watch, onMounted } from "vue";

console.log("=== IMPORTS DONE ===");

type Option = {
  label: string;
  value: string;
  category: string;
};

console.log("=== TYPE DEFINED ===");

const props = defineProps<{
  options: Option[];
  modelValue?: string;
}>();

console.log("=== PROPS DEFINED ===");

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

console.log("=== EMITS DEFINED ===");
console.log("=== RECEIVED PROPS:", props);
console.log("=== OPTIONS COUNT:", props.options?.length);
console.log("=== MODEL VALUE:", props.modelValue);

const selectRef = ref<HTMLSelectElement | null>(null);
const search = ref("");
const selected = ref("");

console.log("=== REFS CREATED ===");

// Initialize component state on mount
onMounted(() => {
  console.log("� COMPONENT MOUNTED!");
  console.log("🟢 Props on mount:", {
    modelValue: props.modelValue,
    optionsCount: props.options?.length || 0
  });
  
  if (props.modelValue) {
    search.value = props.modelValue;
    selected.value = props.modelValue;
    console.log("🟡 Set initial values to:", props.modelValue);
  }
});

// Simple watch
watch(
  () => props.modelValue,
  (newValue) => {
    console.log("👀 Model value changed to:", newValue);
    if (newValue) {
      search.value = newValue;
      selected.value = newValue;
    }
  },
  { immediate: true }
);

console.log("=== WATCHERS SET UP ===");

// Simple functions
const clearInput = () => {
  console.log("🗑️ Clear called");
  search.value = "";
  selected.value = "";
  emit("update:modelValue", "");
};

const updateSelected = () => {
  console.log("✅ Update selected:", selected.value);
  search.value = selected.value;
  emit("update:modelValue", selected.value);
};

const onSearchChanged = () => {
  console.log("� Search changed:", search.value);
  emit("update:modelValue", search.value);
};

const handleEnterKey = () => {
  console.log("⏎ Enter pressed");
};

// Simple computed
const groupedOptions = computed(() => {
  console.log("💭 Computing options, count:", props.options?.length);
  
  if (!props.options || props.options.length === 0) {
    console.log("💭 No options available");
    return {};
  }
  
  const result = props.options.reduce<Record<string, Option[]>>((acc, opt) => {
    if (!acc[opt.category]) {
      acc[opt.category] = [];
    }
    acc[opt.category]!.push(opt);
    return acc;
  }, {});
  
  console.log("💭 Grouped into categories:", Object.keys(result));
  return result;
});

console.log("=== SETUP COMPLETE ===");
</script>
