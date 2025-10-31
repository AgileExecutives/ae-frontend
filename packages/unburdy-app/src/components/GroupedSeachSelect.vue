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
        @change="onSearchChanged"
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
import { ref, computed, watch } from "vue";

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

const clearInput = () => {
  search.value = "";
  selected.value = "";
  emit("update:modelValue", "");
};

const onSearchChanged = () => {
  selected.value = ""; // No special action needed here since filtering is reactive
  emit("update:modelValue", search.value);
  openSelect();
};

const handleEnterKey = () => {
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
};

function openSelect() {
  if (selectRef.value) {
    selectRef.value.focus(); // Focus the select
    // Simulate pressing 'ArrowDown' key
    const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    selectRef.value.dispatchEvent(e);
  }
}

const updateSelected = () => {
  search.value = selected.value;
  emit("update:modelValue", selected.value);
};

watch(selected, (v) => emit("update:modelValue", v));

const groupedOptions = computed(() => {
  const query = (selected.value.length > 0 ? '' : search.value.trim().toLowerCase());
  const filtered = query
    ? props.options.filter((o) =>
        o.label.toLowerCase().includes(query)
      )
    : props.options;

  return filtered.reduce<Record<string, Option[]>>((acc, opt) => {
    if (!acc[opt.category]) {
      acc[opt.category] = [];
    }
    acc[opt.category]!.push(opt);
    return acc;
  }, {});
});
</script>
