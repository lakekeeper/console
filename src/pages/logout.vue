<template>
  <div class="d-flex justify-center align-center" style="height: 100vh">
    <v-card class="pa-8 text-center" elevation="2" max-width="400">
      <v-icon color="info" size="64">mdi-logout</v-icon>
      <v-card-title class="text-h5 mt-4">Logging out...</v-card-title>
      <v-card-text>
        <p>You are being logged out. Please wait...</p>
        <v-progress-linear color="info" indeterminate class="mt-4"></v-progress-linear>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../plugins/auth';
import { useVisualStore } from '../stores/visual';
import { useUserStore } from '../stores/user';
import { useConfig } from '@lakekeeper/console-components';

const router = useRouter();
const visual = useVisualStore();
const userStorage = useUserStore();
const auth = useAuth();
const config = useConfig();

onMounted(async () => {
  const wasAuthenticated = userStorage.isAuthenticated;

  // Clear local user state
  userStorage.isAuthenticated = false;
  userStorage.unsetUser();
  visual.projectSelected['project-id'] = '';
  visual.projectSelected['project-name'] = 'None';
  visual.showAppOrNavBar = false;

  // If authentication is enabled AND user was authenticated, redirect to IDP logout
  // If user was NOT authenticated, it means we're returning from IDP redirect
  if (config.enabledAuthentication.value && wasAuthenticated) {
    try {
      // This will redirect away from the app to IDP - no code after this will execute
      await auth.signOut();
    } catch (error) {
      console.error('OIDC logout failed:', error);
      // Only redirect to login if OIDC logout fails
      router.push('/login');
    }
  } else {
    // Either no authentication OR returning from IDP redirect - go to login
    setTimeout(() => {
      router.push('/login');
    }, 500);
  }
});

onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
