<template>
  <v-dialog v-model="isDialogActive" max-width="850">
    <template #activator="{ props: activatorProps }">
      <v-list-item
        v-bind="activatorProps"
        v-if="creatingWarehouse || props.objectType === ObjectType.WAREHOUSE">
        <v-list-item-title>
          <v-btn color="info" size="small" text="Add Warehouse" variant="flat"></v-btn>
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        prepend-icon="mdi-key-change"
        v-bind="activatorProps"
        v-else-if="props.objectType === ObjectType.STORAGE_CREDENTIAL">
        <v-list-item-title>
          <span class="text-subtitle-2" v-bind="activatorProps">Update Credentials</span>
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        prepend-icon="mdi-playlist-edit"
        v-bind="activatorProps"
        v-else-if="props.objectType === ObjectType.STORAGE_PROFILE">
        <v-list-item-title>
          <span class="text-subtitle-2">Update Profile</span>
        </v-list-item-title>
      </v-list-item>

      <v-list-item
        prepend-icon="mdi-update"
        v-bind="activatorProps"
        v-else-if="props.objectType === ObjectType.DELETION_PROFILE">
        <v-list-item-title>
          <span class="text-subtitle-2">Change Deletion</span>
        </v-list-item-title>
      </v-list-item>
    </template>
    <v-card style="max-height: 90vh; overflow-y: auto">
      <v-card-title v-if="props.objectType === ObjectType.WAREHOUSE">
        Add new warehouse
      </v-card-title>
      <v-card-title v-else>Updating Warehouse</v-card-title>
      <span v-if="creatingWarehouse || props.processStatus == 'running'">
        <v-card-text style="min-height: 25vh">
          <v-row justify="center">
            <v-progress-circular
              class="mt-4"
              color="info"
              indeterminate
              :size="126"></v-progress-circular>
          </v-row>
        </v-card-text>
      </span>
      <span v-else-if="creatingWarehouse || props.processStatus == 'success'">
        <v-card-text style="min-height: 25vh">
          <v-row class="mt-6" justify="center">
            <div v-if="props.objectType == ObjectType.STORAGE_PROFILE" class="text-h4">
              Your Warehouse Profile was successfully updated!
            </div>
            <div v-else class="text-h4">Your Credentials were successfully updated!</div>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            @click="
              isDialogActive = false;
              $emit('close');
            ">
            Close
          </v-btn>
        </v-card-actions>
      </span>
      <span v-else>
        <v-card-text>
          <v-form>
            <v-text-field
              v-if="emptyWarehouse"
              v-model="warehouseName"
              label="Warehouse Name"
              placeholder="my-warehouse"
              :rules="[rules.required, rules.noSlash]"></v-text-field>
            <v-row justify="center">
              <v-col
                v-if="
                  props.objectType === ObjectType.WAREHOUSE ||
                  props.objectType === ObjectType.DELETION_PROFILE
                ">
                <v-switch
                  v-model="delProfileSoftActive"
                  color="primary"
                  :label="
                    delProfileSoftActive ? `Soft Deletion is enabled` : `Enable Soft Deletion`
                  "></v-switch>
              </v-col>
              <v-col class="d-flex justify-center">
                <v-slider
                  v-if="delProfileSoftActive"
                  v-model="slider"
                  class="align-center"
                  hide-details
                  label="Define number of Days"
                  :max="max"
                  :min="min"
                  :step="1">
                  <template #append>
                    <v-text-field
                      v-model="slider"
                      density="compact"
                      hide-details
                      single-line
                      style="width: 100px"
                      type="number"></v-text-field>
                  </template>
                </v-slider>
              </v-col>
            </v-row>
            <v-row v-if="props.objectType === ObjectType.DELETION_PROFILE">
              <v-col>
                <v-btn
                  color="success"
                  :disabled="
                    slider === loadedDeltionSeconds &&
                    delProfileSoftActive === loadedDelProfileSoftActive
                  "
                  @click="emitDeletionProfile">
                  Change Deletion
                </v-btn>
              </v-col>
            </v-row>
            <span v-if="props.objectType !== ObjectType.DELETION_PROFILE">
              <v-container fluid>
                <v-radio-group v-model="storageCredentialType" row>
                  <v-row>
                    <v-col v-for="(type, i) in storageCredentialTypes" :key="i">
                      <div>
                        <v-radio
                          :key="i"
                          v-model="storageCredentialType"
                          color="primary"
                          :disabled="!emptyWarehouse"
                          :value="type">
                          <template #label>
                            <div>
                              <v-icon v-if="type === 'S3'" color="primary" size="x-large">
                                mdi-aws
                              </v-icon>
                              <v-icon v-if="type === 'GCS'" color="primary" size="x-large">
                                mdi-google-cloud
                              </v-icon>
                              <v-icon v-if="type === 'AZURE'" color="primary" size="x-large">
                                mdi-microsoft-azure
                              </v-icon>
                              <v-icon v-if="type === 'JSON'" color="primary" size="x-large">
                                mdi-code-json
                              </v-icon>
                              {{ type }}
                            </div>
                          </template>
                        </v-radio>
                      </div>
                    </v-col>
                  </v-row>
                </v-radio-group>
              </v-container>

              <!--v-select
                :disabled="!emptyWarehouse"
                v-model="storageCredentialType"
                :items="storageCredentialTypes"
                label="Storage Type"
                :rules="[rules.required]"
              ></v-select-->

              <div v-if="storageCredentialType === 'S3'">
                <WarehouseS3
                  :credentials-only="emptyWarehouse"
                  :intent="intent"
                  :object-type="objectType"
                  :warehouse-object="warehouseObjectS3"
                  @submit="createWarehouse"
                  @update-credentials="newCredentials"
                  @update-profile="newProfile"></WarehouseS3>
              </div>

              <div v-if="storageCredentialType === 'AZURE'">
                <WarehouseAzure
                  :credentials-only="emptyWarehouse"
                  :intent="intent"
                  :object-type="objectType"
                  :warehouse-object="warehouseObjectAz"
                  @submit="createWarehouse"
                  @update-credentials="newCredentials"
                  @update-profile="newProfile"></WarehouseAzure>
              </div>

              <div v-if="storageCredentialType === 'GCS'">
                <WarehouseGCS
                  :credentials-only="emptyWarehouse"
                  :intent="intent"
                  :object-type="objectType"
                  :warehouse-object="warehouseObjectGCS"
                  @submit="createWarehouse"
                  @update-credentials="newCredentials"
                  @update-profile="newProfile"></WarehouseGCS>
              </div>
              <div v-if="storageCredentialType === 'JSON'">
                <WarehouseJSON
                  :credentials-only="emptyWarehouse"
                  :intent="intent"
                  :object-type="objectType"
                  :warehouse-object="warehouseObjectGCS"
                  @submit="createWarehouse"></WarehouseJSON>
              </div>
            </span>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="error"
            @click="
              isDialogActive = false;
              $emit('cancel');
            ">
            Cancel
          </v-btn>
        </v-card-actions>
      </span>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { useFunctions } from '../plugins/functions';

import { useVisualStore } from '../stores/visual';

import {
  CreateWarehouseRequest,
  GcsServiceKey,
  GetWarehouseResponse,
  StorageCredential,
  StorageProfile,
  TabularDeleteProfile,
} from '../gen/management/types.gen';
import { Intent, ObjectType } from '../common/enums';
import { WarehousObject } from '@/common/interfaces';

const visual = useVisualStore();
const projectId = computed(() => {
  return visual.projectSelected['project-id'];
});

const creatingWarehouse = ref(false);
const loadedDeltionSeconds = ref(0);
const loadedDelProfileSoftActive = ref(false);

const delProfileSoftActive = ref(false);
const isDialogActive = ref(false);

const emit = defineEmits<{
  (e: 'addedWarehouse'): void;
  (e: 'cancel'): void;
  (e: 'close'): void;
  (e: 'updateCredentials', credentials: StorageCredential): void;
  (
    e: 'updateProfile',
    newProfile: { profile: StorageProfile; credentials: StorageCredential },
  ): void;
  (e: 'updateDeletionProfile', profile: TabularDeleteProfile): void;
}>();

const props = defineProps<{
  warehouse: GetWarehouseResponse | undefined;
  intent: Intent;
  objectType: ObjectType;
  processStatus: string;
}>();

const min = ref(0);
const max = ref(90);
const slider = ref(7);

const storageCredentialTypes = ref(['S3', 'GCS', 'AZURE', 'JSON']);
const storageCredentialType = ref('');
const warehouseName = ref('');
const functions = useFunctions();
const rules = {
  required: (value: any) => !!value || 'Required.',
  noSlash: (value: string) => !value.includes('/') || 'Cannot contain "/"',
};

const emptyWarehouse = ref(true);
const warehouseObjectS3 = reactive<WarehousObject>({
  'storage-profile': {
    type: 's3',
    bucket: '',
    region: '',
    'sts-enabled': false,
  },
  'storage-credential': {
    type: 's3',
    'aws-access-key-id': '',
    'aws-secret-access-key': '',
    'credential-type': 'access-key',
  },
});

const key = reactive<GcsServiceKey>({
  auth_provider_x509_cert_url: '',
  auth_uri: '',
  client_email: '',
  client_id: '',
  client_x509_cert_url: '',
  private_key: '',
  private_key_id: '',
  project_id: '',
  token_uri: '',
  type: '',
  universe_domain: '',
});
const warehouseObjectGCS = reactive<WarehousObject>({
  'storage-profile': {
    type: 'gcs',
    bucket: '',
  },
  'storage-credential': {
    type: 'gcs',
    'credential-type': 'service-account-key',
    key,
  },
});

const warehouseObjectAz = reactive<WarehousObject>({
  'storage-profile': {
    'account-name': '',
    filesystem: '',
    type: 'adls',
  },
  'storage-credential': {
    'client-id': '',
    'client-secret': '',
    'credential-type': 'client-credentials',
    'tenant-id': '',
    type: 'az',
  },
});

async function createWarehouse(warehouseObject: WarehousObject) {
  try {
    if (warehouseObject['storage-profile'].type === 'gcs')
      Object.assign(warehouseObjectGCS, warehouseObject);
    if (warehouseObject['storage-profile'].type === 's3')
      Object.assign(warehouseObjectS3, warehouseObject);
    if (warehouseObject['storage-profile'].type === 'az')
      Object.assign(warehouseObjectAz, warehouseObject);

    creatingWarehouse.value = true;

    const delProfileSoft = reactive<TabularDeleteProfile>({
      type: 'soft',
      'expiration-seconds': Math.round(slider.value * 86400),
    });

    const delProfileHard = reactive<TabularDeleteProfile>({
      type: 'hard',
    });

    const delProfile = computed(() => {
      return delProfileSoftActive.value ? delProfileSoft : delProfileHard;
    });

    const wh = reactive<CreateWarehouseRequest>({
      'delete-profile': delProfile.value,
      'warehouse-name': warehouseName.value,
      'project-id': projectId.value,
      'storage-credential': warehouseObject['storage-credential'] as StorageCredential,
      'storage-profile': warehouseObject['storage-profile'] as StorageProfile,
    });

    const res: any = await functions.createWarehouse(wh);

    if (res.status === 400) throw new Error(res.message);

    emit('addedWarehouse');
    creatingWarehouse.value = false;
    isDialogActive.value = false;
  } catch (error) {
    creatingWarehouse.value = false;

    console.error(error);
  }
}

function emitDeletionProfile() {
  const delProfileSoft = reactive<TabularDeleteProfile>({
    type: 'soft',
    'expiration-seconds': Math.round(slider.value * 86400),
  });

  const delProfileHard = reactive<TabularDeleteProfile>({
    type: 'hard',
  });

  const delProfile = computed(() => {
    return delProfileSoftActive.value ? delProfileSoft : delProfileHard;
  });

  emit('updateDeletionProfile', delProfile.value);
}

function newCredentials(credentials: StorageCredential) {
  emit('updateCredentials', credentials);
}

function newProfile(item: { profile: StorageProfile; credentials: StorageCredential }) {
  emit('updateProfile', item);
}

onMounted(() => {
  if (props.warehouse) {
    emptyWarehouse.value = false;
    if (props.warehouse['storage-profile'].type === 's3') {
      storageCredentialType.value = 'S3';
      Object.assign(warehouseObjectS3, props.warehouse);
    }

    if (props.warehouse['storage-profile'].type === 'adls') {
      storageCredentialType.value = 'AZURE';
      Object.assign(warehouseObjectAz, props.warehouse);
    }

    if (props.warehouse['storage-profile'].type === 'gcs') {
      storageCredentialType.value = 'GCS';
      Object.assign(warehouseObjectGCS, props.warehouse);
    }
    if (
      props.objectType === ObjectType.DELETION_PROFILE &&
      props.warehouse['delete-profile'].type === 'soft'
    ) {
      slider.value = Math.round(props.warehouse['delete-profile']['expiration-seconds'] / 86400);
      loadedDeltionSeconds.value = slider.value;

      delProfileSoftActive.value = true;
    }
    loadedDelProfileSoftActive.value = delProfileSoftActive.value;
  }
});

watch(
  () => props.processStatus,
  (old, newVal) => {
    if (newVal === 'success') {
      isDialogActive.value = false;
      emit('cancel');
    }
  },
  {
    immediate: true,
  },
);
</script>
