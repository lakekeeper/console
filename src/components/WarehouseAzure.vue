<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <v-text-field
      v-model="warehouseObjectData['storage-credential']['client-id']"
      label="client-id"
      placeholder=""
      :rules="[rules.required]"></v-text-field>

    <v-text-field
      v-model="warehouseObjectData['storage-credential']['client-secret']"
      :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
      autocomplete="current-password"
      label="client-secret"
      placeholder="your-client-secret-"
      :rules="[rules.required]"
      :type="showPassword ? 'text' : 'password'"
      @click:append-inner="showPassword = !showPassword"></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential']['tenant-id']"
      label="tenant-id"
      placeholder=""
      :rules="[rules.required]"></v-text-field>

    <v-btn
      v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
      color="success"
      :disabled="
        !warehouseObjectData['storage-credential']['client-id'] ||
        !warehouseObjectData['storage-credential']['client-secret'] ||
        !warehouseObjectData['storage-credential']['tenant-id']
      "
      @click="emitNewCredentials">
      Update Credentials
    </v-btn>

    <v-divider></v-divider>
    <!--Storage Profile-->

    <div
      v-if="
        props.objectType === ObjectType.STORAGE_PROFILE ||
        (props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE)
      ">
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['account-name']"
        label="account-name"
        placeholder="my-account"
        :rules="[rules.required]"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['filesystem']"
        label="Filesystem"
        placeholder="my-filesystem"
        :rules="[rules.required, rules.noSlash]"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key Prefix"
        placeholder="path/to/warehouse"></v-text-field>

      <v-btn
        v-if="props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE"
        color="success"
        type="submit">
        Submit
      </v-btn>
      <v-btn
        v-if="props.intent === Intent.UPDATE && props.objectType === ObjectType.STORAGE_PROFILE"
        color="success"
        :disabled="
          !warehouseObjectData['storage-profile']['account-name'] ||
          !warehouseObjectData['storage-profile']['filesystem']
        "
        @click="emitNewProfile">
        Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import {
  AdlsProfile,
  AzCredential,
  StorageCredential,
  StorageProfile,
} from '@/gen/management/types.gen';
import { Intent, ObjectType } from '@/common/enums';
import { WarehousObject } from '@/common/interfaces';

const showPassword = ref(false);

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

const warehouseObjectData = reactive<{
  'storage-profile': AdlsProfile & { type: string };
  'storage-credential': AzCredential & { type: string };
}>({
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

const rules = {
  required: (value: any) => !!value || 'Required.',
  noSlash: (value: string) => !value.includes('/') || 'Cannot contain "/"',
};

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

const emitNewCredentials = () => {
  const credentials = {
    type: 'az',
    'credential-type': warehouseObjectData['storage-credential']['credential-type'],
    'client-id': warehouseObjectData['storage-credential']['client-id'],
    'client-secret': warehouseObjectData['storage-credential']['client-secret'],
    'tenant-id': warehouseObjectData['storage-credential']['tenant-id'],
  } as StorageCredential;

  emit('updateCredentials', credentials);
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData['storage-profile'],
    credentials: {
      type: 'az',
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit('updateProfile', newProfile);
};

onMounted(() => {
  if (props.warehouseObject) Object.assign(warehouseObjectData, props.warehouseObject);
});
</script>
