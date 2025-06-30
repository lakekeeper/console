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
        <ProjectManager
          :enabled-authentication="enabledAuthentication"
          :enabled-permissions="enabledPermissions"
          :access_token="currentUser?.access_token || ''"
          :is-authenticated="!!currentUser"
          :project="visual.projectSelected"
          :auth-method="enabledAuthentication ? 'authz' : 'allow-all'"
          :my-access="[]"
          :project-assignments="[]"
          :statistics="statistics"
          :available-projects="[]"
          @project-selected="handleProjectSelected"
          @project-created="handleProjectCreated"
          @project-updated="handleProjectUpdated"
          @project-deleted="handleProjectDeleted"
          @project-renamed="handleProjectRenamed"
          @assignments-updated="handleProjectAssignmentsUpdated"
          @project-list-refresh="handleProjectListRefresh"
          @project-access-changed="handleProjectAccessChanged"
          @statistics-requested="handleProjectStatisticsRequested"
          @assignment-update="handleAssignmentUpdate"
          @create-project="handleCreateProject"
          @delete-project="handleDeleteProject" />
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
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { useVisualStore } from '@/stores/visual';
import { useUserStore } from '@/stores/user';
import { useAuth } from '@/plugins/auth';
import { useFunctions } from '@/plugins/functions';
import {
  AppFooter,
  AppBar,
  AuthenticationDisabledWarningBanner,
  ProjectManager,
} from '@lakekeeper/console-components';
import { GetEndpointStatisticsResponse } from '@/gen/management';

const router = useRouter();
const theme = useTheme();
const visual = useVisualStore();
const userStore = useUserStore();
const auth = useAuth();
const functions = useFunctions();
const loadedStatistics = ref(true);
// Computed properties for AppBar props
const appTitle = computed(() => 'Lakekeeper');
const navBarVisible = computed(() => visual.navBarShow);
const isLightTheme = computed(() => visual.themeLight);
const currentUser = computed(() => userStore.user);

const statistics = reactive<GetEndpointStatisticsResponse>({
  'called-endpoints': [],
  'next-page-token': '',
  'previous-page-token': '',
  timestamps: [],
});

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

// Project Manager event handlers
async function handleProjectSelected(project: any) {
  try {
    visual.projectSelected = project;
    console.log('Project selected:', project);

    // Navigate to the appropriate page based on project selection
    if (project['project-id']) {
      router.push('/warehouse');
    }
  } catch (error) {
    console.error('Error selecting project:', error);
  }
}

async function handleProjectCreated(project: any) {
  try {
    console.log('Project created:', project);

    // Automatically select the newly created project
    visual.projectSelected = project;

    // Navigate to warehouse page for the new project
    router.push('/warehouse');
  } catch (error) {
    console.error('Error handling project creation:', error);
  }
}

async function handleProjectUpdated(renamedProject: any) {
  try {
    console.log('Project updated/renamed:', renamedProject);

    // Update the visual store if the renamed project is currently selected
    if (visual.projectSelected['project-id'] === renamedProject['project-id']) {
      visual.projectSelected = {
        'project-id': renamedProject['project-id'],
        'project-name': renamedProject['project-name'],
      };
    }

    // Refresh the current page if we're on a project-specific page
    const currentRoute = router.currentRoute.value;
    if (currentRoute.path.includes('/warehouse') || currentRoute.path.includes('/roles')) {
      router.go(0); // Refresh current route
    }
  } catch (error) {
    console.error('Error handling project update:', error);
  }
}

async function handleProjectDeleted(projectId: string) {
  try {
    console.log('Project deleted:', projectId);

    // If the deleted project was selected, reset selection
    if (visual.projectSelected['project-id'] === projectId) {
      visual.projectSelected = { 'project-id': '', 'project-name': 'None' };

      // Navigate to home page since the current project no longer exists
      router.push('/');
    }
  } catch (error) {
    console.error('Error handling project deletion:', error);
  }
}

async function handleProjectRenamed() {
  // Since the event doesn't provide project data, we can't pass it to handleProjectUpdated
  console.log('Project renamed event received');
}

async function handleProjectAssignmentsUpdated(assignments: any) {
  try {
    console.log('Project assignments updated:', assignments);
    // The assignments are handled internally by the ProjectManager component
    // This handler is mainly for logging and potential future use
  } catch (error) {
    console.error('Error handling assignment updates:', error);
  }
}

// Additional project-related emit handlers based on ProjectManager functionality
async function handleProjectListRefresh() {
  try {
    console.log('Project list refresh requested');
    // Force refresh of project list and update visual store
    const projects = await functions.loadProjectList();

    // Auto-select first project if none selected and projects available
    if (projects.length > 0 && !visual.projectSelected['project-id']) {
      visual.projectSelected = projects[0];
    }
  } catch (error) {
    console.error('Error refreshing project list:', error);
  }
}

async function handleProjectAccessChanged(access: any) {
  try {
    console.log('Project access changed:', access);
    // Handle project access changes - could trigger UI updates

    // If current user lost access to selected project, clear selection
    if (access && access.length === 0 && visual.projectSelected['project-id']) {
      visual.projectSelected = { 'project-id': '', 'project-name': 'None' };
      router.push('/');
    }
  } catch (error) {
    console.error('Error handling project access change:', error);
  }
}

async function handleProjectStatisticsRequested() {
  try {
    console.log('Project statistics requested');
    // Return endpoint statistics for the project
    return await functions.getEndpointStatistics({ type: 'all' });
  } catch (error) {
    console.error('Error getting project statistics:', error);
    return null;
  }
}

// Handler for assignment permission updates
async function handleAssignmentUpdate(assignmentData: any) {
  try {
    console.log('Assignment update requested:', assignmentData);

    const { deletes, writes } = assignmentData;
    await functions.updateProjectAssignments(deletes, writes);

    // Refresh project access after assignment changes
    if (enabledAuthentication) {
      await functions.getProjectAccess();
    }
  } catch (error) {
    console.error('Error updating project assignments:', error);
    throw error;
  }
}

// Handler for project creation
async function handleCreateProject(projectName: string) {
  try {
    console.log('Creating project:', projectName);

    const projectId = await functions.createProject(projectName);
    const newProject = {
      'project-id': projectId,
      'project-name': projectName,
    };

    // Auto-select the newly created project
    visual.projectSelected = newProject;

    // Refresh project list
    await functions.loadProjectList();

    // Navigate to warehouse page
    router.push('/warehouse');

    return newProject;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

// Handler for project deletion
async function handleDeleteProject(projectId: string) {
  try {
    console.log('Deleting project:', projectId);

    await functions.deleteProjectById(projectId);

    // If deleted project was selected, clear selection
    if (visual.projectSelected['project-id'] === projectId) {
      visual.projectSelected = { 'project-id': '', 'project-name': 'None' };
      router.push('/');
    }

    // Refresh project list
    await functions.loadProjectList();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

async function getEndpointStatistcs() {
  try {
    // Fetch statistics from the backend
    loadedStatistics.value = false;

    Object.assign(statistics, await functions.getEndpointStatistics({ type: 'all' }));

    loadedStatistics.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    loadedStatistics.value = true;
  }
}

onMounted(async () => {
  await getEndpointStatistcs();
});
</script>
