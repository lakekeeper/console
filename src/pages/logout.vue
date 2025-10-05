<template>
  <div>You're logged out</div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/user';
import { useAuth } from '../plugins/auth';
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVisualStore } from '../stores/visual';
import { enabledAuthentication } from '@/app.config';

const visual = useVisualStore();
const userStorage = useUserStore();
const router = useRouter();
const auth = useAuth();

onMounted(async () => {
  // Clear local user state
  userStorage.isAuthenticated = false;
  userStorage.unsetUser();
  visual.projectSelected['project-id'] = '';
  visual.projectSelected['project-name'] = 'None';
  visual.showAppOrNavBar = false;

  // If authentication is enabled, redirect to IDP logout
  if (enabledAuthentication) {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('OIDC logout failed:', error);
      // Even if OIDC logout fails, redirect to login
      router.push('/login');
    }
  } else {
    // If no authentication, just go to login page
    router.push('/login');
  }
});

onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
