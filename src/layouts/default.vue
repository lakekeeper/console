<template>
  <v-app>
    <AppBar v-if="visual.showAppOrNavBar" />
    <v-main>
      <AuthorizationOffBanner v-if="!enabledAuthentication"></AuthorizationOffBanner>
      <NavigationBar v-if="visual.showAppOrNavBar" />
      <router-view />
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
//

import AuthorizationOffBanner from '@/components/AuthenticationDisabledWarningBanner.vue';
import { enabledAuthentication } from '@/app.config';
import { useVisualStore } from '@/stores/visual';
const visual = useVisualStore();
</script>
