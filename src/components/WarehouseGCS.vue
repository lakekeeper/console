<template>
  <v-form @submit.prevent="handleSubmit">
    <v-radio-group v-model="credentialType" row>
      <v-row>
        <v-col>
          <span class="text-grey">Credential Type:</span>
        </v-col>
      </v-row>
      <v-row>
        <v-radio value="service-account-key" color="primary">
          <template #label>
            <div>
              <v-icon color="primary">mdi-account-key</v-icon>
              Service Account Key
            </div>
          </template>
        </v-radio>
        <v-radio value="gcp-system-identity" color="primary">
          <template #label>
            <div>
              <v-icon color="primary">mdi-key</v-icon>
              GCP System Identity
            </div>
          </template>
        </v-radio>
      </v-row>
    </v-radio-group>
    <!--Storage Credentials-->
    <span v-if="credentialType === 'service-account-key'">
      <v-switch
        v-model="useFileInput"
        :label="!useFileInput ? 'Enable File Input' : 'Enable Text Input'"></v-switch>

      <v-file-input
        v-if="useFileInput"
        accept="application/json"
        label="key.json"
        :rules="[rules.required]"
        @change="handleFileInput"></v-file-input>
      <v-textarea
        v-else
        v-model="keyString"
        label="GCS credentials key json"
        :rules="[rules.required, rules.validJson]"
        @update:model-value="verifyKeyJson"></v-textarea>
      <v-btn
        v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
        color="success"
        :disabled="!keyStringValid"
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
        v-model="warehouseObjectData['storage-profile'].bucket"
        label="Bucket"
        placeholder="my-bucket"
        :rules="[rules.required]"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key-prefix"
        placeholder="key-prefix"></v-text-field>

      <v-btn
        v-if="props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE"
        color="success"
        :disabled="
          (credentialType === 'service-account-key' && !keyStringValid) ||
          warehouseObjectData['storage-profile'].bucket == ''
        "
        type="submit">
        Submit
      </v-btn>
      <v-btn
        v-if="props.intent === Intent.UPDATE && props.objectType === ObjectType.STORAGE_PROFILE"
        color="success"
        :disabled="!warehouseObjectData['storage-profile'].bucket"
        @click="emitNewProfile">
        Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import {
  GcsCredential,
  GcsProfile,
  GcsServiceKey,
  StorageCredential,
  StorageProfile,
} from '@/gen/management/types.gen';
import { Intent, ObjectType } from '@/common/enums';
import { WarehousObject } from '@/common/interfaces';
import { ref, onMounted, reactive, Ref, watch } from 'vue';

const credentialType: Ref<'service-account-key' | 'gcp-system-identity'> =
  ref('service-account-key');

const keyString = ref('');
const keyStringValid = ref(false);
const useFileInput = ref(false);
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
const warehouseObjectData = reactive<{
  'storage-profile': GcsProfile & { type: string };
  'storage-credential': GcsCredential & { type: string };
}>({
  'storage-profile': {
    bucket: '',
    type: 'gcs',
  },
  'storage-credential': {
    'credential-type': 'service-account-key',
    key,
    type: 'gcs',
  },
});

watch(credentialType, (newValue) => {
  warehouseObjectData['storage-credential']['credential-type'] = newValue;
  if (newValue === 'service-account-key') {
    warehouseObjectData['storage-credential'] = {
      'credential-type': 'service-account-key',
      key,
      type: 'gcs',
    };
  } else if (newValue === 'gcp-system-identity') {
    warehouseObjectData['storage-credential'] = {
      'credential-type': 'gcp-system-identity',
      type: 'gcs',
    };
  }
});

const rules = {
  required: (value: any) => !!value || 'Required.',
  noSlash: (value: string) => !value.includes('/') || 'Cannot contain "/"',
  validJson: (value: string) => {
    try {
      JSON.parse(value);
      verifyKeyJson();
      return true;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return 'Invalid JSON';
    }
  },
};

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

const emitNewCredentials = () => {
  const credentials = {
    type: 'gcs',
    'credential-type': 'service-account-key',
    key:
      warehouseObjectData['storage-credential']['credential-type'] === 'service-account-key'
        ? warehouseObjectData['storage-credential'].key
        : undefined,
  } as StorageCredential;

  emit('updateCredentials', credentials);
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData['storage-profile'],
    credentials: {
      type: 'gcs',
      'credential-type': 'service-account-key',
      key:
        warehouseObjectData['storage-credential']['credential-type'] === 'service-account-key'
          ? warehouseObjectData['storage-credential'].key
          : undefined,
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit('updateProfile', newProfile);
};

onMounted(() => {
  if (props.warehouseObject) Object.assign(warehouseObjectData, props.warehouseObject);
});

function handleFileInput(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target && e.target.result) {
          const json = JSON.parse(e.target.result as string);

          if (
            warehouseObjectData['storage-credential']['credential-type'] === 'service-account-key'
          ) {
            warehouseObjectData['storage-credential'].key = json;
          }
          keyStringValid.value = true;
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  }
}

function verifyKeyJson() {
  try {
    if (keyString.value !== '') {
      const keyJson = JSON.parse(keyString.value);

      if (warehouseObjectData['storage-credential']['credential-type'] === 'service-account-key') {
        warehouseObjectData['storage-credential'].key = keyJson;
      }
      keyStringValid.value = true;
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
}
</script>
