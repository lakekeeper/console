<template>
  <div v-if="!visual.getServerInfo().bootstrapped">
    <v-row>
      <v-col cols="10" offset="1">
        <v-stepper v-model="currentStep" :items="['Global Admin', 'EULA', 'Submit']">
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
              <div
                ref="eulaScrollContainer"
                style="max-height: 50vh; overflow-y: auto"
                @scroll="handleEulaScroll">
                <EULA @scrolled-to-end="handleEulaScrolled"></EULA>
              </div>
              <v-card-text v-if="!eulaScrolledToEnd" class="text-center text-warning">
                Please scroll to the end of the EULA to continue
              </v-card-text>
            </v-card>
          </template>

          <template #actions>
            <div v-if="currentStep < 3" class="d-flex justify-space-between pa-4">
              <v-btn :disabled="currentStep === 1" variant="text" @click="prevStep">Previous</v-btn>
              <v-btn
                :disabled="isNextDisabled"
                color="primary"
                variant="elevated"
                @click="nextStep">
                Next
              </v-btn>
            </div>
          </template>

          <template #item.3>
            <v-card flat>
              <v-card-title>Consent</v-card-title>
              <v-card-text>
                By proceeding, you acknowledge that you have read, understood, and agree to the
                terms and conditions of the End User License Agreement (EULA).
              </v-card-text>
              <v-card-actions>
                <v-btn class="mb-6" variant="text" @click="prevStep">Previous</v-btn>
                <v-spacer></v-spacer>
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
import { onBeforeMount, onUnmounted, onMounted, ref, computed, watch, nextTick } from 'vue';
import { useUserStore } from '../stores/user';
import { useVisualStore } from '../stores/visual';
import { ServerInfo } from '@/gen/management/types.gen';
import router from '../router';
import { useFunctions } from '../plugins/functions';

const functions = useFunctions();
const userStore = useUserStore();
const user = userStore.getUser();
const visual = useVisualStore();

const currentStep = ref(1);
const eulaScrolledToEnd = ref(false);
const eulaScrollContainer = ref<HTMLElement | null>(null);

const isNextDisabled = computed(() => {
  // Disable next button on step 2 (EULA) until it's been scrolled to the end
  if (currentStep.value === 2) {
    return !eulaScrolledToEnd.value;
  }
  return false;
});

// Watch for step changes to check scroll position
watch(currentStep, async (newStep) => {
  if (newStep === 2) {
    // Wait for DOM to update
    await nextTick();
    // Check if content is already fully visible (no scrolling needed)
    if (eulaScrollContainer.value) {
      const { scrollHeight, clientHeight } = eulaScrollContainer.value;
      if (scrollHeight <= clientHeight) {
        eulaScrolledToEnd.value = true;
      }
    }
  }
});

function handleEulaScroll(event: Event) {
  const target = event.target as HTMLElement;
  if (!target) return;

  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;

  // Check if scrolled to bottom (with a small threshold of 10px)
  // or if content is shorter than container (no scroll needed)
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10 || scrollHeight <= clientHeight;

  if (isAtBottom && !eulaScrolledToEnd.value) {
    eulaScrolledToEnd.value = true;
  }
}

function handleEulaScrolled(scrolled: boolean) {
  eulaScrolledToEnd.value = scrolled;
}

function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
    // Reset EULA scroll state when going back to step 1
    if (currentStep.value === 1) {
      eulaScrolledToEnd.value = false;
    }
  }
}

onBeforeMount(async () => {
  await getServerInfo();
});

async function bootstrap() {
  try {
    await functions.bootstrapServer();
  } catch (error) {
    console.error('Error during bootstrap:', error);
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
