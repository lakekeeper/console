<template>
  <v-app>
    <AppBar v-if="visual.showAppOrNavBar" />
    <v-main>
      <NavigationBar v-if="visual.showAppOrNavBar" />
      <router-view />
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
//

import { useVisualStore } from '@/stores/visual';
const visual = useVisualStore();
</script>
