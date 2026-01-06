<script setup>
import { Mail, LogoLinkedin } from '@vicons/ionicons5'
</script>

<template>
  <n-flex justify="center" align="center" vertical>
    <n-flex>
      <a href="https://github.com/twcoo" aria-label="GitHub profile linke">
        <n-icon size="20">
          <i class="devicon-github-original"></i>
        </n-icon>
      </a>

      <a href="https://www.linkedin.com/in/lester-cayabyab-5681953a5" aria-label="LinkedIn profile link">
        <n-icon size="20">
          <LogoLinkedin />
        </n-icon>
      </a>

      <a href="mailto:mflesterc@gmail.com" aria-label="Send email to mflesterc@gmail.com">
        <n-icon size="20">
          <Mail />
        </n-icon>
      </a>
    </n-flex>
    <n-text> &copy; {{ new Date().getFullYear() }} twcoo </n-text>
  </n-flex>
</template>
