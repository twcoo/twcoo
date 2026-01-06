<script setup>
import { darkTheme } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'

import Navbar from '@/components/Navbar.vue'
import Profile from '@/components/Profile.vue'
import Timeline from '@/components/Timeline.vue'
import Tools from '@/components/Tools.vue'
import Footer from '@/components/Footer.vue'

const theme = useThemeStore()
</script>

<template>
  <n-config-provider :theme="theme.isDark ? darkTheme : null">
    <n-layout style="height: 100vh">
      <n-layout-header bordered class="sticky top-0 z-50 p-4">
        <Navbar />
      </n-layout-header>
      <n-layout-content class="min-h-screen overflow-x-hidden">
        <section id="profile">
          <Profile />
        </section>

        <section id="timeline">
          <Timeline />
        </section>

        <section id="tools">
          <Tools />
        </section>
      </n-layout-content>
      <n-layout-footer bordered class="p-4">
        <Footer />
      </n-layout-footer>
    </n-layout>
  </n-config-provider>
</template>
