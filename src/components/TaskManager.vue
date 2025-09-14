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
          v-if="!hasError"
          :loading="tasksLoading"
          :headers="taskHeaders"
          :items="tasks"
          :items-per-page="50"
          :items-per-page-options="[
            { title: '25 items', value: 25 },
            { title: '50 items', value: 50 },
            { title: '100 items', value: 100 },
          ]"
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
            <div class="text-center pa-4" v-if="hasError">
              <v-icon size="64" color="warning">mdi-alert-circle-outline</v-icon>
              <div class="text-h6 mt-2">Unable to load tasks</div>
              <div class="text-subtitle-1 text-grey">
                {{ errorMessage }}
              </div>
              <v-btn class="mt-3" color="primary" variant="outlined" @click="refreshTasks">
                Try Again
              </v-btn>
            </div>
            <div class="text-center pa-4" v-else>
              <v-icon size="64" color="grey-lighten-1">mdi-clipboard-list-outline</v-icon>
              <div class="text-h6 mt-2">No tasks found</div>
              <div class="text-subtitle-1 text-grey">
                No tasks have been created for this {{ props.entityType || 'warehouse' }} yet.
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

        <!-- Error state display when data table is hidden -->
        <div v-if="hasError" class="text-center pa-8">
          <v-icon size="64" color="warning">mdi-alert-circle-outline</v-icon>
          <div class="text-h6 mt-2">Unable to load tasks</div>
          <div class="text-subtitle-1 text-grey mb-4">
            {{ errorMessage }}
          </div>
          <v-btn color="primary" variant="outlined" @click="refreshTasks" :loading="tasksLoading">
            Try Again
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup lang="ts">
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { Type } from '@/common/interfaces';
import { reactive, ref, onMounted } from 'vue';
import { Task, ListTasksRequest, ListTasksResponse, TaskEntity } from '@/gen/management/types.gen';

// Props
const props = defineProps<{
  warehouseId: string;
  tableId?: string;
  entityType?: 'warehouse' | 'table';
}>();

// Composables
const functions = useFunctions();
const visual = useVisualStore();

// Table headers
const taskHeaders = Object.freeze([
  { title: 'Task ID', key: 'task-id', align: 'start' as const, sortable: false },
  { title: 'Status', key: 'status', align: 'start' as const, sortable: false },
  { title: 'Progress', key: 'progress', align: 'start' as const, sortable: false },
  { title: 'Queue', key: 'queue-name', align: 'start' as const, sortable: false },
  { title: 'Created', key: 'created-at', align: 'start' as const, sortable: false },
  { title: 'Scheduled For', key: 'scheduled-for', align: 'start' as const, sortable: false },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
]);

// Reactive data
const tasks = reactive<Task[]>([]);
const tasksLoading = ref(false);
const tasksNextPageToken = ref<string | undefined>(undefined);
const hasError = ref(false);
const errorMessage = ref('');

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
  hasError.value = false;
  errorMessage.value = '';
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
  } catch (error: any) {
    console.error('Failed to load task details:', error);
    visual.setSnackbarMsg({
      function: 'viewTaskDetails',
      text: `Failed to load task details: ${error?.message || 'Unknown error'}`,
      ttl: 5000,
      ts: Date.now(),
      type: Type.ERROR,
    });
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
  } catch (error: any) {
    console.error('Failed to stop task:', error);
    visual.setSnackbarMsg({
      function: 'stopTask',
      text: `Failed to stop task: ${error?.message || 'Unknown error'}`,
      ttl: 5000,
      ts: Date.now(),
      type: Type.ERROR,
    });
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
  } catch (error: any) {
    console.error('Failed to cancel task:', error);
    visual.setSnackbarMsg({
      function: 'cancelTask',
      text: `Failed to cancel task: ${error?.message || 'Unknown error'}`,
      ttl: 5000,
      ts: Date.now(),
      type: Type.ERROR,
    });
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
  } catch (error: any) {
    console.error('Failed to run task now:', error);
    visual.setSnackbarMsg({
      function: 'runTaskNow',
      text: `Failed to run task: ${error?.message || 'Unknown error'}`,
      ttl: 5000,
      ts: Date.now(),
      type: Type.ERROR,
    });
  }
}

async function listTasks() {
  try {
    tasksLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';

    const request: ListTasksRequest = {
      'page-size': 50,
      'page-token': tasksNextPageToken.value,
      // Add table entity filter if tableId is provided
      ...(props.tableId && {
        entities: [
          {
            type: 'table',
            'warehouse-id': props.warehouseId,
            'table-id': props.tableId,
          },
        ] as TaskEntity[],
      }),
      // You can add other filters here if needed
      // status: ['RUNNING', 'SCHEDULED', 'SUCCESS', 'FAILED'],
      // 'created-after': '2024-01-01T00:00:00Z',
      // 'created-before': new Date().toISOString(),
    };

    // Debug logging
    console.log('TaskManager - listTasks request:', {
      warehouseId: props.warehouseId,
      tableId: props.tableId,
      entityType: props.entityType,
      request,
    });

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
  } catch (error: any) {
    tasksLoading.value = false;
    hasError.value = true;

    // Handle different error types gracefully
    if (error?.response?.status === 404 || error?.isTaskManagementError) {
      if (props.tableId) {
        errorMessage.value = `Task management is not available for this table. This may be because:
• The table does not support task operations
• Task features are not enabled for this table type
• The table ID format is not compatible with task management`;
      } else {
        errorMessage.value = `Task management is not available for this warehouse yet.`;
      }
    } else if (error?.response?.status === 403) {
      errorMessage.value = 'You do not have permission to view tasks.';
    } else if (error?.response?.status >= 500) {
      errorMessage.value = 'Server error occurred. Please try again later.';
    } else {
      errorMessage.value = 'Failed to load tasks. Please check your connection and try again.';
    }

    console.error('Failed to load tasks:', error);

    // Show user-friendly notification for non-404 errors and non-task management errors
    if (error?.response?.status !== 404 && !error?.isTaskManagementError) {
      visual.setSnackbarMsg({
        function: 'listTasks',
        text: errorMessage.value,
        ttl: 5000,
        ts: Date.now(),
        type: Type.ERROR,
      });
    }
  }
}

// Load tasks when component is mounted
onMounted(async () => {
  // Validate required props before attempting to load tasks
  if (!props.warehouseId) {
    hasError.value = true;
    errorMessage.value = 'Warehouse ID is required to load tasks.';
    return;
  }

  // For table context, ensure tableId is provided and valid
  if (props.entityType === 'table' && (!props.tableId || props.tableId.trim() === '')) {
    hasError.value = true;
    errorMessage.value = 'Table ID is required to load table-specific tasks.';
    return;
  }

  await listTasks();
});

// Expose refresh function for parent component
defineExpose({
  refreshTasks,
  listTasks,
});
</script>
