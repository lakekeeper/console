<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <span>
      <v-btn
        v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
        color="success"
        :disabled="warehouseObjectData['storage-credential'].key == ''"
        @click="emitNewCredentials">
        Update Credentials
      </v-btn>
    </span>

    <v-divider></v-divider>

    <!--Storage Profile-->

    <div
      v-if="
        props.objectType === ObjectType.STORAGE_PROFILE ||
        (props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE)
      ">
      <v-text-field
        v-model="warehouseObjectData['storage-profile'].url"
        label="URL"
        placeholder="hdfs url://hdfs-host:port"
        :rules="[rules.required]"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key-prefix"
        placeholder="key-prefix"></v-text-field>

      <!-- Config Section -->
      <div class="mt-4">
        <div class="text-h6">Additional HDFS configuration</div>
        <v-row
          dense
          v-for="(key, index) in Object.keys(warehouseObjectData['storage-profile'].config || {})"
          :key="index">
          <v-col cols="5">
            <v-text-field
              v-model="configKeys[index]"
              label="Key"
              placeholder="e.g., dfs.replication"
              @input="updateConfigKey(index, $event)"></v-text-field>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="(warehouseObjectData['storage-profile'].config ?? {})[key]"
              label="Value"
              placeholder="e.g., value"></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-btn icon @click="removeConfig(index)" size="small">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <v-btn
          density="compact"
          icon="mdi-plus"
          @click="addConfig"
          class="mb-4"
          color="info"></v-btn>
      </div>
      <v-divider></v-divider>
      <v-btn
        v-if="props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE"
        color="success"
        :disabled="
          warehouseObjectData['storage-credential'].key == '' ||
          warehouseObjectData['storage-profile'].url == ''
        "
        type="submit"
        class="mt-4">
        Submit
      </v-btn>
      <v-btn
        v-if="props.intent === Intent.UPDATE && props.objectType === ObjectType.STORAGE_PROFILE"
        color="success"
        :disabled="!warehouseObjectData['storage-profile'].url"
        @click="emitNewProfile">
        Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import {
  HdfsCredential,
  HdfsProfile,
  StorageCredential,
  StorageProfile,
} from '@/gen/management/types.gen';
import { Intent, ObjectType } from '@/common/enums';
import { WarehousObject } from '@/common/interfaces';
import { onMounted, reactive, ref } from 'vue';

const props = defineProps<{
  credentialsOnly: boolean;
  intent: Intent;
  objectType: ObjectType;
  warehouseObject: WarehousObject | null;
}>();

const emit = defineEmits<{
  (e: 'submit', warehouseObjectDataEmit: WarehousObject): void;
  (e: 'updateCredentials', credentials: StorageCredential): void;
  (
    e: 'updateProfile',
    newProfile: { profile: StorageProfile; credentials: StorageCredential },
  ): void;
}>();

const configKeys = ref<string[]>([]);

const warehouseObjectData = reactive<{
  'storage-profile': HdfsProfile & { type: string };
  'storage-credential': HdfsCredential & { type: string };
}>({
  'storage-profile': { type: 'hdfs', url: '', 'key-prefix': '' },
  'storage-credential': { type: 'hdfs', key: '' },
});

const rules = {
  required: (value: any) => !!value || 'Required.',
  noSlash: (value: string) => !value.includes('/') || 'Cannot contain "/"',
};

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

const emitNewCredentials = () => {
  const credentials = {
    type: 'hdfs',
    key: warehouseObjectData['storage-credential'].key,
  } as StorageCredential;

  emit('updateCredentials', credentials);
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData['storage-profile'],
    credentials: {
      type: 'hdfs',
      key: warehouseObjectData['storage-credential'].key,
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit('updateProfile', newProfile);
};
const addConfig = () => {
  const newKey = `key-${configKeys.value.length}`;
  configKeys.value.push(newKey);
  warehouseObjectData['storage-profile'].config![newKey] = '';
};

const removeConfig = (index: number) => {
  const keyToRemove = configKeys.value[index];
  delete warehouseObjectData['storage-profile'].config![keyToRemove];
  configKeys.value.splice(index, 1);
};

const updateConfigKey = (index: number, newKey: string) => {
  const oldKey = configKeys.value[index];
  const value = warehouseObjectData['storage-profile'].config![oldKey];
  delete warehouseObjectData['storage-profile'].config![oldKey];
  configKeys.value[index] = newKey;
  warehouseObjectData['storage-profile'].config![newKey] = value;
};
onMounted(() => {
  if (props.warehouseObject) {
    Object.assign(warehouseObjectData, props.warehouseObject);
  }
  // Ensure 'config' is initialized
  if (!warehouseObjectData['storage-profile'].config) {
    warehouseObjectData['storage-profile'].config = {};
  }
});
</script>
