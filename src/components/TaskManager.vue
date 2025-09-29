<template>
  <v-card-text>
    <v-row>
      <v-col>
        <v-toolbar color="transparent" density="compact" flat>
          <v-toolbar-title>Task Management</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            density="compact"
            variant="outlined"
            @click="showFilters = !showFilters"
            class="mr-2">
            <v-icon start>mdi-filter-variant</v-icon>
            Filters
          </v-btn>
          <v-btn color="primary" density="compact" variant="outlined" @click="refreshTasks">
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </v-toolbar>

        <!-- Filter Panel -->
        <v-expand-transition>
          <v-card v-show="showFilters" variant="outlined" class="mb-4">
            <v-card-text>
              <!-- Filter Groups -->
              <v-row>
                <v-col cols="12">
                  <v-card variant="outlined" class="pa-3">
                    <v-card-title class="text-subtitle-2 pb-2">General Filters</v-card-title>
                    <v-row dense>
                      <v-col cols="12" sm="4">
                        <v-select
                          v-model="filters.status"
                          :items="statusOptions"
                          label="Status"
                          multiple
                          chips
                          clearable
                          density="compact"
                          hide-details>
                          <template #chip="{ props, item }">
                            <v-chip v-bind="props" :color="getStatusColor(item.value)" size="small">
                              {{ item.title }}
                            </v-chip>
                          </template>
                        </v-select>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <v-combobox
                          v-model="filters.queueNames"
                          :items="queueNameOptions"
                          item-title="title"
                          item-value="value"
                          label="Task Types"
                          multiple
                          chips
                          clearable
                          density="compact"
                          hide-details
                          hint="Select from common queues or enter custom names"></v-combobox>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <v-text-field
                          v-model="filters.taskId"
                          placeholder="01997633-d918-70f3-aec1-1889ae4bb232"
                          label="Task ID"
                          clearable
                          density="compact"
                          hide-details
                          hint="Filter by specific task ID"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Date Range Filters -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-3">
                    <v-card-title class="text-subtitle-2 pb-2">Created Date Range</v-card-title>
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="filters.createdAfter"
                          label="After"
                          type="datetime-local"
                          clearable
                          density="compact"
                          hide-details
                          hint="Tasks created after this date"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="filters.createdBefore"
                          label="Before"
                          type="datetime-local"
                          clearable
                          density="compact"
                          hide-details
                          hint="Tasks created before this date"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-3">
                    <v-card-title class="text-subtitle-2 pb-2">Scheduled Date Range</v-card-title>
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="filters.scheduledAfter"
                          label="After"
                          type="datetime-local"
                          clearable
                          density="compact"
                          hide-details
                          hint="Tasks scheduled after this date"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="filters.scheduledBefore"
                          label="Before"
                          type="datetime-local"
                          clearable
                          density="compact"
                          hide-details
                          hint="Tasks scheduled before this date"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    density="compact"
                    @click="applyFilters"
                    :loading="tasksLoading">
                    Apply Filters
                  </v-btn>
                  <v-btn
                    color="secondary"
                    density="compact"
                    variant="outlined"
                    class="ml-2"
                    @click="clearFilters">
                    Clear All
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-chip v-if="hasActiveFilters" color="info" size="small">
                    {{ activeFilterCount }} filter(s) active
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <v-data-table
          v-if="!hasError"
          :loading="tasksLoading"
          :headers="taskHeaders"
          :items="tasks"
          :items-per-page="currentPaginationOptions.itemsPerPage"
          :items-per-page-options="[
            { title: '25 items', value: 25 },
            { title: '50 items', value: 50 },
            { title: '100 items', value: 100 },
          ]"
          hover
          density="compact"
          fixed-header
          :height="showFilters ? '40vh' : '60vh'"
          @update:options="handlePaginationUpdate">
          <template #item.entity-name="{ item }">
            <span>
              {{
                Array.isArray(item['entity-name'])
                  ? item['entity-name'].join('.')
                  : item['entity-name']
              }}
            </span>
          </template>
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small" variant="flat">
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.task-id="{ item }">
            <span class="icon-text">
              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="flat"
                @click="functions.copyToClipboard(item['task-id'])"></v-btn>
              {{ item['task-id'] }}
            </span>
          </template>

          <template #item.queue-name="{ item }">
            {{ formatQueueName(item['queue-name']) }}
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
              v-if="item.status === 'RUNNING' && canShowControls"
              icon="mdi-stop"
              size="small"
              variant="text"
              color="warning"
              @click="stopTask(item)"></v-btn>
            <v-btn
              v-if="['SCHEDULED', 'RUNNING'].includes(item.status) && canShowControls"
              icon="mdi-cancel"
              size="small"
              variant="text"
              color="error"
              @click="cancelTask(item)"></v-btn>
            <v-btn
              v-if="item.status === 'SCHEDULED' && canShowControls"
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

    <!-- Task Details Modal -->
    <v-dialog v-model="showTaskDetailsDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeTaskDetailsDialog"></v-btn>
        </v-card-title>

        <v-card-text v-if="taskDetailsLoading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="text-h6 mt-4">Loading task details...</div>
        </v-card-text>

        <v-card-text v-else-if="taskDetailsError" class="text-center pa-8">
          <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
          <div class="text-h6 mt-2 text-error">Failed to load task details</div>
          <div class="text-body-1 mt-2 text-grey">{{ taskDetailsError }}</div>
          <v-btn class="mt-4" color="primary" variant="outlined" @click="retryLoadTaskDetails">
            Try Again
          </v-btn>
        </v-card-text>

        <v-card-text v-else class="pa-0">
          <TaskDetails
            :task="selectedTaskDetails"
            :format-queue-name="formatQueueName"
            @copy="functions.copyToClipboard" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Cancel Task Confirmation Modal -->
    <v-dialog v-model="showCancelConfirmDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-cancel</v-icon>
          Cancel Task
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-4">
          <div class="text-body-1 mb-3">Are you sure you want to cancel this task?</div>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
            <strong>Warning:</strong>
            This action cannot be undone. The task will be permanently cancelled and not retried.
          </v-alert>

          <div v-if="taskToConfirm" class="text-caption">
            <div>
              <strong>Task ID:</strong>
              {{ taskToConfirm['task-id'] }}
            </div>
            <div>
              <strong>Status:</strong>
              {{ taskToConfirm.status }}
            </div>
            <div>
              <strong>Queue:</strong>
              {{ formatQueueName(taskToConfirm['queue-name']) }}
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" @click="closeCancelConfirmDialog">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="taskActionLoading"
            @click="confirmCancelTask">
            Cancel Task
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Run Now Confirmation Modal -->
    <v-dialog v-model="showRunNowConfirmDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="success">mdi-play</v-icon>
          Run Task Now
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-4">
          <div class="text-body-1 mb-3">Are you sure you want to run this task immediately?</div>
          <v-alert type="info" variant="tonal" density="compact" class="mb-3">
            <strong>Note:</strong>
            This will move the scheduled time to now and the task will be executed immediately.
          </v-alert>

          <div v-if="taskToConfirm" class="text-caption">
            <div>
              <strong>Task ID:</strong>
              {{ taskToConfirm['task-id'] }}
            </div>
            <div>
              <strong>Status:</strong>
              {{ taskToConfirm.status }}
            </div>
            <div>
              <strong>Queue:</strong>
              {{ formatQueueName(taskToConfirm['queue-name']) }}
            </div>
            <div>
              <strong>Originally Scheduled For:</strong>
              {{ formatDateTime(taskToConfirm['scheduled-for']) }}
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" @click="closeRunNowConfirmDialog">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="taskActionLoading"
            @click="confirmRunTaskNow">
            Run Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card-text>
</template>

<script setup lang="ts">
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { Type } from '@/common/interfaces';
import { useQueueConfig, type QueueOption } from '@/common/queueConfig';
import { reactive, ref, onMounted, computed } from 'vue';
import TaskDetails from '@/components/TaskDetails.vue';
import { getStatusColor, formatDateTime } from '@/common/taskUtils';
import {
  Task,
  ListTasksRequest,
  ListTasksResponse,
  TaskEntity,
  TaskStatus,
  GetTaskDetailsResponse,
} from '@/gen/management/types.gen';

// Props
const props = defineProps<{
  warehouseId: string;
  tableId?: string;
  viewId?: string;
  entityType?: 'warehouse' | 'table' | 'view';
  canControlTasks?: boolean;
  enabledAuthentication?: boolean;
  enabledPermissions?: boolean;
}>();

// Composables
const functions = useFunctions();
const visual = useVisualStore();

// Computed property to determine if task controls should be shown
const canShowControls = computed(() => {
  // Show controls if the caller explicitly grants control or explicitly disables gating
  return (
    props.canControlTasks === true ||
    props.enabledAuthentication === false ||
    props.enabledPermissions === false
  );
});

// Helper functions to handle entity type differences
const getEntityId = () => {
  if (props.entityType === 'view') {
    return props.viewId;
  } else if (props.entityType === 'table') {
    return props.tableId;
  }
  return null;
};

const createEntityFilter = (): TaskEntity[] | undefined => {
  const entityId = getEntityId();
  if (!entityId) return undefined;

  if (props.entityType === 'view') {
    return [
      {
        type: 'view',
        'warehouse-id': props.warehouseId,
        'view-id': entityId,
      },
    ] as TaskEntity[];
  } else if (props.entityType === 'table') {
    return [
      {
        type: 'table',
        'warehouse-id': props.warehouseId,
        'table-id': entityId,
      },
    ] as TaskEntity[];
  }
  return undefined;
};

// Queue configuration
const queueManager = useQueueConfig();

// Table headers
const taskHeaders = Object.freeze([
  { title: 'Task ID', key: 'task-id', align: 'start' as const, sortable: false },
  { title: 'Entity Name', key: 'entity-name', align: 'start' as const, sortable: false },
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

// Task details modal data
const showTaskDetailsDialog = ref(false);
const selectedTaskDetails = ref<GetTaskDetailsResponse | null>(null);
const taskDetailsLoading = ref(false);
const taskDetailsError = ref('');

// Task action confirmation modals
const showCancelConfirmDialog = ref(false);
const showRunNowConfirmDialog = ref(false);
const taskToConfirm = ref<Task | null>(null);
const taskActionLoading = ref(false);

// Pagination state
const currentPaginationOptions = ref({
  page: 1,
  itemsPerPage: 50,
});

// Filter-related reactive data
const showFilters = ref(false);
const filters = reactive({
  status: [] as TaskStatus[],
  queueNames: [] as (string | { title: string; value: string })[],
  createdAfter: '',
  createdBefore: '',
  scheduledAfter: '',
  scheduledBefore: '',
  taskId: '',
  parentTaskId: '',
});

// Status options for the filter dropdown
const statusOptions = [
  { title: 'Running', value: 'RUNNING' as TaskStatus },
  { title: 'Scheduled', value: 'SCHEDULED' as TaskStatus },
  { title: 'Stopping', value: 'STOPPING' as TaskStatus },
  { title: 'Cancelled', value: 'CANCELLED' as TaskStatus },
  { title: 'Success', value: 'SUCCESS' as TaskStatus },
  { title: 'Failed', value: 'FAILED' as TaskStatus },
];

// Queue name options from configuration
const queueNameOptions = computed(() =>
  queueManager.options.map((option) => ({
    title: option.title,
    value: option.value,
  })),
);

// Computed properties for filter state
const hasActiveFilters = computed(() => {
  return (
    filters.status.length > 0 ||
    filters.queueNames.length > 0 ||
    filters.createdAfter !== '' ||
    filters.createdBefore !== '' ||
    filters.scheduledAfter !== '' ||
    filters.scheduledBefore !== '' ||
    filters.taskId !== '' ||
    filters.parentTaskId !== ''
  );
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.status.length > 0) count++;
  if (filters.queueNames.length > 0) count++;
  if (filters.createdAfter !== '') count++;
  if (filters.createdBefore !== '') count++;
  if (filters.scheduledAfter !== '') count++;
  if (filters.scheduledBefore !== '') count++;
  if (filters.taskId !== '') count++;
  if (filters.parentTaskId !== '') count++;
  return count;
});

// Filter functions
function applyFilters() {
  // Reset pagination when applying filters
  tasksNextPageToken.value = undefined;
  refreshTasks();
}

function clearFilters() {
  filters.status = [];
  filters.queueNames = [];
  filters.createdAfter = '';
  filters.createdBefore = '';
  filters.scheduledAfter = '';
  filters.scheduledBefore = '';
  filters.taskId = '';
  filters.parentTaskId = '';
  applyFilters();
}

// Task details modal functions
function closeTaskDetailsDialog() {
  showTaskDetailsDialog.value = false;
  selectedTaskDetails.value = null;
  taskDetailsError.value = '';
}

async function retryLoadTaskDetails() {
  if (selectedTaskDetails.value) {
    await loadTaskDetails(selectedTaskDetails.value['task-id']);
  }
}

async function loadTaskDetails(taskId: string) {
  taskDetailsLoading.value = true;
  taskDetailsError.value = '';

  try {
    const details = await functions.getTaskDetails(props.warehouseId, taskId);
    selectedTaskDetails.value = details;
  } catch (error: any) {
    console.error('Failed to load task details:', error);

    // Handle different error types
    if (error?.response?.status === 403) {
      taskDetailsError.value = 'You do not have permission to view task details.';
    } else if (error?.response?.status === 404) {
      taskDetailsError.value = 'Task not found. It may have been deleted or completed.';
    } else if (error?.response?.status >= 500) {
      taskDetailsError.value = 'Server error occurred. Please try again later.';
    } else {
      taskDetailsError.value = error?.message || 'Failed to load task details. Please try again.';
    }
  } finally {
    taskDetailsLoading.value = false;
  }
}

// Task action confirmation functions
function closeCancelConfirmDialog() {
  showCancelConfirmDialog.value = false;
  taskToConfirm.value = null;
}

function closeRunNowConfirmDialog() {
  showRunNowConfirmDialog.value = false;
  taskToConfirm.value = null;
}

async function confirmCancelTask() {
  if (!taskToConfirm.value) return;

  taskActionLoading.value = true;
  try {
    await functions.controlTasks(props.warehouseId, { action: 'cancel' }, [
      taskToConfirm.value['task-id'],
    ]);
    visual.setSnackbarMsg({
      function: 'cancelTask',
      text: `Task ${taskToConfirm.value['task-id']} cancelled`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
    closeCancelConfirmDialog();
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
  } finally {
    taskActionLoading.value = false;
  }
}

async function confirmRunTaskNow() {
  if (!taskToConfirm.value) return;

  taskActionLoading.value = true;
  try {
    await functions.controlTasks(props.warehouseId, { action: 'run-now' }, [
      taskToConfirm.value['task-id'],
    ]);
    visual.setSnackbarMsg({
      function: 'runTaskNow',
      text: `Task ${taskToConfirm.value['task-id']} scheduled to run now`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
    closeRunNowConfirmDialog();
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
  } finally {
    taskActionLoading.value = false;
  }
}

// Helper functions
function formatQueueName(queueName: string): string {
  return queueManager.formatQueueName(queueName);
}

// Task management functions
async function refreshTasks() {
  hasError.value = false;
  errorMessage.value = '';
  tasks.splice(0); // Clear all existing tasks
  tasksNextPageToken.value = undefined;
  await listTasks();

  // Preload additional data based on user's current pagination setting
  const itemsPerPage = currentPaginationOptions.value.itemsPerPage;
  const targetMinimumItems = itemsPerPage * 2; // Always maintain 2x buffer

  if (tasksNextPageToken.value && tasks.length > 0 && tasks.length < targetMinimumItems) {
    await loadMoreTasks();
  }
}

async function loadMoreTasks() {
  if (tasksNextPageToken.value) {
    await listTasks();
  }
}

// Handle automatic pagination when user navigates through pages
async function handlePaginationUpdate(options: any) {
  // Store current pagination options for refresh functionality
  if (options.page && options.itemsPerPage) {
    currentPaginationOptions.value = {
      page: options.page,
      itemsPerPage: options.itemsPerPage,
    };
  }

  // Check if we need to load more data proactively
  if (options.page && options.itemsPerPage) {
    const currentPage = options.page;
    const itemsPerPage = options.itemsPerPage;
    const totalLoadedItems = tasks.length;
    const currentlyViewedItems = currentPage * itemsPerPage;

    // Calculate how much buffer we want to maintain
    // When displaying 50 items, we want to have at least 100 loaded
    // When displaying 100 items, we want to have at least 150 loaded, etc.
    const bufferSize = itemsPerPage;
    const minimumLoadedItems = currentlyViewedItems + bufferSize;

    // If we don't have enough items loaded and more data is available, load more
    if (totalLoadedItems < minimumLoadedItems && tasksNextPageToken.value && !tasksLoading.value) {
      await loadMoreTasks();
    }
  }
}

async function viewTaskDetails(task: Task) {
  selectedTaskDetails.value = null; // Reset details data
  showTaskDetailsDialog.value = true;
  await loadTaskDetails(task['task-id']);
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
  taskToConfirm.value = task;
  showCancelConfirmDialog.value = true;
}

async function runTaskNow(task: Task) {
  taskToConfirm.value = task;
  showRunNowConfirmDialog.value = true;
}

async function listTasks() {
  try {
    tasksLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';

    // Store if this is a pagination request (loading more) vs fresh load
    const isLoadingMore = !!tasksNextPageToken.value;

    const request: ListTasksRequest = {
      'page-size': 110, // Load more items per request to reduce API calls
      'page-token': tasksNextPageToken.value,
      // Add entity filter if entityId is provided
      ...(getEntityId() && {
        entities: createEntityFilter(),
      }),
      // Apply filters
      ...(filters.status.length > 0 && { status: filters.status }),
      ...(filters.queueNames.length > 0 && {
        'queue-name': filters.queueNames.map((qn: string | QueueOption) => {
          if (typeof qn === 'string') {
            return qn;
          }
          if (qn && typeof qn === 'object' && qn.value) {
            return qn.value;
          }
          // Fallback for unexpected cases
          return String(qn);
        }) as string[],
      }),
      ...(filters.createdAfter && {
        'created-after': new Date(filters.createdAfter).toISOString(),
      }),
      ...(filters.createdBefore && {
        'created-before': new Date(filters.createdBefore).toISOString(),
      }),
    };

    const response: ListTasksResponse = await functions.listTasks(props.warehouseId, request);

    let filteredTasks = response.tasks || [];

    // Apply client-side filters for criteria not supported by API
    if (
      filters.scheduledAfter ||
      filters.scheduledBefore ||
      filters.taskId ||
      filters.parentTaskId
    ) {
      filteredTasks = filteredTasks.filter((task) => {
        // Filter by scheduled date range
        if (filters.scheduledAfter && task['scheduled-for']) {
          const scheduledDate = new Date(task['scheduled-for']);
          const afterDate = new Date(filters.scheduledAfter);
          if (scheduledDate < afterDate) return false;
        }

        if (filters.scheduledBefore && task['scheduled-for']) {
          const scheduledDate = new Date(task['scheduled-for']);
          const beforeDate = new Date(filters.scheduledBefore);
          if (scheduledDate > beforeDate) return false;
        }

        // Filter by task ID (partial match)
        if (
          filters.taskId &&
          !task['task-id'].toLowerCase().includes(filters.taskId.toLowerCase())
        ) {
          return false;
        }

        // Filter by parent task ID (exact match)
        if (filters.parentTaskId && task['parent-task-id'] !== filters.parentTaskId) {
          return false;
        }

        return true;
      });
    }

    if (isLoadingMore) {
      // If we were loading more data, append to existing tasks

      tasks.push(...filteredTasks);
    } else {
      // If this was a fresh load, replace all tasks
      tasks.splice(0, tasks.length, ...filteredTasks);
    }

    tasksNextPageToken.value = response['next-page-token'] || undefined;
    tasksLoading.value = false;
  } catch (error: any) {
    tasksLoading.value = false;
    hasError.value = true;

    // Handle different error types gracefully
    if (error?.response?.status === 404 || error?.isTaskManagementError) {
      const entityId = getEntityId();
      if (entityId) {
        const entityName = props.entityType === 'view' ? 'view' : 'table';
        errorMessage.value = `Task management is not available for this ${entityName}. This may be because:
• The ${entityName} does not support task operations
• Task features are not enabled for this ${entityName} type
• The ${entityName} ID format is not compatible with task management`;
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

  // For view context, ensure viewId is provided and valid
  if (props.entityType === 'view' && (!props.viewId || props.viewId.trim() === '')) {
    hasError.value = true;
    errorMessage.value = 'View ID is required to load view-specific tasks.';
    return;
  }

  await listTasks();

  // Initial preload based on default pagination setting
  const itemsPerPage = currentPaginationOptions.value.itemsPerPage;
  const targetMinimumItems = itemsPerPage * 2; // Always maintain 2x buffer

  if (tasksNextPageToken.value && tasks.length > 0 && tasks.length < targetMinimumItems) {
    await loadMoreTasks();
  }
});

// Expose refresh function for parent component
defineExpose({
  refreshTasks,
  listTasks,
});
</script>
