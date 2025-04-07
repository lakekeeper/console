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
        <v-tab value="overview">overview</v-tab>
        <v-tab
          v-if="canReadAssignments && enabledAuthentication && enabledPermissions"
          value="permissions">
          Permissions
        </v-tab>
        <v-tab
          v-if="canReadAssignments && enabledAuthentication && enabledPermissions"
          value="statistics"
          @click="getEndpointStatistcs">
          Statistics
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview">
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
            :sort-by="[{ key: 'name', order: 'asc' }]">
            <template #top>
              <v-toolbar color="transparent" density="compact" flat>
                <v-spacer></v-spacer>

                <!--AddProjectDialog @add-project="addProject" /-->
              </v-toolbar>
            </template>

            <template #item.info="{ item }">
              <v-chip v-if="item.info === 'selected'" class="mr-2">selected</v-chip>
              <v-chip v-if="item.info === 'switch'" class="mr-2">switch</v-chip>
            </template>

            <template #item.actions="{ item }">
              <AddOrEditProjectNameDialog
                :id="item['project-id']"
                :action-type="'edit'"
                :name="item['project-name']"
                @emit-project-new-name="renameProject" />
            </template>

            <template #no-data>
              <div>No projects available</div>
            </template>
          </v-data-table>
        </v-tabs-window-item>
        <v-tabs-window-item v-if="canReadAssignments" value="permissions">
          <PermissionManager
            v-if="loaded && enabledPermissions"
            :assignable-obj="permissionObject"
            :existing-permissions-from-obj="existingAssignments"
            :relation-type="permissionType"
            @permissions="assign" />
        </v-tabs-window-item>

        <v-tabs-window-item v-if="canReadAssignments" value="statistics">
          <ProjectStatistics v-if="loadedStatistics" :stats="statistics" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useVisualStore } from '../stores/visual';
import { enabledAuthentication, enabledPermissions } from '../app.config';

import { useFunctions } from '../plugins/functions';
import {
  GetEndpointStatisticsResponse,
  GetProjectResponse,
  ProjectAction,
  ProjectAssignment,
  RenameProjectRequest,
} from '../gen/management/types.gen';
import { AssignmentCollection, Header, RelationType } from '../common/interfaces';

const dialog = ref(false);
const tab = ref('overview');

const visual = useVisualStore();
const functions = useFunctions();

const permissionType = ref<RelationType>('project');
const myAccess = reactive<ProjectAction[]>([]);
const canReadAssignments = ref(false);
const canDeleteProject = ref(false);
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

const project = computed(() => {
  return visual.projectSelected;
});

const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: 'Project',
});

async function init() {
  try {
    permissionObject.id = project.value['project-id'];
    permissionObject.name = project.value['project-name'];

    myAccess.splice(0, myAccess.length);

    if (visual.getServerInfo()['authz-backend'] !== 'allow-all') {
      Object.assign(myAccess, await functions.getProjectAccess());
    } else {
      Object.assign(myAccess, []);
    }

    canReadAssignments.value = !!myAccess.includes('read_assignments');

    canDeleteProject.value = !!myAccess.includes('delete');

    await loadProjects();

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
  } catch (error: any) {
    console.error(error);
  }
}

async function getEndpointStatistcs() {
  try {
    // Fetch statistics from the backend
    loadedStatistics.value = false;

    Object.assign(statistics, await functions.getEndpointStatistics({ type: 'all' }));
    console.log('GetEndpointStatisticsResponse', statistics);
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
    availableProjects.forEach((p) => {
      p.actions = ['rename'];

      p.actions.push('delete');
      if (p['project-id'] === visual.projectSelected['project-id']) {
        p.info = 'selected';
      } else {
        p.info = 'switch';
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function assign(item: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    const del = item.del as ProjectAssignment[]; // Define 'del' variable
    const writes = item.writes as ProjectAssignment[]; // Define 'del' variable

    await functions.updateProjectAssignments(del, writes);

    await init();
    loaded.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    await init();
    loaded.value = true;
  }
}

// async function deleteProject(project: GetProjectResponse) {
//   try {
//     await functions.deleteProjectById(project["project-id"]);
//     await loadProjects();
//   } catch (error) {
//     console.error(error);
//   }
// }

// async function addProject(item: string) {
//   try {
//     await functions.createProject(item);
//     await loadProjects();
//   } catch (error) {
//     console.error(error);
//   }
// }

async function renameProject(renamedProject: RenameProjectRequest & { 'project-id': string }) {
  try {
    await functions.renameProjectById(renamedProject, renamedProject['project-id']);
    await loadProjects();
  } catch (error) {
    console.error(error);
  }
}
onMounted(async () => {
  await init();
});
</script>
