<template>
  <v-app>
    <v-main>
      <router-view />
      <SnackbarMessage ref="snackbarRef" :message="visual.snackbarMsg" @close="clearSnackbar" />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { enabledAuthentication } from '@/app.config';
import router from '@/router';
import { useVisualStore } from '@/stores/visual';
import { useFunctions } from '@/plugins/functions';
import { SnackbarMessage } from '@lakekeeper/console-components';
import { Type } from '@/common/interfaces';

const functions = useFunctions();
const visual = useVisualStore();
const snackbarRef = ref<InstanceType<typeof SnackbarMessage>>();

function clearSnackbar() {
  visual.setSnackbarMsg({
    text: '',
    ttl: 0,
    ts: 0,
    type: Type.ERROR,
  });
}

// Watch for changes in snackbarMsg and activate the external component
watch(
  () => visual.snackbarMsg.ts,
  (newTs) => {
    if (newTs && visual.snackbarMsg.text && snackbarRef.value) {
      // Use the external component's addMessage method
      snackbarRef.value.addMessage({
        text: visual.snackbarMsg.text,
        timeout: visual.snackbarMsg.ttl,
        type: visual.snackbarMsg.type,
      });
    }
  },
  { immediate: true },
);

onMounted(async () => {
  try {
    if (!enabledAuthentication) {
      const serverInfo = await functions.getServerInfo();

      if (!serverInfo.bootstrapped) router.push('/bootstrap');
      visual.showAppOrNavBar = true;
    }
  } catch (error) {
    console.error('Error during App processing:', error);
  }
});
</script>
