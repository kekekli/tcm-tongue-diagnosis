<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.initApp()
})
</script>

<style>
#app {
  height: 100vh;
  background-color: #f8f9fa;
}
</style>