<template>
  <div v-if="!visual.getServerInfo().bootstrapped">
    <v-row>
      <v-col cols="10" offset="1">
        <v-stepper :items="['Global Admin', 'EULA', 'Submit']">
          <template #item.1>
            <v-card flat>
              <v-card-title>Welcome {{ user.given_name }} {{ user.family_name }}</v-card-title>
              <v-card-text>
                Welcome to the initial setup for your system! As part of this setup, you'll create a
                Global Admin—a key user with full permissions to configure and manage your
                platform's settings and users.
              </v-card-text>
            </v-card>
          </template>

          <template #item.2>
            <v-card flat>
              <div style="max-height: 50vh; overflow-y: auto">
                <EULA></EULA>
              </div>
            </v-card>
          </template>

          <template #item.3>
            <v-card flat>
              <v-card-title>Consent</v-card-title>
              <v-card-text>
                By proceeding, you acknowledge that you have read, understood, and agree to the
                terms and conditions of the End User License Agreement (EULA).
              </v-card-text>
              <v-card-actions>
                <v-btn class="mb-6" color="success" variant="elevated" @click="bootstrap">
                  Accept
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-stepper>
      </v-col>
    </v-row>

    <div class="scrollable-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, onUnmounted, onMounted } from 'vue';
import { useUserStore } from '../stores/user';
import { useVisualStore } from '../stores/visual';
import { ServerInfo } from '@/gen/management/types.gen';
import router from '../router';
import { useFunctions } from '../plugins/functions';

const functions = useFunctions();
const userStore = useUserStore();
const user = userStore.getUser();
const visual = useVisualStore();

onBeforeMount(async () => {
  await getServerInfo();
});

async function bootstrap() {
  try {
    await functions.bootstrapServer();
  } catch (error) {
    console.error(error);
  } finally {
    await getServerInfo();
  }
}

onMounted(() => {
  visual.showAppOrNavBar = false;
});
onUnmounted(() => {
  visual.showAppOrNavBar = true;
});

async function getServerInfo() {
  try {
    const data: ServerInfo = await functions.getServerInfo();
    visual.setServerInfo(data);
    if (visual.getServerInfo().bootstrapped) router.push('/');
  } catch (error) {
    console.error(error);
  }
}
</script>

<style scoped>
.scrollable-container {
  max-width: 80%;
  margin: auto;
}

.scrollable-content {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}
</style>
