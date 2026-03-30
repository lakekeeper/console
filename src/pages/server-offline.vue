<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-8 text-center" elevation="5" max-width="600" width="100%">
      <v-card-title class="text-h5 font-weight-bold">Lakekeeper is Offline</v-card-title>
      <v-card-subtitle>Please talk to your administrator</v-card-subtitle>
      <v-card-text>
        <v-btn block color="primary" size="large" @click="checkServerStatus">Check status</v-btn>
        <v-btn
          v-if="env.enabledAuthentication"
          block
          variant="outlined"
          size="large"
          class="mt-3"
          prepend-icon="mdi-logout"
          @click="logout">
          Logout
        </v-btn>

        <v-expansion-panels class="mt-6 text-left" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-information-outline</v-icon>
              Connection Details
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-table density="compact" class="text-body-2">
                <tbody>
                  <tr>
                    <td class="font-weight-medium" style="width: 140px">Catalog URL</td>
                    <td>
                      <code>{{ env.icebergCatalogUrl || '(not set)' }}</code>
                      <v-chip
                        v-if="isHttpUrl(env.icebergCatalogUrl)"
                        size="x-small"
                        color="warning"
                        class="ml-2">
                        HTTP
                      </v-chip>
                    </td>
                  </tr>
                  <tr v-if="env.enabledAuthentication">
                    <td class="font-weight-medium">IDP Authority</td>
                    <td>
                      <code>{{ env.idpAuthority || '(not set)' }}</code>
                      <v-chip
                        v-if="isHttpUrl(env.idpAuthority)"
                        size="x-small"
                        color="warning"
                        class="ml-2">
                        HTTP
                      </v-chip>
                    </td>
                  </tr>
                  <tr v-if="offlineReason">
                    <td class="font-weight-medium">Last Error</td>
                    <td>
                      <code v-if="offlineReason.statusCode">{{ offlineReason.statusCode }}</code>
                      {{ offlineReason.message }}
                    </td>
                  </tr>
                  <tr v-if="offlineReason">
                    <td class="font-weight-medium">Timestamp</td>
                    <td>{{ formatTimestamp(offlineReason.timestamp) }}</td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                v-if="isHttpUrl(env.icebergCatalogUrl) || (env.enabledAuthentication && isHttpUrl(env.idpAuthority))"
                type="warning"
                density="compact"
                variant="tonal"
                class="mt-3 text-body-2">
                A URL uses <strong>HTTP</strong> instead of <strong>HTTPS</strong>.
                This may cause mixed-content or CORS issues in the browser.
              </v-alert>

              <v-alert
                v-if="offlineReason && !offlineReason.statusCode"
                type="info"
                density="compact"
                variant="tonal"
                class="mt-3 text-body-2">
                Could not reach <code>{{ env.icebergCatalogUrl }}/management/v1/info</code>.
                Check if the URL is correct and the server is running.
              </v-alert>

              <v-alert
                v-if="offlineReason && (offlineReason.statusCode === 502 || offlineReason.statusCode === 503)"
                type="info"
                density="compact"
                variant="tonal"
                class="mt-3 text-body-2">
                The server returned {{ offlineReason.statusCode }}. It may be starting up or behind a misconfigured proxy.
              </v-alert>

              <v-alert
                v-if="offlineReason && offlineReason.statusCode === 500"
                type="error"
                density="compact"
                variant="tonal"
                class="mt-3 text-body-2">
                The server returned an internal error (500). Check the server logs for details.
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-expansion-panels class="mt-3 text-left" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-gamepad-variant-outline</v-icon>
              While you wait...
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-body-2">
                  Moves: <strong>{{ moves }}</strong>
                  <template v-if="gameWon"> &mdash; You won!</template>
                </span>
                <v-btn size="small" variant="text" @click="resetGame">New game</v-btn>
              </div>
              <v-row dense>
                <v-col v-for="(card, i) in cards" :key="i" cols="3">
                  <v-card
                    class="d-flex align-center justify-center"
                    :color="card.matched ? 'success' : card.flipped ? 'primary' : 'surface-variant'"
                    :variant="card.matched ? 'tonal' : card.flipped ? 'flat' : 'outlined'"
                    height="64"
                    style="cursor: pointer; user-select: none; font-size: 1.5rem"
                    @click="flipCard(i)">
                    <span v-if="card.flipped || card.matched">{{ card.emoji }}</span>
                    <v-icon v-else size="small">mdi-help</v-icon>
                  </v-card>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { useFunctions, useUserStore, useVisualStore } from '@lakekeeper/console-components';
import { computed, onMounted, onUnmounted, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import * as env from '../app.config';

const router = useRouter();
const visual = useVisualStore();
const functions = useFunctions();
const userStorage = useUserStore();

const offlineReason = computed(() => visual.offlineReason);

// Memory game
const emojis = ['🐳', '❄️', '🔥', '⚡', '🌊', '🪸', '🏔️', '🐧'];

interface MemoryCard {
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const cards = reactive<MemoryCard[]>([]);
const moves = ref(0);
const gameWon = computed(() => cards.length > 0 && cards.every((c) => c.matched));
let flippedIndices: number[] = [];
let lockBoard = false;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resetGame() {
  const pairs = shuffle(emojis).slice(0, 8);
  const deck = shuffle([...pairs, ...pairs]);
  cards.splice(0, cards.length, ...deck.map((emoji) => ({ emoji, flipped: false, matched: false })));
  moves.value = 0;
  flippedIndices = [];
  lockBoard = false;
}

function flipCard(index: number) {
  const card = cards[index];
  if (lockBoard || card.flipped || card.matched) return;
  card.flipped = true;
  flippedIndices.push(index);

  if (flippedIndices.length === 2) {
    moves.value++;
    const [a, b] = flippedIndices;
    if (cards[a].emoji === cards[b].emoji) {
      cards[a].matched = true;
      cards[b].matched = true;
      flippedIndices = [];
    } else {
      lockBoard = true;
      setTimeout(() => {
        cards[a].flipped = false;
        cards[b].flipped = false;
        flippedIndices = [];
        lockBoard = false;
      }, 800);
    }
  }
}

resetGame();

function isHttpUrl(url: string): boolean {
  return !!url && url.startsWith('http://');
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function logout() {
  userStorage.isAuthenticated = false;
  userStorage.unsetUser();
  router.push('/login');
}

async function checkServerStatus() {
  try {
    await functions.getServerInfo();
    router.push('/');
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  visual.showAppOrNavBar = false;
});
onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
