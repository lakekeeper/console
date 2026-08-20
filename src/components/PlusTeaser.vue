<template>
  <div :class="['plus-teaser', { 'plus-teaser--compact': compact }]">
    <!-- Hero -->
    <div class="hero text-center" :class="compact ? 'py-8' : 'py-10'">
      <img :src="plusLogoSrc" alt="Lakekeeper+" class="plus-logo mb-6" />
      <h1 :class="compact ? 'text-h5' : 'text-h4'" class="font-weight-bold mb-3">
        {{ title }}
      </h1>
      <!-- An array renders one line per entry, for copy that wants a deliberate
           break rather than wherever the measure happens to wrap. -->
      <p
        v-for="line in descriptionLines"
        :key="line"
        class="text-body-1 text-medium-emphasis mx-auto hero-copy mb-0">
        {{ line }}
      </p>

      <div class="d-flex justify-center flex-wrap ga-2 mt-6">
        <!-- External CTAs appear only once connectivity is confirmed; the
             contact dialog is offline-safe and always offered. -->
        <v-btn
          v-if="isOnline"
          variant="flat"
          :size="compact ? 'small' : 'default'"
          prepend-icon="mdi-rocket-launch-outline"
          :href="TRIAL_URL"
          target="_blank"
          rel="noopener noreferrer">
          Start free trial
        </v-btn>
        <v-btn
          v-if="isOnline"
          variant="outlined"
          :size="compact ? 'small' : 'default'"
          prepend-icon="mdi-calendar-clock"
          @click="bookDemo">
          Request a demo
        </v-btn>
        <!-- Outlined when it stands alone offline, so the only remaining action
             still reads as one. -->
        <v-btn
          :variant="isOnline ? 'text' : 'outlined'"
          :size="compact ? 'small' : 'default'"
          prepend-icon="mdi-email-outline"
          @click="contactOpen = true">
          Contact us
        </v-btn>
        <v-btn
          v-if="isOnline"
          variant="text"
          :size="compact ? 'small' : 'default'"
          prepend-icon="mdi-open-in-new"
          :href="learnMoreUrl"
          target="_blank"
          rel="noopener noreferrer">
          Learn more
        </v-btn>
      </div>
    </div>

    <!-- Feature grid. Narrows as the columns get fewer, so square cards stay a
         sensible size instead of ballooning to half the page. -->
    <div class="feature-grid mx-auto" :style="{ maxWidth: `${gridMaxWidth}px` }">
      <v-row class="py-2" dense>
        <v-col v-for="feature in features" :key="feature.title" cols="12" sm="6" :md="featureCols">
          <v-card class="feature-card fill-height" variant="outlined">
            <div
              class="feature-body d-flex flex-column align-center justify-center text-center pa-5">
              <!-- Tonal tile rather than a solid fill: it keeps its weight in
                   both themes without shouting. -->
              <div class="feature-icon d-flex align-center justify-center mb-4">
                <v-icon color="primary" size="24">{{ feature.icon }}</v-icon>
              </div>
              <div class="text-subtitle-1 font-weight-bold mb-2">{{ feature.title }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ feature.text }}</div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- What the open-source edition already does — stated plainly so the page
         reads as an upgrade path rather than a paywall on existing features. -->
    <v-alert
      v-if="$slots['oss-note']"
      variant="tonal"
      density="comfortable"
      class="my-4"
      icon="mdi-information-outline">
      <div class="text-body-2"><slot name="oss-note"></slot></div>
    </v-alert>

    <div class="py-2 pb-6">
      <BuiltByVakamo :source="source" :topic="topic" :subject="subject" />
    </div>

    <ContactVakamoDialog v-model="contactOpen" :topic="topic" :subject="subject" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ContactVakamoDialog,
  useConnectivity,
  useVisualStore,
} from '@lakekeeper/console-components';
import BuiltByVakamo from '@/components/BuiltByVakamo.vue';
import PlusLogoDark from '@/assets/lakekeeper-lockup-plus.svg';
import PlusLogoLight from '@/assets/lakekeeper-lockup-plus-white.svg';

const DEMO_URL = 'https://zcal.co/viktor-kessler/demo';
/** Self-service Lakekeeper+ trial licence. */
const TRIAL_URL = 'https://vakamo.com/trial/?utm_source=lakekeeper-console';

export interface PlusFeature {
  icon: string;
  title: string;
  text: string;
}

const props = withDefaults(
  defineProps<{
    title: string;
    /** A string wraps naturally; an array renders one line per entry. */
    description: string | string[];
    features?: PlusFeature[];
    /** utm_medium, so we can tell which surface drove the visit. */
    source?: string;
    topic?: string;
    subject?: string;
    /** Tightens spacing for use inside a tab rather than as a full page. */
    compact?: boolean;
  }>(),
  {
    features: () => [],
    source: 'console',
    topic: 'Lakekeeper+ evaluation',
    subject: undefined,
    compact: false,
  },
);

const visual = useVisualStore();
const { isOnline } = useConnectivity();
const contactOpen = ref(false);

// Three across when the count divides evenly by three, otherwise two — so four
// features read as a balanced 2x2 rather than a row of three and an orphan.
const descriptionLines = computed(() =>
  Array.isArray(props.description) ? props.description : [props.description],
);

const featureCols = computed(() => (props.features.length % 3 === 0 ? 4 : 6));

// Two columns of squares want a narrower block than three, or each card ends up
// half the page wide and equally tall.
const gridMaxWidth = computed(() => (featureCols.value === 6 ? 720 : 1040));

const plusLogoSrc = computed(() => (visual.themeLight ? PlusLogoDark : PlusLogoLight));
const learnMoreUrl = computed(
  () => `https://vakamo.com/product?utm_source=lakekeeper-console&utm_medium=${props.source}`,
);

function bookDemo() {
  window.open(DEMO_URL, '_blank', 'noopener,noreferrer');
}
</script>

<style scoped>
/* Marketing copy reads badly at full console width — cap the measure and centre
   it so the cards carry text rather than whitespace. */
.plus-teaser {
  max-width: 1040px;
  margin: 0 auto;
  width: 100%;
}

.hero {
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.07) 0%,
    rgba(var(--v-theme-primary), 0) 100%
  );
}

.hero-copy {
  max-width: 620px;
}

.plus-logo {
  width: 100%;
  max-width: 340px;
  height: auto;
}

.plus-teaser--compact .plus-logo {
  max-width: 280px;
}

.feature-card {
  border-radius: 14px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.18);
  border-color: rgb(var(--v-theme-primary));
}

/* Sized to its content; height: 100% only so cards in a row line up. */
.feature-body {
  height: 100%;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.12);
}
</style>
