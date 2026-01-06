import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const savedTheme = localStorage.getItem('theme')

  const systemPrefersDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false

  const isDark: Ref<boolean> = ref(
    savedTheme ? savedTheme === 'dark' : systemPrefersDark,
  )

  watch(isDark, (val: boolean) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
  })

  function toggleTheme(): void {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
})
