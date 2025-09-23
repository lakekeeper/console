<template>
  <v-card v-if="task">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      Task Details
      <v-spacer></v-spacer>
      <v-chip :color="getStatusColor(task.status)" size="small" variant="flat">
        {{ task.status }}
      </v-chip>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pa-0">
      <!-- Basic Task Information -->
      <v-list density="compact">
        <v-list-subheader>
          <v-icon class="mr-2" size="small">mdi-clipboard-text-outline</v-icon>
          Basic Information
        </v-list-subheader>

        <v-list-item>
          <v-list-item-title>Task ID</v-list-item-title>
          <v-list-item-subtitle class="d-flex align-center">
            <span class="mr-2 font-mono">{{ task['task-id'] }}</span>
            <v-btn
              icon="mdi-content-copy"
              size="small"
              variant="flat"
              @click="$emit('copy', task['task-id'])"></v-btn>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Queue</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip size="small" variant="outlined">
              {{ formatQueueName(task['queue-name']) }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Progress</v-list-item-title>
          <v-list-item-subtitle>
            <div class="d-flex align-center">
              <v-progress-linear
                :model-value="task.progress * 100"
                :color="getStatusColor(task.status)"
                height="6"
                rounded
                class="mr-2"
                style="width: 200px"></v-progress-linear>
              <span>{{ Math.round(task.progress * 100) }}%</span>
            </div>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Attempt</v-list-item-title>
          <v-list-item-subtitle>{{ task.attempt }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Warehouse ID</v-list-item-title>
          <v-list-item-subtitle class="d-flex align-center">
            <span class="mr-2 font-mono">{{ task['warehouse-id'] }}</span>
            <v-btn
              icon="mdi-content-copy"
              size="small"
              variant="flat"
              @click="$emit('copy', task['warehouse-id'])"></v-btn>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="task['parent-task-id']">
          <v-list-item-title>Parent Task ID</v-list-item-title>
          <v-list-item-subtitle class="d-flex align-center">
            <span class="mr-2 font-mono">{{ task['parent-task-id'] }}</span>
            <v-btn
              icon="mdi-content-copy"
              size="small"
              variant="flat"
              @click="$emit('copy', task['parent-task-id'])"></v-btn>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <!-- Entity Information -->
      <v-list v-if="task.entity" density="compact">
        <v-list-subheader>
          <v-icon class="mr-2" size="small">mdi-table</v-icon>
          Entity Information
        </v-list-subheader>

        <v-list-item>
          <v-list-item-title>Entity Type</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip size="small" variant="tonal" :color="getEntityTypeColor(task.entity.type)">
              <v-icon start :icon="getEntityTypeIcon(task.entity.type)"></v-icon>
              {{ task.entity.type.toUpperCase() }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="task.entity['table-id']">
          <v-list-item-title>
            {{ task.entity.type.charAt(0).toUpperCase() + task.entity.type.slice(1) }} ID
          </v-list-item-title>
          <v-list-item-subtitle class="d-flex align-center">
            <span class="mr-2 font-mono">{{ task.entity['table-id'] }}</span>
            <v-btn
              icon="mdi-content-copy"
              size="small"
              variant="flat"
              @click="$emit('copy', task.entity['table-id'])"></v-btn>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="task['entity-name'] && task['entity-name'].length > 0">
          <v-list-item-title>Entity Name</v-list-item-title>
          <v-list-item-subtitle>
            <span class="font-mono">{{ formatEntityName(task['entity-name']) }}</span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <!-- Timing Information -->
      <v-list density="compact">
        <v-list-subheader>
          <v-icon class="mr-2" size="small">mdi-clock-outline</v-icon>
          Timing Information
        </v-list-subheader>

        <v-list-item>
          <v-list-item-title>Created At</v-list-item-title>
          <v-list-item-subtitle>{{ formatDateTime(task['created-at']) }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Scheduled For</v-list-item-title>
          <v-list-item-subtitle>
            <div class="d-flex align-center">
              <span>{{ formatDateTime(task['scheduled-for']) }}</span>
              <v-chip
                v-if="isOverdue(task['scheduled-for']) && task.status === 'SCHEDULED'"
                size="x-small"
                color="warning"
                variant="flat"
                class="ml-2">
                OVERDUE
              </v-chip>
            </div>
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="task['picked-up-at']">
          <v-list-item-title>Picked Up At</v-list-item-title>
          <v-list-item-subtitle>{{ formatDateTime(task['picked-up-at']) }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="task['last-heartbeat-at']">
          <v-list-item-title>Last Heartbeat At</v-list-item-title>
          <v-list-item-subtitle>
            {{ formatDateTime(task['last-heartbeat-at']) }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="task['updated-at']">
          <v-list-item-title>Updated At</v-list-item-title>
          <v-list-item-subtitle>{{ formatDateTime(task['updated-at']) }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <!-- Task Data -->
      <div v-if="task['task-data']" class="pa-4">
        <v-card-subtitle class="px-0 pb-2">
          <v-icon class="mr-2" size="small">mdi-code-json</v-icon>
          Task Data
        </v-card-subtitle>

        <v-card variant="outlined" density="compact">
          <v-card-text>
            <div class="task-data-display">
              <div v-for="(value, key) in task['task-data']" :key="key" class="task-data-item">
                <span class="task-data-key">{{ key }}:</span>
                <span class="task-data-value">{{ formatTaskDataValue(value) }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Execution Details -->
      <div v-if="task['execution-details']" class="pa-4">
        <v-card-subtitle class="px-0 pb-2">
          <v-icon class="mr-2" size="small">mdi-cog-outline</v-icon>
          Execution Details
        </v-card-subtitle>

        <v-card variant="outlined" density="compact">
          <v-card-text>
            <pre class="text-caption execution-details">{{
              JSON.stringify(task['execution-details'], null, 2)
            }}</pre>
          </v-card-text>
        </v-card>
      </div>

      <!-- Task Attempts History -->
      <div v-if="task.attempts && task.attempts.length > 0" class="pa-4">
        <v-card-subtitle class="px-0 pb-2">
          <v-icon class="mr-2" size="small">mdi-history</v-icon>
          Attempt History ({{ task.attempts.length }})
        </v-card-subtitle>

        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="attempt in task.attempts"
            :key="attempt.attempt"
            :title="`Attempt ${attempt.attempt}`">
            <template #title>
              <div class="d-flex align-center">
                <v-chip
                  :color="getStatusColor(attempt.status)"
                  size="small"
                  variant="flat"
                  class="mr-2">
                  {{ attempt.status }}
                </v-chip>
                <span>Attempt {{ attempt.attempt }}</span>
                <v-spacer></v-spacer>
                <span class="text-caption">{{ formatDateTime(attempt['created-at']) }}</span>
              </div>
            </template>

            <template #text>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Progress</v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex align-center">
                      <v-progress-linear
                        :model-value="attempt.progress * 100"
                        :color="getStatusColor(attempt.status)"
                        height="6"
                        rounded
                        class="mr-2"
                        style="width: 200px"></v-progress-linear>
                      <span>{{ Math.round(attempt.progress * 100) }}%</span>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Created At</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDateTime(attempt['created-at']) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Scheduled For</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDateTime(attempt['scheduled-for']) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="attempt['started-at']">
                  <v-list-item-title>Started At</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDateTime(attempt['started-at']) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="attempt.duration">
                  <v-list-item-title>Duration</v-list-item-title>
                  <v-list-item-subtitle>{{ attempt.duration }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="attempt.message">
                  <v-list-item-title>Message</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-card variant="outlined" density="compact">
                      <v-card-text class="text-caption">{{ attempt.message }}</v-card-text>
                    </v-card>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="attempt['execution-details']">
                  <v-list-item-title>Execution Details</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-card variant="outlined" density="compact">
                      <v-card-text>
                        <pre class="text-caption">{{
                          JSON.stringify(attempt['execution-details'], null, 2)
                        }}</pre>
                      </v-card-text>
                    </v-card>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { GetTaskDetailsResponse } from '@/gen/management/types.gen';
import { getStatusColor, formatDateTime } from '@/common/taskUtils';

// Props
interface Props {
  task: GetTaskDetailsResponse | null;
  formatQueueName?: (queueName: string) => string;
}

withDefaults(defineProps<Props>(), {
  formatQueueName: (queueName: string) =>
    queueName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
});

// Emits
defineEmits<{
  copy: [text: string];
}>();

// Helper functions
function getEntityTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'table':
      return 'blue';
    case 'view':
      return 'purple';
    case 'namespace':
      return 'green';
    default:
      return 'grey';
  }
}

function getEntityTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'table':
      return 'mdi-table';
    case 'view':
      return 'mdi-eye-outline';
    case 'namespace':
      return 'mdi-folder-outline';
    default:
      return 'mdi-file-outline';
  }
}

function isOverdue(scheduledFor: string): boolean {
  if (!scheduledFor) return false;
  try {
    const scheduledDate = new Date(scheduledFor);
    const now = new Date();
    return scheduledDate < now;
  } catch {
    return false;
  }
}

function formatEntityName(entityName: string[]): string {
  if (!entityName || entityName.length === 0) return '';
  return entityName.map((name) => `"${name}"`).join('.');
}

function formatTaskDataValue(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  return JSON.stringify(value);
}
</script>

<style scoped>
.font-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

.task-data-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-data-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-data-key {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  min-width: 120px;
  font-size: 0.875rem;
}

.task-data-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;

  padding: 2px 6px;
  border-radius: 4px;
}

.execution-details {
  max-height: 300px;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 12px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
