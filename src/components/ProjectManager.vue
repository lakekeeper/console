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
          <v-switch
            v-model="statisticsVisualTableSwitch"
            color="primary"
            :label="statisticsVisualTableSwitch ? 'Table' : 'Chart'"></v-switch>
          <v-card v-if="statisticsVisualTableSwitch">
            <v-data-table-virtual
              fixed-header
              height="50vh"
              :headers="headersStatistics"
              hover
              :items="tableStatisticsFormatted">
              <template #top>
                <v-toolbar color="transparent" density="compact" flat>
                  <v-spacer></v-spacer>
                  <span class="icon-text">
                    <v-btn
                      size="small"
                      prepend-icon="mdi-file-download"
                      variant="outlined"
                      color="primary"
                      @click="downloadStatsAsCSV">
                      Download
                    </v-btn>
                  </span>
                </v-toolbar>
              </template>
              <template v-slot:item.timestamp="{ item }">
                {{ formatDate(item.timestamp) }}
              </template>
              <template #no-data>
                <div>No statiscs available</div>
              </template>
            </v-data-table-virtual>
          </v-card>
          <div v-else style="height: 50vh">
            <Line :data="data" :options="options" />
          </div>
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

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const data = reactive<ChartData<'line'>>({
  labels: [],
  datasets: [
    {
      label: 'Number of API calls',
      backgroundColor: '#1e857d',
      borderColor: '#1e857d',
      data: [],
    },
  ],
});

const options = reactive({
  responsive: true,
  maintainAspectRatio: false,
});

const dialog = ref(false);
const tab = ref('overview');

const visual = useVisualStore();
const functions = useFunctions();

const permissionType = ref<RelationType>('project');
const statisticsVisualTableSwitch = ref(true);
const myAccess = reactive<ProjectAction[]>([]);
const canReadAssignments = ref(false);
const canDeleteProject = ref(false);
const projectAssignments = reactive<ProjectAssignment[]>([]);
const existingAssignments = reactive<ProjectAssignment[]>([]);
const loaded = ref(true);
const assignments = reactive<
  { id: string; name: string; email: string; type: string; kind: string }[]
>([]);

const statistics = reactive<GetEndpointStatisticsResponse>({
  'called-endpoints': [],
  'next-page-token': '',
  'previous-page-token': '',
  timestamps: [],
});

const tableStatisticsFormatted = ref<
  Array<{
    timestamp: string;
    count: number;
    httpRoute: string;
    statusCode: number;
    warehouseId: string | null;
    warehouseName: string | null;
    createdAt: string;
    updatedAt: string | null;
  }>
>([]);
const headersStatistics: readonly Header[] = Object.freeze([
  { title: 'Timestamp', key: 'timestamp', align: 'start' },
  { title: 'Count', key: 'count', align: 'start' },
  { title: 'HTTP Route', key: 'httpRoute', align: 'start' },
  { title: 'Status Code', key: 'statusCode', align: 'start' },
  { title: 'Warehouse ID', key: 'warehouseId', align: 'start' },
  { title: 'Warehouse Name', key: 'warehouseName', align: 'start' },
  { title: 'Created At', key: 'createdAt', align: 'start' },
  { title: 'Updated At', key: 'updatedAt', align: 'start' },
]);

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

// async function getEndpointStatistcs() {
//   try {
//     Object.assign(statistics, await functions.getEndpointStatistics({ type: 'all' }));
//     console.log('GetEndpointStatisticsResponse', statistics);
//     tableStatisticsFormatted.value.splice(0, tableStatisticsFormatted.value.length);

//     tableStatisticsFormatted.value.push(...formatStatisticsTable(statistics));
//     console.log(tableStatisticsFormatted.value);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     loaded.value = true;
//   }
// }

async function getEndpointStatistcs() {
  try {
    // Fetch statistics from the backend
    Object.assign(statistics, await functions.getEndpointStatistics({ type: 'all' }));
    console.log('GetEndpointStatisticsResponse', statistics);

    // Step 1: Format the raw statistics into a table-friendly format
    const formattedTableData = formatStatisticsTable(statistics);

    // Step 2: Aggregate data by date-hour
    const aggregatedData: { [key: string]: number } = {};
    const timestamps = formattedTableData.map((entry) => new Date(entry.timestamp));

    // Find the range of timestamps
    const minTimestamp = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const maxTimestamp = new Date(Math.max(...timestamps.map((t) => t.getTime())));

    // Normalize timestamps to date-hour and aggregate counts
    formattedTableData.forEach((entry) => {
      const dateHour = new Date(entry.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      if (!aggregatedData[dateHour]) {
        aggregatedData[dateHour] = 0;
      }
      aggregatedData[dateHour] += entry.count;
    });

    // Step 3: Fill in gaps with count 0
    const filledData: { label: string; count: number }[] = [];
    let currentTimestamp = new Date(minTimestamp);

    while (currentTimestamp <= maxTimestamp) {
      const dateHour = currentTimestamp.toISOString().slice(0, 13) + ':00:00Z';
      filledData.push({
        label: dateHour,
        count: aggregatedData[dateHour] || 0,
      });
      currentTimestamp.setHours(currentTimestamp.getHours() + 1); // Increment by 1 hour
    }

    // Step 4: Update chart data
    data.labels = filledData.map((item) => formatDate(item.label));
    data.datasets[0].data = filledData.map((item) => item.count);

    // Step 5: Update table data
    tableStatisticsFormatted.value.splice(0, tableStatisticsFormatted.value.length);
    tableStatisticsFormatted.value.push(...formattedTableData);

    console.log('Aggregated Chart Data:', filledData);
    console.log('Table Data:', tableStatisticsFormatted.value);
  } catch (error) {
    console.error(error);
  } finally {
    loaded.value = true;
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

function formatStatisticsTable(statistics: any) {
  const result: Array<{
    timestamp: string;
    count: number;
    httpRoute: string;
    statusCode: number;
    warehouseId: string | null;
    warehouseName: string | null;
    createdAt: string;
    updatedAt: string | null;
  }> = [];

  // Iterate over timestamps and their corresponding called-endpoints arrays
  statistics.timestamps.forEach((timestamp: string, index: number) => {
    const endpointsGroup = statistics['called-endpoints'][index]; // Get the array of endpoints for the current timestamp
    if (endpointsGroup) {
      endpointsGroup.forEach((endpoint: any) => {
        const row = {
          timestamp, // Add timestamp to each endpoint object
          count: endpoint.count,
          httpRoute: endpoint['http-route'],
          statusCode: endpoint['status-code'],
          warehouseId: endpoint['warehouse-id'] ?? null,
          warehouseName: endpoint['warehouse-name'] ?? null,
          createdAt: endpoint['created-at'],
          updatedAt: endpoint['updated-at'] ?? null,
        };
        result.push(row);
      });
    }
  });

  return result;
}

function formatDate(dateString: string) {
  const options = {
    year: 'numeric' as const,
    month: '2-digit' as const,
    day: '2-digit' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    second: '2-digit' as const,
  };
  return new Date(dateString).toLocaleDateString('en-US', options).replace(',', '');
}

function downloadStatsAsCSV() {
  if (!tableStatisticsFormatted.value || tableStatisticsFormatted.value.length === 0) {
    console.warn('No statistics available to download.');
    return;
  }

  // Define CSV headers
  const csvHeaders = [
    'Timestamp',
    'Count',
    'HTTP Route',
    'Status Code',
    'Warehouse ID',
    'Warehouse Name',
    'Created At',
    'Updated At',
  ];

  // Map rows from tableStatisticsFormatted
  const csvRows = tableStatisticsFormatted.value.map((stat) => [
    formatDate(stat.timestamp),
    stat.count,
    stat.httpRoute,
    stat.statusCode,
    stat.warehouseId ?? '',
    stat.warehouseName ?? '',
    formatDate(stat.createdAt),
    stat.updatedAt ? formatDate(stat.updatedAt) : '',
  ]);

  // Combine headers and rows into CSV content
  const csvContent = [
    csvHeaders.join(','), // Add headers
    ...csvRows.map((row) => row.join(',')), // Add rows
  ].join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'endpoint-statistics.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>
