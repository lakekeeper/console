<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-center fill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>
    </v-responsive>
  </v-container>
  <div v-else>
    <v-container v-if="assignedToProjects" class="home-container" fluid>
      <!-- Row 1: SVG Logo -->
      <v-row class="logo-row">
        <v-col cols="12" class="text-center py-3">
          <v-img class="mx-auto" max-width="280" src="@/assets/LAKEKEEPER_IMAGE_TEXT.svg" />
        </v-col>
      </v-row>

      <!-- Row 2: GitHub Button with Stats -->
      <v-row class="github-row">
        <v-col cols="12" class="text-center py-2">
          <div class="d-flex align-center justify-center flex-wrap gap-2 mb-3">
            <v-chip v-if="version" class="stat-chip" size="small" variant="flat">
              <v-icon start size="small">mdi-tag-outline</v-icon>
              {{ version }}
            </v-chip>
            <v-chip v-if="starCount > 0" class="stat-chip" size="small" variant="flat">
              <v-icon start size="small">mdi-star-outline</v-icon>
              {{ starCount }}
            </v-chip>
            <v-chip v-if="forksCount > 0" class="stat-chip" size="small" variant="flat">
              <v-icon start size="small">mdi-source-fork</v-icon>
              {{ forksCount }}
            </v-chip>
          </div>
          <v-btn
            class="github-btn"
            href="https://github.com/lakekeeper/lakekeeper"
            prepend-icon="mdi-github"
            target="_blank"
            variant="elevated">
            Star us on GitHub
          </v-btn>
        </v-col>
      </v-row>

      <!-- Row 3: Quick Access Cards -->
      <v-row class="quick-access-row py-3">
        <v-col cols="12" sm="4">
          <v-card
            class="feature-card text-center"
            elevation="1"
            @click="$router.push('/warehouse')">
            <v-card-text class="pa-3">
              <v-icon color="primary" size="36">mdi-warehouse</v-icon>
              <div class="text-subtitle-1 font-weight-bold mt-2 mb-1">Warehouses</div>
              <div class="text-caption text-medium-emphasis">Manage data warehouses</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="feature-card text-center" elevation="1" @click="routeToRoles">
            <v-card-text class="pa-3">
              <v-icon color="success" size="36">mdi-shield-account</v-icon>
              <div class="text-subtitle-1 font-weight-bold mt-2 mb-1">Roles</div>
              <div class="text-caption text-medium-emphasis">Configure access control</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card
            class="feature-card text-center"
            elevation="1"
            href="https://docs.lakekeeper.io"
            target="_blank">
            <v-card-text class="pa-3">
              <v-icon color="info" size="36">mdi-book-open-page-variant</v-icon>
              <div class="text-subtitle-1 font-weight-bold mt-2 mb-1">Documentation</div>
              <div class="text-caption text-medium-emphasis">Learn how to use it</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Row 4: Quick Links -->
      <v-row class="links-row py-2">
        <v-col cols="12">
          <div class="quick-links-grid">
            <v-btn
              class="quick-link-btn"
              href="https://github.com/lakekeeper/lakekeeper"
              prepend-icon="mdi-github"
              size="small"
              target="_blank"
              variant="text">
              GitHub
            </v-btn>
            <v-btn
              class="quick-link-btn"
              href="https://discord.gg/jkAGG8p93B"
              prepend-icon="mdi-discord"
              size="small"
              target="_blank"
              variant="text">
              Discord
            </v-btn>
            <v-btn
              class="quick-link-btn"
              href="https://lakekeeper.io"
              prepend-icon="mdi-web"
              size="small"
              target="_blank"
              variant="text">
              Website
            </v-btn>
            <v-btn
              class="quick-link-btn"
              href="https://docs.lakekeeper.io/getting-started"
              prepend-icon="mdi-rocket-launch"
              size="small"
              target="_blank"
              variant="text">
              Getting Started
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
    <div v-else class="no-projects-wrapper">
      <v-container class="fill-height">
        <v-row class="fill-height" align="center" justify="center">
          <v-col cols="12" sm="10" md="8" lg="6">
            <div class="no-access-card">
              <!-- Animated Icon -->
              <div class="icon-container">
                <v-icon class="rotating-icon" size="100" color="primary">
                  mdi-lock-open-variant
                </v-icon>
              </div>

              <!-- Title -->
              <h1 class="text-h3 font-weight-bold mb-4 gradient-text">Access Pending</h1>

              <!-- Description -->
              <p class="text-h6 text-medium-emphasis mb-6">
                You don't have any project assignments yet
              </p>

              <!-- User ID Section -->
              <div class="user-id-section mb-8">
                <p class="text-body-2 text-medium-emphasis mb-2">Your User ID:</p>
                <v-chip
                  class="user-id-chip"
                  size="large"
                  variant="outlined"
                  @click="functions.copyToClipboard(user.id)">
                  <v-icon start>mdi-account</v-icon>
                  {{ user.id || 'Loading...' }}
                  <v-icon end>mdi-content-copy</v-icon>
                </v-chip>
                <p class="text-caption text-medium-emphasis mt-2">
                  Click to copy • Share with your administrator
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <v-btn
                  class="mb-3"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  size="large"
                  variant="elevated"
                  @click="checkAccessStatus">
                  Check Status
                </v-btn>

                <v-btn
                  class="mb-3"
                  color="secondary"
                  href="https://docs.lakekeeper.io"
                  prepend-icon="mdi-book-open-variant"
                  size="large"
                  target="_blank"
                  variant="tonal">
                  View Documentation
                </v-btn>

                <v-btn
                  class="text-medium-emphasis"
                  prepend-icon="mdi-logout"
                  size="large"
                  variant="text"
                  @click="logout">
                  Logout
                </v-btn>
              </div>

              <!-- Mini Game Section -->
              <v-divider class="my-8"></v-divider>

              <div class="game-section mb-6">
                <div class="d-flex align-center justify-center mb-3">
                  <v-icon size="small" class="mr-2">mdi-gamepad-variant</v-icon>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    While you wait... Play Tic-Tac-Toe!
                  </p>
                </div>
                <p class="text-caption text-medium-emphasis mb-4">You are ❌ • Computer is 🔵</p>

                <div class="tictactoe-container">
                  <div class="game-status mb-4">
                    <span v-if="!gameOver">
                      {{ currentPlayer === 'X' ? 'Your turn!' : 'Computer thinking...' }}
                    </span>
                    <span v-else-if="winner === 'draw'">It's a draw!</span>
                    <span v-else-if="winner === 'X'">🎉 You won!</span>
                    <span v-else>Computer won!</span>
                  </div>

                  <div class="tictactoe-board">
                    <div
                      v-for="(cell, index) in board"
                      :key="index"
                      class="tictactoe-cell"
                      :class="{
                        'cell-x': cell === 'X',
                        'cell-o': cell === 'O',
                        disabled: cell !== '' || gameOver || currentPlayer === 'O',
                      }"
                      @click="makeMove(index)">
                      <span v-if="cell === 'X'" class="cell-mark cell-mark-x">❌</span>
                      <span v-if="cell === 'O'" class="cell-mark cell-mark-o">🔵</span>
                    </div>
                  </div>

                  <v-btn
                    class="mt-4"
                    color="primary"
                    size="small"
                    variant="outlined"
                    @click="resetGame">
                    New Game
                  </v-btn>
                </div>
              </div>

              <!-- Help Section -->
              <v-divider class="my-8"></v-divider>

              <div class="help-section">
                <p class="text-body-2 text-medium-emphasis mb-3">
                  <v-icon size="small" class="mr-1">mdi-information</v-icon>
                  Need help getting started?
                </p>
                <div class="help-links">
                  <v-btn
                    href="https://discord.gg/jkAGG8p93B"
                    prepend-icon="mdi-discord"
                    size="small"
                    target="_blank"
                    variant="text">
                    Join Discord
                  </v-btn>
                  <v-btn
                    href="https://github.com/lakekeeper/lakekeeper/issues"
                    prepend-icon="mdi-bug"
                    size="small"
                    target="_blank"
                    variant="text">
                    Report Issue
                  </v-btn>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFunctions, useUserStore, useVisualStore } from '@lakekeeper/console-components';
import { inject, onMounted, onUnmounted, reactive, ref } from 'vue';
import * as env from '@/app.config';

import router from '@/router';
import { Type } from '@lakekeeper/console-components';

const auth = inject<any>('auth', null);
const assignedToProjects = ref(false);
const functions = useFunctions();

const userStorage = useUserStore();
const visual = useVisualStore();

const user = reactive({
  'created-at': '',
  id: '',
  'last-updated-with': 'create-endpoint',
  name: '',
  'user-type': 'human',
});

const starCount = ref(0);
const forksCount = ref(0);
const version = ref('0');
const loading = ref(true);

// Tic-Tac-Toe Game state
const board = ref<string[]>(Array(9).fill(''));
const currentPlayer = ref<'X' | 'O'>('X');
const gameOver = ref(false);
const winner = ref<'X' | 'O' | 'draw' | null>(null);

const checkWinner = (): 'X' | 'O' | 'draw' | null => {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board.value[a] && board.value[a] === board.value[b] && board.value[a] === board.value[c]) {
      return board.value[a] as 'X' | 'O';
    }
  }

  if (board.value.every((cell) => cell !== '')) {
    return 'draw';
  }

  return null;
};

const makeMove = (index: number) => {
  if (board.value[index] !== '' || gameOver.value || currentPlayer.value === 'O') {
    return;
  }

  // Player move
  board.value[index] = 'X';

  const result = checkWinner();
  if (result) {
    gameOver.value = true;
    winner.value = result;
    return;
  }

  // Computer's turn
  currentPlayer.value = 'O';

  setTimeout(() => {
    computerMove();
  }, 500);
};

const computerMove = () => {
  const emptyIndices = board.value
    .map((cell, index) => (cell === '' ? index : -1))
    .filter((index) => index !== -1);

  if (emptyIndices.length === 0) return;

  // Simple AI: Try to win, block player, or pick random
  let moveIndex = -1;

  // Try to win
  for (const index of emptyIndices) {
    board.value[index] = 'O';
    if (checkWinner() === 'O') {
      moveIndex = index;
      board.value[index] = '';
      break;
    }
    board.value[index] = '';
  }

  // Try to block
  if (moveIndex === -1) {
    for (const index of emptyIndices) {
      board.value[index] = 'X';
      if (checkWinner() === 'X') {
        moveIndex = index;
        board.value[index] = '';
        break;
      }
      board.value[index] = '';
    }
  }

  // Pick random or center
  if (moveIndex === -1) {
    if (emptyIndices.includes(4)) {
      moveIndex = 4; // Center
    } else {
      moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
  }

  board.value[moveIndex] = 'O';

  const result = checkWinner();
  if (result) {
    gameOver.value = true;
    winner.value = result;
  } else {
    currentPlayer.value = 'X';
  }
};

const resetGame = () => {
  board.value = Array(9).fill('');
  currentPlayer.value = 'X';
  gameOver.value = false;
  winner.value = null;
};

onMounted(async () => {
  fetchGitHub();
  await checkAccessStatus();

  loading.value = false;
});

onUnmounted(() => {
  loading.value = true;
});

const logout = () => {
  userStorage.isAuthenticated = false;
  userStorage.unsetUser();
  visual.projectSelected['project-id'] = '';
  visual.projectSelected['project-name'] = 'None';
  if (auth) {
    auth.signOut();
  }
  router.push('/login');
};

async function fetchGitHub() {
  try {
    const response = await fetch('https://api.github.com/repos/lakekeeper/lakekeeper');
    const data = await response.json();
    starCount.value = data.stargazers_count;
    forksCount.value = data.forks_count;

    const res = await fetch('https://api.github.com/repos/lakekeeper/lakekeeper/tags');

    type Release = {
      name: string;
    };

    const releases: Release[] = await res.json();

    const getHighestVersion = (haystack: Release[]): string => {
      const validReleases = haystack
        .map((release) => release.name)
        .filter((name) => /^v\d+\.\d+\.\d+$/.test(name)) // Exclude pre-release versions like "-rc"
        .sort((a, b) => {
          const versionA = a.slice(1).split('.').map(Number); // Convert version numbers to arrays of numbers
          const versionB = b.slice(1).split('.').map(Number);
          for (let i = 0; i < versionA.length; i++) {
            if (versionA[i] > versionB[i]) return -1;
            if (versionA[i] < versionB[i]) return 1;
          }
          return 0;
        });

      return validReleases[0]; // Always returns the highest version as a string
    };

    version.value = getHighestVersion(releases);
  } catch (error) {
    console.error('Error fetching GitHub star count:', error);
  }
}

async function checkAccessStatus() {
  try {
    const data = await functions.loadProjectList();

    if (data.length === 0) {
      visual.showAppOrNavBar = false;
      assignedToProjects.value = false;
      if ((await functions.getServerInfo()).bootstrapped)
        visual.setSnackbarMsg({
          function: 'List Project',
          text: 'No projects assigned. Ask your administrator',
          ttl: 5000,
          ts: Date.now(),
          type: Type.INFO,
        });
      Object.assign(user, await functions.whoAmI());
    } else {
      assignedToProjects.value = true;
      visual.showAppOrNavBar = true;
      router.push('/');
    }
  } catch (error) {
    console.error(error);
  }
}

function routeToRoles() {
  if (env.enabledAuthentication && env.enabledPermissions) {
    router.push('/roles');
  } else {
    visual.setSnackbarMsg({
      function: 'routeToRoles',
      text: 'Authorization is disabled',
      ttl: 3000,
      ts: Date.now(),
      type: Type.INFO,
    });
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
  max-height: 100vh;
  overflow: hidden;
}

.hero-section {
  padding: 20px 0 30px;
}

.logo-fade-in {
  animation: fadeIn 0.8s ease-in;
}

.subtitle-fade-in {
  animation: fadeIn 1s ease-in 0.2s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-row {
  animation: fadeIn 1.2s ease-in 0.4s both;
}

.stat-chip {
  background: rgb(var(--v-theme-surface-variant));
  font-weight: 500;
}

.cta-buttons {
  animation: fadeIn 1.4s ease-in 0.6s both;
}

.github-btn {
  background-color: white !important;
  color: black !important;
}

.github-btn:hover {
  background-color: #f0f0f0 !important;
}

.quick-access-section {
  margin-bottom: 20px;
}

.feature-cards {
  padding: 0 20px;
}

.feature-card {
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 16px !important;
  padding: 20px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: rgb(var(--v-theme-surface));
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: rgb(var(--v-theme-primary));
}

.card-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.card-icon-wrapper.primary {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-primary-darken-1)) 100%
  );
  color: white;
}

.card-icon-wrapper.success {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-success)) 0%,
    rgb(var(--v-theme-success-darken-1)) 100%
  );
  color: white;
}

.card-icon-wrapper.info {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-info)) 0%,
    rgb(var(--v-theme-info-darken-1)) 100%
  );
  color: white;
}

.v-card-title {
  text-align: center;
}

.v-card-text {
  text-align: center;
  min-height: 60px;
}

.quick-links-section {
  border-top: 1px solid rgb(var(--v-theme-surface-variant));
  padding-top: 20px;
  margin-top: 20px;
}

.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  max-width: 900px;
  margin: 0 auto;
}

.quick-link-btn {
  justify-content: flex-start;
  text-transform: none;
  font-size: 0.875rem;
}

.quick-link-btn:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.no-projects-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-secondary), 0.02) 100%
  );
}

.no-access-card {
  text-align: center;
  padding: 60px 40px;
  border-radius: 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-container {
  margin-bottom: 32px;
  animation: fadeInScale 0.8s ease-out 0.2s both;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.rotating-icon {
  animation: gentleRotate 3s ease-in-out infinite;
}

@keyframes gentleRotate {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(10deg);
  }
}

.gradient-text {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeIn 1s ease-out 0.4s both;
}

.user-id-section {
  animation: fadeIn 1.2s ease-out 0.6s both;
}

.user-id-chip {
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: monospace;
  font-size: 0.95rem;
  padding: 24px 20px;
}

.user-id-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
  animation: fadeIn 1.4s ease-out 0.8s both;
}

.help-section {
  animation: fadeIn 1.6s ease-out 1s both;
}

.help-links {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Mini Game Styles */
.game-section {
  animation: fadeIn 1.8s ease-out 1.2s both;
}

.tictactoe-container {
  max-width: 350px;
  margin: 0 auto;
}

.game-status {
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  min-height: 30px;
  color: rgb(var(--v-theme-primary));
}

.tictactoe-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 16px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  max-width: 320px;
  margin: 0 auto;
}

.tictactoe-cell {
  aspect-ratio: 1;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 3rem;
  border: 2px solid transparent;
  position: relative;
}

.tictactoe-cell:hover:not(.disabled) {
  background: rgb(var(--v-theme-primary), 0.1);
  transform: scale(1.05);
  border-color: rgb(var(--v-theme-primary));
}

.tictactoe-cell.disabled {
  cursor: not-allowed;
}

.cell-mark {
  animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.cell-mark-o {
  filter: drop-shadow(0 2px 4px rgba(33, 150, 243, 0.4));
}

.cell-mark-x {
  filter: drop-shadow(0 2px 4px rgba(244, 67, 54, 0.4));
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .no-access-card {
    padding: 40px 24px;
  }

  .text-h3 {
    font-size: 2rem !important;
  }

  .icon-container .rotating-icon {
    font-size: 80px !important;
  }

  .tictactoe-board {
    max-width: 280px;
    gap: 6px;
    padding: 12px;
  }

  .tictactoe-cell {
    font-size: 2.5rem;
  }
}

@media (max-width: 960px) {
  .home-container {
    padding: 40px 16px;
  }

  .hero-section {
    padding: 20px 0 40px;
  }

  .feature-cards {
    padding: 0;
  }

  .quick-links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
