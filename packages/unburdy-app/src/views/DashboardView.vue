<template>
    <DrawerLayout>
        <div class="container flex flex-col h-full lg:h-screen mx-auto pb-4 px-4">
            <ViewHeader title="Dashboard">
                <template #buttons>
                    <div></div>
                </template>
            </ViewHeader>
        </div>
    </DrawerLayout>
</template>
<script setup lang="ts">
import DrawerLayout from '@/components/layout/DrawerLayout.vue'
import ViewHeader from '@/components/ViewHeader.vue'
</script>