<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-8 text-center" elevation="5" max-width="500">
      <v-card-title class="text-h5 font-weight-bold">Welcome to Lakekeeper!</v-card-title>
      <v-card-subtitle>Please log in to access your account</v-card-subtitle>
      <v-card-text>
        <v-btn block color="primary" large @click="login">Login</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { useAuth } from '../plugins/auth';
import { enabledAuthentication } from '../app.config';
import { onMounted } from 'vue';
import { useVisualStore } from '../stores/visual';
const visual = useVisualStore();
const auth = useAuth();

function login() {
  if (enabledAuthentication) auth.initUser();
}

onMounted(() => {
  // if (enabledAuthentication) auth.initUser(); // Initialize the user on mount
  visual.showAppOrNavBar = false;
});
onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
