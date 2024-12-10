<template>
  <v-app>
    <v-main>
      <router-view />
      <snackbar-message></snackbar-message>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { enabledAuthorization } from "@/app.config";
import router from "@/router";
import { useVisualStore } from "@/stores/visual";
import { useFunctions } from "@/plugins/functions";
const functions = useFunctions();

const visual = useVisualStore();

onMounted(async () => {
  try {
    if (!enabledAuthorization) {
      const serverInfo = await functions.getServerInfo();

      if (!serverInfo.bootstrapped) router.push("/bootstrap");
      visual.showAppOrNavBar = true;
    }
  } catch (error) {
    console.error("Error during App processing:", error);
  }
});
</script>
