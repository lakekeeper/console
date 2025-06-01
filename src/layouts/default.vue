<template>
  <v-app>
    <!--AppBar v-if="visual.showAppOrNavBar" /-->
    <AppBar
      v-if="visual.showAppOrNavBar"
      :title="appTitle"
      :nav-bar-show="navBarVisible"
      :theme-light="isLightTheme"
      :user="currentUser"
      :show-help="true"
      :show-create-token="true"
      :elevation="4"
      density="comfortable"
      button-size="small"
      :open-menu-on-hover="true"
      :custom-help-items="customHelpItems"
      :custom-user-items="customUserItems"
      @toggle-nav="handleNavToggle"
      @toggle-theme="handleThemeToggle"
      @logout="handleLogout"
      @go-to-user-profile="handleUserProfile"
      @go-to-documentation="handleDocumentation"
      @open-issue="handleOpenIssue"
      @go-to-support="handleSupport"
      @get-new-token="handleGetNewToken"
      @help-action="handleHelpAction"
      @user-action="handleUserAction">
      <!-- Project Manager slot injection -->
      <template #default>
        <ProjectManager />
      </template>
    </AppBar>
    <v-main>
      <AuthenticationDisabledWarningBanner
        v-if="!enabledAuthentication"></AuthenticationDisabledWarningBanner>
      <NavigationBar v-if="visual.showAppOrNavBar" />
      <router-view />
    </v-main>

    <AppFooter>
      <template #suffix>
        <span>Core</span>
      </template>
    </AppFooter>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';

import NavigationBar from '@/components/NavigationBar.vue';
import ProjectManager from '@/components/ProjectManager.vue';
import { enabledAuthentication } from '@/app.config';
import { useVisualStore } from '@/stores/visual';
import { useUserStore } from '@/stores/user';
import { useAuth } from '@/plugins/auth';
import { useFunctions } from '@/plugins/functions';
import {
  AppFooter,
  AppBar,
  AuthenticationDisabledWarningBanner,
} from '@lakekeeper/console-components';

const router = useRouter();
const theme = useTheme();
const visual = useVisualStore();
const userStore = useUserStore();
const auth = useAuth();
const functions = useFunctions();

// Computed properties for AppBar props
const appTitle = computed(() => 'Lakekeeper');
const navBarVisible = computed(() => visual.navBarShow);
const isLightTheme = computed(() => visual.themeLight);
const currentUser = computed(() => userStore.user);

// Custom menu items
const customHelpItems = ref([
  { action: 'docs', title: 'Documentation', icon: 'mdi-file-document-check-outline' },
  { action: 'issue', title: 'Create an Issue', icon: 'mdi-alert-circle-outline' },
  { action: 'support', title: 'Support', icon: 'mdi-face-agent' },
]);

const customUserItems = ref([
  { action: 'profile', title: 'User Profile', icon: 'mdi-account-circle-outline' },
]);

// Event handlers
function handleNavToggle() {
  visual.navBarSwitch();
}

function handleThemeToggle() {
  visual.toggleThemeLight();
  theme.global.name.value = visual.themeLight ? 'light' : 'dark';
}

function handleLogout() {
  userStore.unsetUser();
  visual.projectSelected['project-id'] = '';
  visual.projectSelected['project-name'] = 'None';
  auth.signOut();
  router.push('/login');
}

function handleUserProfile() {
  router.push('/user-profile');
}

function handleDocumentation() {
  window.open('https://docs.lakekeeper.io/docs/nightly/concepts/', '_blank');
}

function handleOpenIssue() {
  window.open('https://github.com/lakekeeper/lakekeeper/issues/new/choose', '_blank');
}

function handleSupport() {
  window.open('https://discord.com/invite/jkAGG8p93B', '_blank');
}

async function handleGetNewToken() {
  try {
    console.log('Requesting new token...');
    const user = await auth.refreshToken();
    if (user?.access_token) {
      functions.copyToClipboard(user.access_token);
    }
  } catch (error) {
    console.error('Failed to get new token:', error);
  }
}

function handleHelpAction(actionId: string) {
  switch (actionId) {
    case 'docs':
      handleDocumentation();
      break;
    case 'issue':
      handleOpenIssue();
      break;
    case 'support':
      handleSupport();
      break;
    default:
      console.warn('Unknown help action:', actionId);
  }
}

function handleUserAction(actionId: string) {
  switch (actionId) {
    case 'profile':
      handleUserProfile();
      break;
    default:
      console.warn('Unknown user action:', actionId);
  }
}
</script>
