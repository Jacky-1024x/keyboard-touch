<script setup lang="ts">
import RotateTip from '@/components/RotateTip.vue'
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" :key="route.fullPath" />
  </RouterView>
  <RotateTip />
</template>
