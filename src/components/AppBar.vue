<template>
  <v-app-bar :elevation="2">
    <template v-slot:prepend>
      <v-app-bar-nav-icon :icon="navIcon" @click="navBar"></v-app-bar-nav-icon>
    </template>

    <v-app-bar-title>Lakekeeper</v-app-bar-title>
    <v-list-item>
      <ProjectManager />
    </v-list-item>
    <v-spacer></v-spacer>

    <v-menu open-on-hover v-if="userStorage.isAuthenticated">
      <template #activator="{ props }">
        <v-btn v-bind="props"> <v-icon>mdi-account</v-icon> </v-btn>
      </template>
      <v-list>
        <v-list-item>
          <v-list-item-title>
            {{ userStorage.user.given_name }}
            {{ userStorage.user.family_name }}
            <v-btn
              @click="toggleTheme"
              size="x-small"
              :icon="themeLight ? 'mdi-lightbulb-off' : 'mdi-lightbulb-on'"
              variant="text"
            ></v-btn>
          </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="goToUserProfile">
          <v-list-item-title>User Profile</v-list-item-title>
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

    <v-menu open-on-hover v-if="!enabledAuthorization">
      <template #activator="{ props }">
        <v-btn v-bind="props"> <v-icon>mdi-account</v-icon> </v-btn>
      </template>
      <v-list>
        <v-list-item>
          <v-list-item-title>
            {{ userStorage.user.given_name }}
            {{ userStorage.user.family_name }}
            <v-btn
              @click="toggleTheme"
              size="x-small"
              :icon="themeLight ? 'mdi-lightbulb-off' : 'mdi-lightbulb-on'"
              variant="text"
            ></v-btn>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useTheme } from "vuetify";
import { useAuth } from "../plugins/auth";
import { useVisualStore } from "../stores/visual";
import { enabledAuthorization } from "../app.config";
import { useUserStore } from "../stores/user";

const router = useRouter();
const visual = useVisualStore();

const userStorage = useUserStore();

const theme = useTheme();
const themeLight = computed(() => {
  return visual.themeLight;
});

const themeText = computed(() => {
  return themeLight.value ? "light" : "dark";
});

const navIcon = computed(() => {
  return visual.navBarShow ? "mdi-menu-open" : "mdi-menu";
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
  router.push("/user-profile");
}
</script>
