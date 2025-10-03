<template>
  <div>You're logged out</div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/user';
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVisualStore } from '../stores/visual';
const visual = useVisualStore();

const userStorage = useUserStore();
const router = useRouter();

onMounted(() => {
  userStorage.isAuthenticated = false;
  userStorage.unsetUser();
  visual.projectSelected['project-id'] = '';
  visual.projectSelected['project-name'] = 'None';

  router.push('/login');
  visual.showAppOrNavBar = false;
});
onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
