<script setup>
import timeline from '@/data/timeline'
import { Briefcase } from '@vicons/ionicons5'
</script>

<template>
  <n-flex justify="center" class="pt-16">
    <n-card
      :bordered="false"
      class="max-w-2xl"
      :style="{ backgroundColor: 'transparent', boxShadow: 'none' }"
    >
      <n-h2 class="underline underline-offset-8">Timeline</n-h2>
      <n-timeline>
        <n-timeline-item
          v-for="item in timeline"
          :key="item.id"
          class="pb-5"
          :time="`${item.year} - ${item.duration}`"
          :content="item.details"
        >
          <template #icon>
            <Briefcase />
          </template>
          <template #header>
            <n-h3>{{ item.title }}</n-h3>
            <n-h4>{{ item.company }}</n-h4>
          </template>
        </n-timeline-item>
      </n-timeline>
    </n-card>
  </n-flex>
</template>
