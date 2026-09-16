<template>
  <v-app>
    <AppBar v-if="visual.showAppOrNavBar" />
    <NavigationBar v-if="visual.showAppOrNavBar" />
    <v-main>
      <AuthenticationDisabledWarningBanner
        v-if="!enabledAuthentication"></AuthenticationDisabledWarningBanner>
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <div
            :key="route.path"
            style="
              min-height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
              display: flex;
              flex-direction: column;
            ">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </v-main>

    <!-- Dependencies moved to Server settings: the footer is chrome on every
         page, and a licence/attribution list is something you look up once. -->
    <AppFooter show-built-by />

    <!-- Notification Panel - placed at app level for proper overlay -->
    <NotificationPanel />
  </v-app>
</template>

<script lang="ts" setup>
//

import { enabledAuthentication } from '@/app.config';
import { useVisualStore } from '@lakekeeper/console-components';
const visual = useVisualStore();
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
