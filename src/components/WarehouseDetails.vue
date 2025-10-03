<template>
  <v-container fluid class="pa-6">
    <v-row>
      <!-- General Information Section -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="bg-surface-light d-flex align-center">
            <v-icon icon="mdi-information-outline" class="mr-2" color="primary"></v-icon>
            General Information
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Warehouse ID</div>
                <div class="d-flex align-center mt-2">
                  <v-chip size="small" variant="outlined" class="mr-2">{{ warehouse.id }}</v-chip>
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="flat"
                    @click="copyToClipboard(warehouse.id)"></v-btn>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Project ID</div>
                <div class="d-flex align-center mt-2">
                  <v-chip size="small" variant="outlined" class="mr-2">
                    {{ warehouse['project-id'] }}
                  </v-chip>
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="flat"
                    @click="copyToClipboard(warehouse['project-id'])"></v-btn>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Status</div>
                <div class="mt-2">
                  <v-chip
                    :color="warehouse.status === 'active' ? 'success' : 'warning'"
                    size="small">
                    {{ warehouse.status }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Delete Protection</div>
                <div class="mt-2">
                  <v-chip
                    :color="warehouse.protected ? 'error' : 'default'"
                    size="small"
                    :prepend-icon="warehouse.protected ? 'mdi-lock' : 'mdi-lock-open-outline'">
                    {{ warehouse.protected ? 'Enabled' : 'Disabled' }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Deletion Profile Section -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="bg-surface-light d-flex align-center">
            <v-icon icon="mdi-delete-outline" class="mr-2" color="error"></v-icon>
            Deletion Profile
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Type</div>
                <div class="mt-2">
                  <v-chip
                    :color="warehouse['delete-profile'].type === 'hard' ? 'error' : 'info'"
                    size="small">
                    {{ warehouse['delete-profile'].type }}
                  </v-chip>
                </div>
              </v-col>
              <v-col v-if="warehouse['delete-profile'].type === 'soft'" cols="12">
                <div class="text-overline text-medium-emphasis">Expiration</div>
                <div class="text-body-1 mt-2">
                  {{ formatSeconds(warehouse['delete-profile']['expiration-seconds']) }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Storage Profile Section -->
      <v-col cols="12" md="6">
        <!-- S3 Storage -->
        <v-card v-if="warehouse['storage-profile'].type === 's3'" variant="outlined">
          <v-card-title class="bg-surface-light d-flex align-center">
            <v-icon icon="mdi-aws" class="mr-2" color="orange"></v-icon>
            Amazon S3 Storage Configuration
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Bucket</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile'].bucket }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Key Prefix</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile']['key-prefix'] || '-' }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Region</div>
                <div class="mt-2">
                  <v-chip size="small" variant="tonal">
                    {{ warehouse['storage-profile'].region }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" v-if="warehouse['storage-profile'].endpoint">
                <div class="text-overline text-medium-emphasis">Endpoint</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile'].endpoint }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Assume Role ARN</div>
                <div class="text-body-2 text-mono mt-2">
                  {{ warehouse['storage-profile']['assume-role-arn'] || '-' }}
                </div>
              </v-col>
              <v-col cols="12" v-if="warehouse['storage-profile']['sts-enabled']">
                <div class="text-overline text-medium-emphasis">STS Role ARN</div>
                <div class="text-body-2 text-mono mt-2">
                  {{ warehouse['storage-profile']['sts-role-arn'] || '-' }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Path Style Access</div>
                <div class="mt-2">
                  <v-icon
                    :icon="
                      warehouse['storage-profile']['path-style-access']
                        ? 'mdi-check-circle'
                        : 'mdi-close-circle'
                    "
                    :color="
                      warehouse['storage-profile']['path-style-access'] ? 'success' : 'default'
                    "
                    size="small"></v-icon>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">STS Enabled</div>
                <div class="mt-2">
                  <v-icon
                    :icon="
                      warehouse['storage-profile']['sts-enabled']
                        ? 'mdi-check-circle'
                        : 'mdi-close-circle'
                    "
                    :color="warehouse['storage-profile']['sts-enabled'] ? 'success' : 'default'"
                    size="small"></v-icon>
                </div>
              </v-col>
              <v-col cols="12" v-if="warehouse['storage-profile'].flavor">
                <div class="text-overline text-medium-emphasis">Flavor</div>
                <div class="text-body-1 mt-2">{{ warehouse['storage-profile'].flavor }}</div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Alternative Protocols (s3a)</div>
                <div class="mt-2">
                  <v-icon
                    :icon="
                      warehouse['storage-profile']['allow-alternative-protocols']
                        ? 'mdi-check-circle'
                        : 'mdi-close-circle'
                    "
                    :color="
                      warehouse['storage-profile']['allow-alternative-protocols']
                        ? 'success'
                        : 'default'
                    "
                    size="small"></v-icon>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Azure ADLS Storage -->
        <v-card v-if="warehouse['storage-profile'].type === 'adls'" variant="outlined">
          <v-card-title class="bg-surface-light d-flex align-center">
            <v-icon icon="mdi-microsoft-azure" class="mr-2" color="blue"></v-icon>
            Azure Data Lake Storage Configuration
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Account Name</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile']['account-name'] }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Filesystem</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile'].filesystem }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Key Prefix</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile']['key-prefix'] || '-' }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- GCS Storage -->
        <v-card v-if="warehouse['storage-profile'].type === 'gcs'" variant="outlined">
          <v-card-title class="bg-surface-light d-flex align-center">
            <v-icon icon="mdi-google-cloud" class="mr-2" color="blue"></v-icon>
            Google Cloud Storage Configuration
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Bucket</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile'].bucket }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-overline text-medium-emphasis">Key Prefix</div>
                <div class="text-body-1 text-mono mt-2">
                  {{ warehouse['storage-profile']['key-prefix'] || '-' }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue';
import type { GetWarehouseResponse } from '@/gen/management/types.gen';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';

const props = defineProps<{
  warehouseId: string;
}>();

const functions = useFunctions();
const visual = useVisualStore();

const warehouse = reactive<GetWarehouseResponse>({
  'delete-profile': { type: 'hard' },
  id: '',
  name: '',
  'project-id': '',
  status: 'active',
  'storage-profile': {
    type: 's3',
    bucket: '',
    'key-prefix': '',
    'assume-role-arn': '',
    endpoint: '',
    region: '',
    'path-style-access': null,
    'sts-role-arn': '',
    'sts-enabled': false,
    flavor: undefined,
  },
  protected: false,
});

async function loadWarehouse() {
  try {
    const whResponse = await functions.getWarehouse(props.warehouseId);
    if (whResponse) {
      Object.assign(warehouse, whResponse);
      visual.wahrehouseName = whResponse.name;
      visual.whId = whResponse.id;
    }
  } catch (error) {
    console.error('Failed to load warehouse:', error);
  }
}

onMounted(loadWarehouse);
watch(() => props.warehouseId, loadWarehouse);

function copyToClipboard(text: string) {
  functions.copyToClipboard(text);
}

function formatSeconds(seconds?: number): string {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : `${seconds}s`;
}
</script>
