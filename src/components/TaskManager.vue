<template>
  <v-card-text>
    <v-row>
      <v-col>
        <v-toolbar color="transparent" density="compact" flat>
          <v-toolbar-title>Task Management</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="primary" density="compact" variant="outlined" @click="refreshTasks">
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </v-toolbar>

        <v-data-table
          :loading="tasksLoading"
          :headers="taskHeaders"
          :items="tasks"
          :items-per-page="50"
          :items-per-page-options="[
            { title: '25 items', value: 25 },
            { title: '50 items', value: 50 },
            { title: '100 items', value: 100 },
          ]"
          :sort-by="[{ key: 'created-at', order: 'desc' }]"
          hover
          density="compact">
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small" variant="flat">
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.progress="{ item }">
            <v-progress-linear
              :model-value="item.progress * 100"
              :color="getStatusColor(item.status)"
              height="6"
              rounded></v-progress-linear>
            <span class="text-caption">{{ Math.round(item.progress * 100) }}%</span>
          </template>

          <template #item.created-at="{ item }">
            {{ formatDateTime(item['created-at']) }}
          </template>

          <template #item.scheduled-for="{ item }">
            {{ formatDateTime(item['scheduled-for']) }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-information"
              size="small"
              variant="text"
              @click="viewTaskDetails(item)"></v-btn>
            <v-btn
              v-if="item.status === 'RUNNING'"
              icon="mdi-stop"
              size="small"
              variant="text"
              color="warning"
              @click="stopTask(item)"></v-btn>
            <v-btn
              v-if="['SCHEDULED', 'RUNNING'].includes(item.status)"
              icon="mdi-cancel"
              size="small"
              variant="text"
              color="error"
              @click="cancelTask(item)"></v-btn>
            <v-btn
              v-if="item.status === 'SCHEDULED'"
              icon="mdi-play"
              size="small"
              variant="text"
              color="success"
              @click="runTaskNow(item)"></v-btn>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              <v-icon size="64" color="grey-lighten-1">mdi-clipboard-list-outline</v-icon>
              <div class="text-h6 mt-2">No tasks found</div>
              <div class="text-subtitle-1 text-grey">
                No tasks have been created for this warehouse yet.
              </div>
            </div>
          </template>

          <template #bottom>
            <div class="text-center pa-2" v-if="tasksNextPageToken">
              <v-btn :loading="tasksLoading" variant="outlined" @click="loadMoreTasks">
                Load More Tasks
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup lang="ts">
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { Type } from '@/common/interfaces';
import { reactive, ref, onMounted } from 'vue';
import { Task, ListTasksRequest, ListTasksResponse } from '@/gen/management/types.gen';

// Props
const props = defineProps<{
  warehouseId: string;
}>();

// Composables
const functions = useFunctions();
const visual = useVisualStore();

// Table headers
const taskHeaders = Object.freeze([
  { title: 'Task ID', key: 'task-id', align: 'start' as const },
  { title: 'Status', key: 'status', align: 'start' as const },
  { title: 'Progress', key: 'progress', align: 'start' as const, sortable: false },
  { title: 'Queue', key: 'queue-name', align: 'start' as const },
  { title: 'Created', key: 'created-at', align: 'start' as const },
  { title: 'Scheduled For', key: 'scheduled-for', align: 'start' as const },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
]);

// Reactive data
const tasks = reactive<Task[]>([]);
const tasksLoading = ref(false);
const tasksNextPageToken = ref<string | undefined>(undefined);

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'RUNNING':
      return 'info';
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'CANCELLED':
      return 'warning';
    case 'SCHEDULED':
      return 'primary';
    case 'STOPPING':
      return 'orange';
    default:
      return 'grey';
  }
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return dateString;
  }
}

// Task management functions
async function refreshTasks() {
  tasksNextPageToken.value = undefined;
  await listTasks();
}

async function loadMoreTasks() {
  if (tasksNextPageToken.value) {
    await listTasks();
  }
}

async function viewTaskDetails(task: Task) {
  try {
    const details = await functions.getTaskDetails(props.warehouseId, task['task-id']);
    // For now, just log the details - you could open a dialog here
    console.log('Task details:', details);
    visual.setSnackbarMsg({
      function: 'viewTaskDetails',
      text: `Task details logged to console`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
  } catch (error) {
    console.error('Failed to load task details:', error);
  }
}

async function stopTask(task: Task) {
  try {
    await functions.controlTasks(props.warehouseId, { action: 'stop' }, [task['task-id']]);
    visual.setSnackbarMsg({
      function: 'stopTask',
      text: `Task ${task['task-id']} stop requested`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
    await refreshTasks();
  } catch (error) {
    console.error('Failed to stop task:', error);
  }
}

async function cancelTask(task: Task) {
  try {
    await functions.controlTasks(props.warehouseId, { action: 'cancel' }, [task['task-id']]);
    visual.setSnackbarMsg({
      function: 'cancelTask',
      text: `Task ${task['task-id']} cancelled`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
    await refreshTasks();
  } catch (error) {
    console.error('Failed to cancel task:', error);
  }
}

async function runTaskNow(task: Task) {
  try {
    await functions.controlTasks(props.warehouseId, { action: 'run-now' }, [task['task-id']]);
    visual.setSnackbarMsg({
      function: 'runTaskNow',
      text: `Task ${task['task-id']} scheduled to run now`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
    await refreshTasks();
  } catch (error) {
    console.error('Failed to run task now:', error);
  }
}

async function listTasks() {
  try {
    tasksLoading.value = true;

    const request: ListTasksRequest = {
      'page-size': 50,
      'page-token': tasksNextPageToken.value,
      // You can add filters here if needed
      // status: ['RUNNING', 'SCHEDULED', 'SUCCESS', 'FAILED'],
      // 'created-after': '2024-01-01T00:00:00Z',
      // 'created-before': new Date().toISOString(),
    };

    const response: ListTasksResponse = await functions.listTasks(props.warehouseId, request);

    if (tasksNextPageToken.value) {
      // If we have a page token, we're loading more data, so append
      tasks.push(...(response.tasks || []));
    } else {
      // If no page token, this is a fresh load, so replace
      tasks.splice(0, tasks.length, ...(response.tasks || []));
    }

    tasksNextPageToken.value = response['next-page-token'] || undefined;

    tasksLoading.value = false;
  } catch (error) {
    tasksLoading.value = false;
    console.error('Failed to load tasks:', error);
  }
}

// Load tasks when component is mounted
onMounted(async () => {
  await listTasks();
});

// Expose refresh function for parent component
defineExpose({
  refreshTasks,
  listTasks,
});
</script>
