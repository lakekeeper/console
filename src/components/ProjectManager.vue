<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition" fullscreen>
    <template v-slot:activator="{ props: activatorProps }">
      <v-list-item-title
        v-bind="activatorProps"
        prepend-icon="mdi-home-silo"
        :text="project['project-name']"
      >
        <div class="text-center pa-4">
          <v-btn
            prepend-icon="mdi-home-silo"
            :text="project['project-name']"
          ></v-btn>
        </div>
      </v-list-item-title>
    </template>

    <v-card>
      <v-toolbar>
        <v-btn icon="mdi-close" @click="dialog = false"></v-btn>

        <v-toolbar-title>{{ project["project-name"] }}</v-toolbar-title>

        <v-spacer></v-spacer>
      </v-toolbar>
      <v-tabs v-model="tab">
        <v-tab value="overview">overview</v-tab>
        <v-tab
          value="permissions"
          v-if="can_read_assignments && enabledAuthorization"
          >Permissions
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview">
          <v-list lines="two" subheader>
            <v-list-subheader>Selected Project </v-list-subheader>

            <v-list-item
              :subtitle="`ID: ${project['project-id']}`"
              :title="`${project['project-name']}`"
              link
            ></v-list-item>

            <v-divider class="mt-8"></v-divider>
          </v-list>

          <v-data-table
            :headers="headers"
            fixed-header
            hover
            :items="availableProjects"
            :sort-by="[{ key: 'name', order: 'asc' }]"
          >
            <template v-slot:top>
              <v-toolbar flat density="compact" color="transparent">
                <v-spacer></v-spacer>

                <!--AddProjectDialog @add-project="addProject" /-->
              </v-toolbar>
            </template>

            <template v-slot:item.info="{ item }">
              <v-chip class="mr-2" v-if="item.info === 'selected'"
                >selected
              </v-chip>
              <v-chip class="mr-2" v-if="item.info === 'switch'">switch</v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <AddOrEditProjectNameDialog
                :actionType="'edit'"
                :name="item['project-name']"
                :id="item['project-id']"
                @emit-project-newname="renameProject"
              />
            </template>

            <template v-slot:no-data>
              <div>No projects available</div>
            </template>
          </v-data-table>
        </v-tabs-window-item>
        <v-tabs-window-item value="permissions" v-if="can_read_assignments">
          <PermissionManager
            v-if="loaded"
            :assignableObj="permissionObject"
            :relationType="permissionType"
            :existingPermissionsFromObj="existingAssignments"
            @permissions="assign"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useVisualStore } from "../stores/visual";
import { enabledAuthorization } from "../app.config";

import { useFunctions } from "../plugins/functions";
import {
  GetProjectResponse,
  ProjectAction,
  ProjectAssignment,
  RenameProjectRequest,
} from "../gen/management/types.gen";
import {
  AssignmentCollection,
  Header,
  RelationType,
} from "../common/interfaces";
import { computed, ref } from "vue";

const dialog = ref(false);
const tab = ref("overview");

const visual = useVisualStore();
const functions = useFunctions();

const permissionType = ref<RelationType>("project");

const myAccess = reactive<ProjectAction[]>([]);
const can_read_assignments = ref(false);
const can_delete_project = ref(false);
const projectAssignments = reactive<ProjectAssignment[]>([]);
const existingAssignments = reactive<ProjectAssignment[]>([]);
const loaded = ref(true);
const assignments = reactive<
  { id: string; name: string; email: string; type: string; kind: string }[]
>([]);

const headers: readonly Header<any>[] = Object.freeze([
  { title: "Info", key: "info", align: "start" },

  { title: "Name", key: "project-name", align: "start" },
  { title: "ID", key: "project-id", align: "start" },
  { title: "Actions", key: "actions", align: "start", sortable: false },
]);

const availableProjects = reactive<
  (GetProjectResponse & { actions: string[]; info: string })[]
>([]);

const project = computed(() => {
  return visual.projectSelected;
});

const permissionObject = reactive<any>({
  id: "",
  description: "",
  name: "Project",
});

async function init() {
  try {
    permissionObject.id = project.value["project-id"];
    permissionObject.name = project.value["project-name"];

    myAccess.splice(0, myAccess.length);
    Object.assign(myAccess, await functions.getProjectAccess());

    can_read_assignments.value = myAccess.includes("read_assignments")
      ? true
      : false;

    can_delete_project.value = myAccess.includes("delete") ? true : false;

    await loadProjects();

    Object.assign(
      projectAssignments,
      can_read_assignments.value ? await functions.getProjectAssignments() : []
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
            email: user.email ?? "",
            type: assignment.type,
            kind: "user",
          });
        }
      } else {
        const role = await functions.getRole(searchUser.role);
        if (role) {
          assignments.push({
            id: role.id,
            name: role.name,
            email: "",
            type: assignment.type,
            kind: "role",
          });
        }
      }
    }
  } catch (error: any) {
    console.error(error);
  }
}

async function loadProjects() {
  try {
    availableProjects.splice(0, availableProjects.length);
    Object.assign(availableProjects, await functions.loadProjectList());
    availableProjects.every((project) => {
      project.actions = ["rename"];

      project.actions.push("delete");
      if (project["project-id"] === visual.projectSelected["project-id"]) {
        project.info = "selected";
      } else {
        project.info = "switch";
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function assign(assignments: {
  del: AssignmentCollection;
  writes: AssignmentCollection;
}) {
  try {
    loaded.value = false;
    const del = assignments.del as ProjectAssignment[]; // Define 'del' variable
    const writes = assignments.writes as ProjectAssignment[]; // Define 'del' variable

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

async function renameProject(renamedProject: RenameProjectRequest) {
  try {
    await functions.renameProjectById(
      renamedProject,
      renamedProject["project-id"] as string
    );
    await loadProjects();
  } catch (error) {
    console.error(error);
  }
}
onMounted(async () => {
  await init();
});
</script>
