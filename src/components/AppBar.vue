<template>
  <v-app-bar :elevation="2">
    <template #prepend>
      <v-app-bar-nav-icon :icon="navIcon" @click="navBar"></v-app-bar-nav-icon>
    </template>

    <v-app-bar-title>Lakekeeper</v-app-bar-title>
    <v-list-item>
      <ProjectManager />
    </v-list-item>
    <v-spacer></v-spacer>

    <v-menu v-if="userStorage.isAuthenticated" open-on-hover>
      <template #activator="{ props }">
        <v-btn v-bind="props"><v-icon>mdi-account</v-icon></v-btn>
      </template>
      <v-list>
        <v-list-item prepend-icon="mdi-account">
          <v-list-item-title>
            {{ userStorage.user.given_name }}
            {{ userStorage.user.family_name }}
            <v-btn
              :icon="themeLight ? 'mdi-lightbulb-off' : 'mdi-lightbulb-on'"
              size="x-small"
              variant="text"
              @click="toggleTheme"></v-btn>
          </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item prepend-icon="mdi-account-circle-outline" @click="goToUserProfile">
          <v-list-item-title>User Profile</v-list-item-title>
        </v-list-item>
        <v-list-item prepend-icon="mdi-key-change" @click="getNewToken">
          <v-list-item-title>Create Token</v-list-item-title>
        </v-list-item>

        <v-divider class="mt-2"></v-divider>

        <v-list-item @click="logout">
          <template #prepend>
            <v-icon icon="mdi-logout"></v-icon>
          </template>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu v-if="!enabledAuthorization" open-on-hover>
      <template #activator="{ props }">
        <v-btn v-bind="props"><v-icon>mdi-account</v-icon></v-btn>
      </template>
      <v-list>
        <v-list-item>
          <v-list-item-title>
            {{ userStorage.user.given_name }}
            {{ userStorage.user.family_name }}
            <v-btn
              :icon="themeLight ? 'mdi-lightbulb-off' : 'mdi-lightbulb-on'"
              size="x-small"
              variant="text"
              @click="toggleTheme"></v-btn>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { User } from '@/common/interfaces';
import { computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useAuth } from '../plugins/auth';
import { useVisualStore } from '../stores/visual';
import { enabledAuthorization } from '../app.config';
import { useUserStore } from '../stores/user';
import { useFunctions } from '@/plugins/functions';

import { useRouter } from 'vue-router';

const router = useRouter();
const visual = useVisualStore();
const functions = useFunctions();

const userStorage = useUserStore();

const theme = useTheme();
const themeLight = computed(() => {
  return visual.themeLight;
});

const themeText = computed(() => {
  return themeLight.value ? 'light' : 'dark';
});

const navIcon = computed(() => {
  return visual.navBarShow ? 'mdi-menu-open' : 'mdi-menu';
});

onMounted(async () => {
  theme.global.name.value = themeText.value;
});

function toggleTheme() {
  visual.toggleThemeLight();
  theme.global.name.value = themeText.value;
}

function navBar() {
  visual.navBarSwitch();
}

function logout() {
  userStorage.unsetUser();
  useAuth().signOut();
}

function goToUserProfile() {
  router.push('/user-profile');
}

async function getNewToken() {
  const auth = useAuth();
  const user = (await auth.refreshToken()) as User;
  functions.copyToClipboard(user.access_token);
}
</script>
