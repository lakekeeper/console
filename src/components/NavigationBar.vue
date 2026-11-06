<template>
  <v-navigation-drawer :rail="!visual.navBarShow" permanent>
    <v-list nav density="compact" color="primary" class="pa-2">
      <v-list-subheader v-show="visual.navBarShow" class="text-uppercase font-weight-bold">
        Navigation
      </v-list-subheader>
      <v-list-item link title="Home" to="/" :exact="true" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Home
          </v-tooltip>
          <v-icon :size="iconSize" icon="mdi-home-circle"></v-icon>
        </template>
      </v-list-item>
      <NavFlyout
        title="Warehouses"
        icon="mdi-database"
        :icon-size="iconSize"
        to="/warehouse"
        @open="loadWarehouseNames">
        <v-list-item
          title="All warehouses"
          prepend-icon="mdi-format-list-bulleted"
          to="/warehouse"
          :exact="true"
          rounded="lg"></v-list-item>
        <v-list-item
          v-if="currentObject"
          :title="`${currentPinned ? 'Unpin' : 'Pin'} this ${currentObject.type.replace('-', ' ')}`"
          :prepend-icon="currentPinned ? 'mdi-pin-off-outline' : 'mdi-pin-outline'"
          :disabled="!currentPinTarget"
          rounded="lg"
          @click="toggleCurrentPin"></v-list-item>
        <!-- Both lists scroll on their own past a handful of rows rather than
             running the menu off-screen. -->
        <template v-if="recent.length">
          <v-divider class="my-1"></v-divider>
          <v-list-subheader class="text-uppercase font-weight-bold">Recent</v-list-subheader>
          <div class="nav-object-list">
            <v-list-item
              v-for="o in recent.slice(0, RECENT_SHOWN)"
              :key="navKey(o)"
              :title="titleOf(o)"
              :subtitle="subtitleOf(o)"
              :prepend-icon="NAV_ICONS[o.type]"
              :to="isGone(o) ? undefined : navRoute(o)"
              :disabled="isGone(o)"
              rounded="lg"></v-list-item>
          </div>
        </template>
        <v-divider class="my-1"></v-divider>
        <v-list-subheader class="text-uppercase font-weight-bold">Pinned</v-list-subheader>
        <div class="nav-object-list">
          <v-list-item
            v-for="o in pins"
            :key="navKey(o)"
            :title="titleOf(o)"
            :subtitle="subtitleOf(o)"
            :prepend-icon="NAV_ICONS[o.type]"
            :to="isGone(o) ? undefined : navRoute(o)"
            :class="['nav-pin-row', { 'text-disabled': isGone(o) }]"
            rounded="lg">
            <template #append>
              <v-btn
                icon="mdi-pin-off-outline"
                size="x-small"
                variant="text"
                :class="{ 'nav-unpin': !isGone(o) }"
                :aria-label="`Unpin ${titleOf(o)}`"
                @click.prevent.stop="unpin(o)"></v-btn>
            </template>
          </v-list-item>
        </div>
        <v-list-item v-if="!pins.length" disabled>
          <v-list-item-subtitle>Pin an object to list it here.</v-list-item-subtitle>
        </v-list-item>
      </NavFlyout>
      <v-divider class="my-2"></v-divider>

      <v-list-subheader v-show="visual.navBarShow" class="text-uppercase font-weight-bold">
        Tools
      </v-list-subheader>
      <NavFlyout
        title="LoQE"
        icon="mdi-console"
        :icon-size="iconSize"
        to="/loqe"
        @open="loadWarehouseNames">
        <template #append>
          <v-chip v-show="visual.navBarShow" size="x-small" color="info" variant="tonal">
            Beta
          </v-chip>
        </template>
        <v-list-item
          title="Run SQL"
          prepend-icon="mdi-play-circle-outline"
          to="/loqe"
          rounded="lg"></v-list-item>
        <v-divider class="my-1"></v-divider>
        <v-list-subheader class="text-uppercase font-weight-bold">Query pinned</v-list-subheader>
        <template v-if="queryablePins.length">
          <div class="nav-object-list">
            <v-list-item
              v-for="o in queryablePins"
              :key="navKey(o)"
              :title="titleOf(o)"
              :subtitle="subtitleOf(o)"
              :prepend-icon="NAV_ICONS[o.type]"
              :disabled="isGone(o)"
              rounded="lg"
              @click="queryInLoqe(o)"></v-list-item>
          </div>
        </template>
        <v-list-item v-else disabled>
          <v-list-item-subtitle>Pin a table or view to query it here.</v-list-item-subtitle>
        </v-list-item>
      </NavFlyout>

      <v-divider class="my-2"></v-divider>

      <v-list-subheader v-show="visual.navBarShow" class="text-uppercase font-weight-bold">
        System
      </v-list-subheader>
      <NavFlyout
        title="Identities"
        icon="mdi-account-multiple"
        :icon-size="iconSize"
        :active="isIdentitiesActive"
        @click="routeToIdentities()"
        @open="checkUsersRight">
        <v-list-item v-if="usersRightServerId && !usersAnswered" disabled>
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </v-list-item>
        <v-list-item
          v-for="t in identityTabs"
          :key="t.value"
          :title="t.title"
          :prepend-icon="t.icon"
          :active="isIdentitiesActive && currentTab === t.value"
          rounded="lg"
          @click="routeToIdentities(t.value)"></v-list-item>
      </NavFlyout>
      <NavFlyout
        title="Governance"
        icon="mdi-shield-check-outline"
        :icon-size="iconSize"
        to="/governance">
        <v-list-item
          v-for="t in governanceTabs"
          :key="t.value"
          :title="t.title"
          :prepend-icon="t.icon"
          :to="{ path: '/governance', query: { tab: t.value } }"
          :active="route.path === '/governance' && currentTab === t.value"
          rounded="lg">
          <template v-if="t.plus" #append>
            <v-chip size="x-small" color="primary" variant="tonal">PLUS</v-chip>
          </template>
        </v-list-item>
      </NavFlyout>
      <v-list-item link title="Maintenance" to="/maintenance" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Maintenance
          </v-tooltip>
          <v-icon :size="iconSize" icon="mdi-wrench-clock"></v-icon>
        </template>
        <template #append>
          <v-chip v-show="visual.navBarShow" size="x-small" color="primary" variant="tonal">
            PLUS
          </v-chip>
        </template>
      </v-list-item>
      <NavFlyout
        title="Projects"
        icon="mdi-home-silo"
        :icon-size="iconSize"
        to="/projects"
        @open="loadProjects">
        <v-list-item v-if="projectsLoading && !visual.projectList.length" disabled>
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </v-list-item>
        <v-list-item
          v-for="p in visual.projectList"
          :key="p['project-id']"
          :title="p['project-name']"
          prepend-icon="mdi-swap-horizontal"
          :active="p['project-id'] === visual.projectSelected['project-id']"
          rounded="lg"
          @click="switchProject(p)"></v-list-item>
        <v-divider v-if="visual.projectList.length" class="my-1"></v-divider>
        <v-list-item
          title="Manage projects"
          prepend-icon="mdi-cog-outline"
          to="/projects"
          :exact="true"
          rounded="lg"></v-list-item>
      </NavFlyout>
      <NavFlyout title="Server settings" icon="mdi-cog" :icon-size="iconSize" to="/server-settings">
        <v-list-item
          v-for="t in serverSettingsTabs"
          :key="t.value"
          :title="t.title"
          :prepend-icon="t.icon"
          :to="{ path: '/server-settings', query: { tab: t.value } }"
          :active="route.path === '/server-settings' && currentTab === t.value"
          rounded="lg"></v-list-item>
      </NavFlyout>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Type,
  useFunctions,
  useGrantsSupported,
  useServerPermissions,
  useVisualStore,
  PERMISSIONS_UI_ENABLED,
} from '@lakekeeper/console-components';
import NavFlyout from '@/components/NavFlyout.vue';
import { useNavObjects, navKey, navRoute, NAV_ICONS } from '@/composables/useNavObjects';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

const visual = useVisualStore();
const functions = useFunctions();
type Project = (typeof visual.projectList)[number];
const router = useRouter();
const route = useRoute();
// Collapsed to the rail, the icon is the only thing left to aim at, so it steps
// up one Vuetify size rather than carrying a hand-tuned pixel override.
const iconSize = computed(() => (visual.navBarShow ? 'x-small' : 'small'));

const isIdentitiesActive = computed(
  () => route.path.startsWith('/identities') || route.path.startsWith('/roles'),
);

const currentTab = computed(() => route.query.tab as string | undefined);

// Same gates the Governance page applies to its own tabs, so the flyout never
// offers a tab the page would not render. Policies always shows: the page
// markets it as a Lakekeeper+ feature.
const showPermissionsTab = computed(
  () => PERMISSIONS_UI_ENABLED && visual.getServerInfo()['authz-backend'] === 'openfga',
);
const showGrantsTab = useGrantsSupported();

type FlyoutTab = { value: string; title: string; icon: string; plus?: boolean };

const governanceTabs = computed(
  () =>
    [
      { value: 'tags', title: 'Tags', icon: 'mdi-tag-multiple-outline' },
      showPermissionsTab.value && {
        value: 'permissions',
        title: 'Permissions',
        icon: 'mdi-lock-outline',
      },
      showGrantsTab.value === true && { value: 'grants', title: 'Grants', icon: 'mdi-key-outline' },
      { value: 'policies', title: 'Policies', icon: 'mdi-script-text-outline', plus: true },
    ].filter(Boolean) as FlyoutTab[],
);

const serverSettingsTabs = computed(
  () =>
    [
      { value: 'overview', title: 'Overview', icon: 'mdi-information-outline' },
      showPermissionsTab.value && {
        value: 'permissions',
        title: 'Permissions',
        icon: 'mdi-lock-outline',
      },
      showGrantsTab.value === true && { value: 'grants', title: 'Grants', icon: 'mdi-key-outline' },
    ].filter(Boolean) as FlyoutTab[],
);

// Pins are per browser, shared with the warehouse and LoQE trees.
const RECENT_SHOWN = 5;
const {
  currentObject,
  currentPinTarget,
  currentPinned,
  toggleCurrentPin,
  pins,
  recent,
  unpin,
  isGone,
  titleOf,
  subtitleOf,
  loadWarehouseNames,
  queryablePins,
  queryInLoqe,
} = useNavObjects();

// Projects are read when the menu opens, not on mount: the drawer also renders
// on login and bootstrap, where asking costs a 401. Errors surface through the
// shared handler; the menu just keeps its "Manage projects" link.
const projectsLoading = ref(false);
async function loadProjects() {
  if (projectsLoading.value) return;
  projectsLoading.value = true;
  try {
    await functions.loadProjectList();
  } catch {
    // Refused or offline: the menu still offers "Manage projects".
  } finally {
    projectsLoading.value = false;
  }
}

// Same as the app bar's switcher: home, not wherever we were, since a warehouse
// or table route names an object in the project being left.
function switchProject(project: Project) {
  if (project['project-id'] === visual.projectSelected['project-id']) return;
  visual.setProjectSelected(project);
  router.push('/');
}

// Users is offered only to who may list users, the same check the page makes.
// Asked when the menu first opens, not on mount: the drawer also renders before
// login. Until the answer lands the menu shows progress rather than a Users
// entry it may have to take back.
const usersRightServerId = ref('');
const { showUsersTab, answered: usersAnswered } = useServerPermissions(usersRightServerId);
function checkUsersRight() {
  if (!usersRightServerId.value) {
    usersRightServerId.value = visual.getServerInfo()['server-id'] || '';
  }
}
const identityTabs = computed(
  () =>
    [
      showUsersTab.value && { value: 'users', title: 'Users', icon: 'mdi-account-outline' },
      { value: 'roles', title: 'Roles', icon: 'mdi-account-group-outline' },
    ].filter(Boolean) as FlyoutTab[],
);

function routeToIdentities(tab?: string) {
  if (enabledAuthentication && enabledPermissions) {
    router.push({ path: '/identities', query: tab ? { tab } : {} });
  } else {
    visual.setSnackbarMsg({
      function: 'routeToRoles',
      text: 'Identity & role management is disabled because fine-grained permissions are not enabled for this deployment.',
      ttl: 5000,
      ts: Date.now(),
      type: Type.INFO,
    });
  }
}
</script>

<style scoped>
.nav-object-list {
  max-height: 280px;
  overflow-y: auto;
}
/* Where a pointer can hover, unpin shows on the row being pointed at or focused,
   so the list reads as links rather than a column of buttons. Touch screens and
   gone pins keep it visible. */
@media (hover: hover) {
  .nav-unpin {
    opacity: 0;
  }
  .nav-pin-row:hover .nav-unpin,
  .nav-pin-row:focus-within .nav-unpin,
  .nav-unpin:focus-visible {
    opacity: 1;
  }
}
</style>
