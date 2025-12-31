<template>
  <v-app>
    <AppBar v-if="visual.showAppOrNavBar" />
    <v-main>
      <AuthenticationDisabledWarningBanner
        v-if="!enabledAuthentication"></AuthenticationDisabledWarningBanner>
      <NavigationBar v-if="visual.showAppOrNavBar" />
      <router-view />
    </v-main>

    <AppFooter>
      <template #app-links>
        <v-btn
          v-if="visual.showAppOrNavBar"
          to="/dependencies"
          prepend-icon="mdi-link"
          size="small"
          variant="text">
          Dependencies
        </v-btn>
      </template>
    </AppFooter>

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
