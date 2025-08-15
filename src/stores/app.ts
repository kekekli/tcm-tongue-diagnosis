import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const theme = ref('light')
  const userSettings = ref({
    notifications: true,
    autoSave: true,
    analysisMode: 'comprehensive'
  })

  const initApp = () => {
    const savedTheme = localStorage.getItem('tcm-theme')
    if (savedTheme) {
      theme.value = savedTheme
    }

    const savedSettings = localStorage.getItem('tcm-user-settings')
    if (savedSettings) {
      userSettings.value = JSON.parse(savedSettings)
    }
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setTheme = (newTheme: string) => {
    theme.value = newTheme
    localStorage.setItem('tcm-theme', newTheme)
  }

  const updateUserSettings = (settings: any) => {
    userSettings.value = { ...userSettings.value, ...settings }
    localStorage.setItem('tcm-user-settings', JSON.stringify(userSettings.value))
  }

  return {
    isLoading,
    theme,
    userSettings,
    initApp,
    setLoading,
    setTheme,
    updateUserSettings
  }
})