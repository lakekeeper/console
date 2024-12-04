<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card elevation="5" class="pa-8 text-center" max-width="600">
      <v-card-title class="text-h5 font-weight-bold">
        Lakekeeper is Offline
      </v-card-title>
      <v-card-subtitle> Please talk to your administrator </v-card-subtitle>
      <v-card-text>
        <v-btn color="primary" block large @click="chekServerStatus">
          Check status
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { useFunctions } from "../plugins/functions";
import { onMounted, onUnmounted, ref } from "vue";
import { useVisualStore } from "../stores/visual";
import router from "../router";

const visual = useVisualStore();
const functions = useFunctions();

const serverIsOnline = ref(false);

async function chekServerStatus() {
  try {
    await functions.getServerInfo();
    serverIsOnline.value = true;
    router.push("/");
  } catch (error) {
    serverIsOnline.value = false;
    console.error(error);
  }
}

onMounted(async () => {
  // if (enabledAuthorization) auth.initUser(); // Initialize the user on mount

  visual.showAppOrNavBar = false;
});
onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
