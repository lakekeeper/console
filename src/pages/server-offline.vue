<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-8 text-center" elevation="5" max-width="600">
      <v-card-title class="text-h5 font-weight-bold">Lakekeeper is Offline</v-card-title>
      <v-card-subtitle>Please talk to your administrator</v-card-subtitle>
      <v-card-text>
        <v-btn block color="primary" large @click="checkServerStatus">Check status</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { useFunctions } from '@lakekeeper/console-components';
import { onMounted, onUnmounted } from 'vue';
import { useVisualStore } from '../stores/visual';
import router from '../router';

const visual = useVisualStore();
const functions = useFunctions();

async function checkServerStatus() {
  try {
    await functions.getServerInfo();
    router.push('/');
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  visual.showAppOrNavBar = false;
});
onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
