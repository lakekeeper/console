<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>

      >
    </v-responsive>
  </v-container>
  <span v-else>
    <v-container v-if="assignedToProjects" class="fill-height">
      <v-responsive class="align-centerfill-height mx-auto">
        <div class="text-center">
          <v-img class="mb-4" height="100" src="@/assets/bear.png" />

          <div>
            <span class="text-h2 font-weight-bold">Lakekeeper</span>
          </div>
        </div>

        <div class="py-4"></div>

        <v-row class="d-flex align-center mb-4">
          <v-col>
            <div class="text-center mt-4">
              <v-btn height="60" href="https://github.com/lakekeeper/lakekeeper" target="_blank">
                <v-icon icon="mdi-github" size="40" />
                <div class="text-center text-none ml-2 mb-2">
                  <div class="text-h5">
                    Give us a
                    <v-icon color="yellow" icon="mdi-star" />
                  </div>
                  <div class="d-flex align-center" v-if="starCount > 0">
                    <v-icon icon="mdi-tag-outline" />
                    <span class="mr-2">{{ version }}</span>
                    <v-icon icon="mdi-star-outline" />
                    <span class="mr-2">{{ starCount }}</span>
                    <v-icon icon="mdi-source-fork" />
                    <span>{{ forksCount }}</span>
                  </div>
                </div>
              </v-btn>
            </div>
          </v-col>
          <v-col>
            <div class="text-center">
              <div class="text-h5">Join the community</div>
              <v-btn
                height="50"
                href="https://discord.gg/jkAGG8p93B"
                target="_blank"
                variant="flat">
                <img
                  alt="Discord"
                  data-canonical-src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&amp;logo=discord&amp;logoColor=white"
                  height="50"
                  src="https://camo.githubusercontent.com/404c37b96536f6a6f4740fe538fbbd1a05885008f18efd46c127a6964d3fb9fc/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f446973636f72642d2532333538363546322e7376673f7374796c653d666f722d7468652d6261646765266c6f676f3d646973636f7264266c6f676f436f6c6f723d7768697465"
                  style="max-width: 100%" />
              </v-btn>
            </div>
          </v-col>
        </v-row>
        <!-- QUICK ACCESS-->
        <v-row class="mt-16 mb-6">
          <v-col>
            <div class="text-center text-h5">QUICK ACCESS</div>
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-row class="mb-2 mt-2">
          <!-- Warehouses Card -->
          <v-col class="mx-auto">
            <v-card
              class="mx-auto hover-card"
              :elevation="hover ? 10 : 2"
              max-width="344"
              outlined
              @mouseleave="hover = false"
              @mouseover="hover = true">
              <v-list-item three-line>
                <div class="text-overline text-primary mb-2">Warehouses</div>
                <v-list-item-title class="text-h5 font-weight-bold">
                  Manage Warehouses
                </v-list-item-title>
                <v-list-item-subtitle>
                  Create and control your warehouses, tables, and access policies in one place.
                </v-list-item-subtitle>
              </v-list-item>
              <v-card-actions>
                <v-btn color="primary" outlined rounded to="/warehouse">Manage Warehouses</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Roles Card -->
          <v-col>
            <v-card
              class="mx-auto hover-card"
              :elevation="hoverRoles ? 10 : 2"
              max-width="344"
              outlined
              @mouseleave="hoverRoles = false"
              @mouseover="hoverRoles = true">
              <v-list-item three-line>
                <div class="text-overline text-success mb-2">Roles</div>
                <v-list-item-title class="text-h5 font-weight-bold">Manage Roles</v-list-item-title>
                <v-list-item-subtitle>
                  Define and control user roles to ensure secure data access across your platform.
                </v-list-item-subtitle>
              </v-list-item>
              <v-card-actions>
                <v-btn color="success" outlined rounded to="/roles">Manage Roles</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Documentation Card -->
          <v-col>
            <v-card
              class="mx-auto hover-card"
              :elevation="hoverDocs ? 10 : 2"
              max-width="344"
              outlined
              @mouseleave="hoverDocs = false"
              @mouseover="hoverDocs = true">
              <v-list-item three-line>
                <div class="text-overline text-info mb-2">Documentation</div>
                <v-list-item-title class="text-h5 font-weight-bold">
                  Explore Documentation
                </v-list-item-title>
                <v-list-item-subtitle>
                  Get step-by-step guidance and best practices for using Lakekeeper effectively.
                </v-list-item-subtitle>
              </v-list-item>
              <v-card-actions>
                <v-btn
                  color="info"
                  href="https://docs.lakekeeper.io"
                  outlined
                  rounded
                  target="_blank">
                  View Docs
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-responsive>
    </v-container>
    <v-container v-else class="fill-height d-flex justify-center align-center">
      <v-card class="pa-8 text-center" elevation="5" max-width="600">
        <v-card-title class="text-h5 font-weight-bold">
          You don't have any projects assignments
        </v-card-title>
        <v-card-subtitle>
          <div>Please talk to your administrator</div>
          <div>
            {{ user.id }}

            <v-btn
              :disabled="user.id == ''"
              icon="mdi-content-copy"
              size="small"
              variant="flat"
              @click="functions.copyToClipboard(user.id)"></v-btn>
          </div>
        </v-card-subtitle>
        <v-card-text>
          <v-btn block color="primary" large @click="checkAccessStatus">Check status</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="logout">Logout</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </span>
</template>

<script setup lang="ts">
import { useFunctions } from '@lakekeeper/console-components';
import { useUserStore } from '@/stores/user';
import { useVisualStore } from '@/stores/visual';
import { inject, onMounted, onUnmounted, reactive, ref } from 'vue';

import router from '@/router';
import { Type } from '@lakekeeper/console-components';
import { User } from '@/gen/management/types.gen';

const hover = ref(false);
const hoverRoles = ref(false);
const hoverDocs = ref(false);
const auth = inject<any>('auth', null);
const assignedToProjects = ref(false);
const functions = useFunctions();

const userStorage = useUserStore();
const visual = useVisualStore();

const user = reactive<User>({
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
      if (visual.getServerInfo().bootstrapped)
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
</script>

<style scoped>
.hover-card {
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
}

.hover-card:hover {
  box-shadow: 0px 6px 18px rgba(0, 0, 0, 0.2);
  transform: translateY(-5px);
}
</style>
