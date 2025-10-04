<template>
  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
    <template #activator="{ props: activatorProps }">
      <v-list-item-title
        v-bind="activatorProps"
        prepend-icon="mdi-home-silo"
        :text="project['project-name']">
        <div class="text-center pa-4">
          <v-btn prepend-icon="mdi-home-silo" :text="project['project-name']"></v-btn>
        </div>
      </v-list-item-title>
    </template>

    <v-card>
      <v-toolbar>
        <v-btn icon="mdi-close" @click="dialog = false"></v-btn>

        <v-toolbar-title>{{ project['project-name'] }}</v-toolbar-title>

        <v-spacer></v-spacer>
      </v-toolbar>

      <v-tabs v-model="tab">
        <v-tab value="overview" v-if="userStorage.isAuthenticated">overview</v-tab>
        <v-tab v-if="showPermissionsTab && userStorage.isAuthenticated" value="permissions">
          Permissions
        </v-tab>
        <v-tab value="statistics" @click="getEndpointStatistcs">Statistics</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview" v-if="userStorage.isAuthenticated">
          <v-list lines="two" subheader>
            <v-list-subheader>Selected Project</v-list-subheader>

            <v-list-item
              link
              :subtitle="`ID: ${project['project-id']}`"
              :title="`${project['project-name']}`"></v-list-item>

            <v-divider class="mt-8"></v-divider>
          </v-list>

          <v-data-table
            fixed-header
            :headers="headers"
            hover
            :items="availableProjects"
            :sort-by="[{ key: 'project-name', order: 'asc' }]">
            <template #top>
              <v-toolbar color="transparent" density="compact" flat>
                <v-toolbar-title class="text-subtitle-1">Available Projects</v-toolbar-title>
                <AddOrEditProjectNameDialog
                  v-if="canCreateProject"
                  :id="''"
                  :action-type="'add'"
                  :name="''"
                  @emit-project-create="addProject" />
              </v-toolbar>
            </template>

            <template #item.info="{ item }">
              <v-btn
                v-if="item.info === 'selected'"
                text="selected"
                color="blue"
                size="small"
                disabled
                variant="plain">
                selected
              </v-btn>
              <v-btn
                v-if="item.info === 'activate'"
                text="activate"
                color="blue"
                size="small"
                variant="flat"
                @click="activateProject(item)"></v-btn>
            </template>

            <template #item.actions="{ item }">
              <div class="d-inline-flex ga-2 align-center">
                <AddOrEditProjectNameDialog
                  :id="item['project-id']"
                  :action-type="'edit'"
                  :name="item['project-name']"
                  @emit-project-new-name="renameProject" />

                <DeleteConfirmDialog
                  v-if="item.actions?.includes('delete') && item.info !== 'selected'"
                  :type="'project'"
                  :name="item['project-name']"
                  @confirmed="deleteProject(item)"></DeleteConfirmDialog>
              </div>
            </template>

            <template #no-data>
              <div>No projects available</div>
            </template>
          </v-data-table>
        </v-tabs-window-item>
        <v-tabs-window-item
          v-if="showPermissionsTab && userStorage.isAuthenticated"
          value="permissions">
          <PermissionManager
            v-if="project['project-id']"
            :object-id="project['project-id']"
            :relation-type="permissionType" />
        </v-tabs-window-item>

        <v-tabs-window-item value="statistics">
          <ProjectStatistics v-if="loadedStatistics" :stats="statistics" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useVisualStore } from '../stores/visual';
import { useUserStore } from '../stores/user';
import { useFunctions } from '../plugins/functions';
import { useProjectPermissions, useServerPermissions } from '@lakekeeper/console-components';
import { usePermissionStore } from '@/stores/permissions';
import {
  CreateProjectRequest,
  GetEndpointStatisticsResponse,
  GetProjectResponse,
  ProjectAssignment,
  RenameProjectRequest,
} from '../gen/management/types.gen';
import { Header, RelationType } from '../common/interfaces';
import router from '@/router';

const dialog = ref(false);
const tab = ref('overview');
const userStorage = useUserStore();

const visual = useVisualStore();
const functions = useFunctions();

const permissionType = RelationType.Project;

const project = computed(() => visual.projectSelected);
const projectId = computed(() => project.value['project-id']);
const serverId = computed(() => visual.getServerInfo()['server-id']);

// Use composables for permissions
const { canReadAssignments, showPermissionsTab } = useProjectPermissions(projectId);
const { canCreateProject } = useServerPermissions(serverId);
const projectAssignments = reactive<ProjectAssignment[]>([]);
const existingAssignments = reactive<ProjectAssignment[]>([]);
const loaded = ref(true);
const loadedStatistics = ref(true);
const assignments = reactive<
  { id: string; name: string; email: string; type: string; kind: string }[]
>([]);

const statistics = reactive<GetEndpointStatisticsResponse>({
  'called-endpoints': [],
  'next-page-token': '',
  'previous-page-token': '',
  timestamps: [],
});

const headers: readonly Header[] = Object.freeze([
  { title: 'Info', key: 'info', align: 'start' },
  { title: 'Name', key: 'project-name', align: 'start' },
  { title: 'ID', key: 'project-id', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'start', sortable: false },
]);

const availableProjects = reactive<(GetProjectResponse & { actions: string[]; info: string })[]>(
  [],
);

async function init() {
  try {
    loaded.value = false;

    await loadProjects();

    projectAssignments.splice(0, projectAssignments.length);
    Object.assign(
      projectAssignments,
      canReadAssignments.value ? await functions.getProjectAssignments() : [],
    );
    existingAssignments.splice(0, existingAssignments.length);
    Object.assign(existingAssignments, projectAssignments);

    for (const assignment of projectAssignments) {
      const searchUser: any = assignment;

      if (searchUser.user) {
        const user = await functions.getUser(searchUser.user);

        if (user) {
          assignments.push({
            id: user.id,
            name: user.name,
            email: user.email ?? '',
            type: assignment.type,
            kind: 'user',
          });
        }
      } else {
        const role = await functions.getRole(searchUser.role);
        if (role) {
          assignments.push({
            id: role.id,
            name: role.name,
            email: '',
            type: assignment.type,
            kind: 'role',
          });
        }
      }
    }
    loaded.value = true;
  } catch (error: any) {
    console.error(error);
  }
}

async function getEndpointStatistcs() {
  try {
    // Fetch statistics from the backend
    loadedStatistics.value = false;

    if (visual.getServerInfo()['authz-backend'] === 'allow-all') {
      Object.assign(statistics, await functions.getEndpointStatistics({ type: 'all' }));
    } else {
      if (userStorage.getUser().access_token != '') {
        Object.assign(statistics, await functions.getEndpointStatistics({ type: 'all' }));
      }
    }

    loadedStatistics.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    loadedStatistics.value = true;
  }
}

async function loadProjects() {
  try {
    availableProjects.splice(0, availableProjects.length);

    Object.assign(availableProjects, await functions.loadProjectList());

    const permissionStore = usePermissionStore();

    // Load permissions for all projects in parallel
    await Promise.all(
      availableProjects.map(async (p) => {
        if (p['project-id'] === project.value['project-id']) {
          p.info = 'selected';
        } else {
          p.info = 'activate';
        }

        p.actions = [];
        const access = await permissionStore.getProjectPermissions(p['project-id']);
        p.actions.push(...access);
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

async function activateProject(item: { 'project-id': string; 'project-name': string }) {
  loaded.value = false;
  try {
    visual.setProjectSelected(item);
    router.push('/');
  } catch (error) {
    console.error(error);
  } finally {
    await init();
    loaded.value = true;
  }
}

async function deleteProject(project: GetProjectResponse & { actions: string[]; info: string }) {
  try {
    await functions.deleteProjectById(project['project-id']);
    // if we delete the current project, switch to the first project
    if (project['project-id'] === visual.projectSelected['project-id']) {
      router.push('/');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await loadProjects();
  }
}

async function addProject(createProject: CreateProjectRequest & { 'project-name': string }) {
  try {
    await functions.createProject(createProject['project-name']);
  } catch (error) {
    console.error(error);
  } finally {
    await loadProjects();
  }
}

async function renameProject(renamedProject: RenameProjectRequest & { 'project-id': string }) {
  try {
    await functions.renameProjectById(renamedProject, renamedProject['project-id']);
  } catch (error) {
    console.error(error);
  } finally {
    await loadProjects();
  }
}

onMounted(async () => {
  if (userStorage.isAuthenticated) {
    await init();
  } else {
    await getEndpointStatistcs();
  }
});
</script>
