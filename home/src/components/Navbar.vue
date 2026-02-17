<script setup lang="ts">
import { ref, computed } from "vue";
import { Menu, SunnyOutline, Moon } from "@vicons/ionicons5";
import { useThemeStore } from "@/stores/theme";
import { NConfigProvider, GlobalThemeOverrides } from "naive-ui";

const themeOverrides: GlobalThemeOverrides = {
  Anchor: {
    linkFontSize: ".9rem",
  },
};

const theme = useThemeStore();
const showMenu = ref(false);

const logoSrc = computed(() =>
  theme.isDark ? "/twcoo_logo_dark.png" : "/twcoo_logo_light.png",
);
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <header class="w-full">
      <n-flex
        justify="space-between"
        align="center"
        class="max-w-7xl mx-auto px-4"
      >
        <!-- Logo -->
        <a href="/" class="flex items-center space-x-2">
          <n-image
            height="40"
            width="40"
            :src="logoSrc"
            alt="twcoo logo"
            preview-disabled
          />
          <n-text class="text-lg font-semibold">twcoo</n-text>
        </a>

        <!-- Desktop menu -->
        <div class="hidden lg:flex items-center space-x-6">
          <n-anchor class="flex space-x-6" type="block">
            <n-anchor-link title="Profile" href="#profile" />
            <n-anchor-link title="Timeline" href="#timeline" />
            <n-anchor-link title="Tools" href="#tools" />
          </n-anchor>

          <n-switch v-model:value="theme.isDark">
            <template #checked-icon>
              <n-icon>
                <SunnyOutline />
              </n-icon>
            </template>
            <template #unchecked-icon>
              <n-icon>
                <Moon />
              </n-icon>
            </template>
          </n-switch>
        </div>

        <!-- Mobile hamburger -->
        <div class="lg:hidden">
          <n-button
            quaternary
            circle
            @click="showMenu = true"
            aria-label="Open menu"
          >
            <n-icon size="24">
              <Menu />
            </n-icon>
          </n-button>
        </div>
      </n-flex>
    </header>

    <!-- Drawer for mobile -->
    <n-drawer v-model:show="showMenu" placement="right">
      <n-drawer-content>
        <n-anchor class="flex flex-col space-y-4" type="block">
          <n-anchor-link title="Profile" href="#profile" />
          <n-anchor-link title="Timeline" href="#timeline" />
          <n-anchor-link title="Tools" href="#tools" />
        </n-anchor>

        <n-switch v-model:value="theme.isDark" class="mt-4">
          <template #checked-icon>
            <n-icon>
              <SunnyOutline />
            </n-icon>
          </template>
          <template #unchecked-icon>
            <n-icon>
              <Moon />
            </n-icon>
          </template>
        </n-switch>
      </n-drawer-content>
    </n-drawer>
  </n-config-provider>
</template>
