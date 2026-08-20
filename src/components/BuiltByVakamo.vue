<template>
  <v-card class="vakamo-card" variant="outlined">
    <v-card-text class="pa-4">
      <div class="d-flex align-center flex-wrap ga-4">
        <component
          :is="isOnline ? 'a' : 'span'"
          v-bind="
            isOnline ? { href: websiteUrl, target: '_blank', rel: 'noopener noreferrer' } : {}
          "
          class="vakamo-link d-inline-flex align-center">
          <img :src="vakamoLogoSrc" alt="Vakamo" class="vakamo-logo" />
        </component>

        <div class="flex-grow-1 vakamo-copy">
          <div class="d-flex align-start ga-2 mb-1">
            <v-icon size="16" class="vakamo-bullet">mdi-open-source-initiative</v-icon>
            <div class="text-body-2 text-medium-emphasis">
              <strong>Lakekeeper</strong>
              — open source, built and maintained by Vakamo.
            </div>
          </div>
          <div class="d-flex align-start ga-2">
            <v-icon size="16" class="vakamo-bullet">mdi-star</v-icon>
            <div class="text-body-2 text-medium-emphasis">
              <strong>Lakekeeper+</strong>
              — automated maintenance, permissions as code, enterprise support.
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap ga-1">
          <v-btn
            v-if="isOnline"
            size="small"
            variant="text"
            prepend-icon="mdi-web"
            :href="websiteUrl"
            rel="noopener noreferrer"
            target="_blank">
            vakamo.com
          </v-btn>
          <v-btn
            v-if="isOnline"
            size="small"
            variant="text"
            prepend-icon="mdi-rocket-launch-outline"
            href="https://vakamo.com/trial/?utm_source=lakekeeper-console"
            rel="noopener noreferrer"
            target="_blank">
            Free trial
          </v-btn>
          <v-btn
            v-if="isOnline"
            size="small"
            variant="text"
            prepend-icon="mdi-calendar-clock"
            href="https://zcal.co/viktor-kessler/demo"
            rel="noopener noreferrer"
            target="_blank">
            Book a demo
          </v-btn>
          <!-- Always available: the only contact path that works air-gapped. -->
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-email-outline"
            @click="contactOpen = true">
            Contact
          </v-btn>
        </div>
      </div>
    </v-card-text>

    <ContactVakamoDialog v-model="contactOpen" :topic="topic" :subject="subject" />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ContactVakamoDialog,
  useConnectivity,
  useVisualStore,
} from '@lakekeeper/console-components';
import VakamoLogoDark from '@/assets/vakamo-logo.svg';
import VakamoLogoLight from '@/assets/vakamo-logo-white.svg';

const props = withDefaults(
  defineProps<{
    /** Identifies which surface the visit came from, for attribution. */
    source?: string;
    topic?: string;
    subject?: string;
  }>(),
  { source: 'console', topic: undefined, subject: undefined },
);

const visual = useVisualStore();
const { isOnline } = useConnectivity();
const contactOpen = ref(false);

const vakamoLogoSrc = computed(() => (visual.themeLight ? VakamoLogoDark : VakamoLogoLight));
const websiteUrl = computed(
  () => `https://vakamo.com/about?utm_source=lakekeeper-console&utm_medium=${props.source}`,
);
</script>

<style scoped>
.vakamo-card {
  border-radius: 12px !important;
}

.vakamo-logo {
  height: 26px;
  width: auto;
  vertical-align: middle;
  opacity: 0.85;
  transition: opacity 0.2s ease-in-out;
}

a.vakamo-link {
  text-decoration: none;
}

a.vakamo-link:hover .vakamo-logo {
  opacity: 1;
}

.vakamo-copy {
  min-width: 260px;
}

/* Nudged down so the glyph sits on the text baseline rather than above it. */
.vakamo-bullet {
  margin-top: 2px;
  opacity: 0.6;
}
</style>
