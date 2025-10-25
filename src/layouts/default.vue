<template>
  <v-app>
    <AppBar v-if="visual.showAppOrNavBar" />
    <v-main>
      <AuthenticationDisabledWarningBanner
        v-if="!enabledAuthentication"></AuthenticationDisabledWarningBanner>
      <NavigationBar v-if="visual.showAppOrNavBar" />
      <router-view />
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
//

import { enabledAuthentication } from '@/app.config';
import { useVisualStore } from '@lakekeeper/console-components';
const visual = useVisualStore();
</script>
