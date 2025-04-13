<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Credential Type Selection-->
    <v-divider />

    <v-container fluid>
      <v-radio-group v-model="credentialType" row>
        <v-row>
          <v-col>
            <span class="text-grey">Credential Type:</span>
          </v-col>
        </v-row>
        <v-row>
          <v-radio value="client-credentials" color="primary">
            <template #label>
              <div>
                <v-icon color="primary">mdi-account-key</v-icon>
                Client Credentials
              </div>
            </template>
          </v-radio>
          <v-radio value="shared-access-key" color="primary">
            <template #label>
              <div>
                <v-icon color="primary">mdi-key</v-icon>
                Shared Access Key
              </div>
            </template>
          </v-radio>
          <v-radio value="azure-system-identity" color="primary">
            <template #label>
              <div>
                <v-icon color="primary">mdi-shield-key</v-icon>
                Aazure System Identity
              </div>
            </template>
          </v-radio>
        </v-row>
      </v-radio-group>
    </v-container>
    <!--Storage Credentials-->

    <template v-if="isClientCredentials(warehouseObjectData['storage-credential'])">
      <v-text-field
        v-model="warehouseObjectData['storage-credential']['client-id']"
        label="client-id"
        placeholder=""
        :rules="[rules.required]" />

      <v-text-field
        v-model="warehouseObjectData['storage-credential']['client-secret']"
        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
        autocomplete="current-password"
        label="client-secret"
        placeholder="your-client-secret-"
        :rules="[rules.required]"
        :type="showPassword ? 'text' : 'password'"
        @click:append-inner="showPassword = !showPassword" />
      <v-text-field
        v-model="warehouseObjectData['storage-credential']['tenant-id']"
        label="tenant-id"
        placeholder=""
        :rules="[rules.required]" />

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
    </template>

    <template v-else-if="isSharedAccessKey(warehouseObjectData['storage-credential'])">
      <v-text-field
        v-model="warehouseObjectData['storage-credential']['key']"
        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
        label="Shared Access Key"
        placeholder="your-access-key"
        :rules="[rules.required]"
        :type="showPassword ? 'text' : 'password'"
        @click:append-inner="showPassword = !showPassword" />
      <v-btn
        v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
        color="success"
        :disabled="!warehouseObjectData['storage-credential']['key']"
        @click="emitNewCredentials">
        Update Credentials
      </v-btn>
    </template>

    <template v-else-if="isAzureSystemIdentityKey(warehouseObjectData['storage-credential'])">
      <v-btn
        v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
        color="success"
        @click="emitNewCredentials">
        Update Credentials
      </v-btn>
    </template>

    <v-divider />
    <!--    Storage Profile-->
    <div class="mt-6 mb-6">Storage Profile</div>
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
        v-model="warehouseObjectData['storage-profile']['host']"
        label="host"
        placeholder="dfs.core.windows.net"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key Prefix"
        placeholder="path/to/warehouse"></v-text-field>
      <v-row>
        <v-col cols="6">
          <v-text-field
            v-model="warehouseObjectData['storage-profile']['sas-token-validity-seconds']"
            label="SAS Token Validity (seconds)"
            placeholder="3600"
            hint="This field is optional."
            type="number"></v-text-field>
        </v-col>
        <v-col class="auto">
          <v-switch
            v-model="warehouseObjectData['storage-profile']['allow-alternative-protocols']"
            color="primary"
            class="mb-4"
            :label="
              warehouseObjectData['storage-profile']['allow-alternative-protocols']
                ? 'Alternative Protocols enabled'
                : 'Default Protocol is used'
            "></v-switch>
        </v-col>
      </v-row>

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
          !warehouseObjectData['storage-profile']['filesystem'] ||
          (isClientCredentials(warehouseObjectData['storage-credential']) &&
            (!warehouseObjectData['storage-credential']['client-id'] ||
              !warehouseObjectData['storage-credential']['client-secret'] ||
              !warehouseObjectData['storage-credential']['tenant-id'])) ||
          (isSharedAccessKey(warehouseObjectData['storage-credential']) &&
            !warehouseObjectData['storage-credential']['key'])
        "
        @click="emitNewProfile">
        Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch, Ref } from 'vue';
import {
  AdlsProfile,
  AzCredential,
  StorageCredential,
  StorageProfile,
} from '@/gen/management/types.gen';
import { Intent, ObjectType } from '@/common/enums';
import { WarehousObject } from '@/common/interfaces';

const showPassword = ref(false);
const credentialType: Ref<'client-credentials' | 'shared-access-key' | 'azure-system-identity'> =
  ref('client-credentials');

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

watch(credentialType, (newValue) => {
  warehouseObjectData['storage-credential']['credential-type'] = newValue;
  if (newValue === 'client-credentials') {
    warehouseObjectData['storage-credential'] = {
      'client-id': '',
      'client-secret': '',
      'credential-type': 'client-credentials',
      'tenant-id': '',

      type: 'az',
    };
  } else if (newValue === 'shared-access-key') {
    warehouseObjectData['storage-credential'] = {
      'credential-type': 'shared-access-key',
      key: '',
      type: 'az',
    };
  }
});

function isClientCredentials(credential: AzCredential): credential is {
  'client-id': string;
  'client-secret': string;
  'credential-type': 'client-credentials';
  'tenant-id': string;
} {
  return credential['credential-type'] === 'client-credentials';
}

function isSharedAccessKey(credential: AzCredential): credential is {
  'credential-type': 'shared-access-key';
  key: string;
} {
  return credential['credential-type'] === 'shared-access-key';
}

function isAzureSystemIdentityKey(credential: AzCredential): credential is {
  'credential-type': 'azure-system-identity';
  key: string;
} {
  return credential['credential-type'] === 'azure-system-identity';
}

const rules = {
  required: (value: any) => !!value || 'Required.',
  noSlash: (value: string) => !value.includes('/') || 'Cannot contain "/"',
};

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

const emitNewCredentials = () => {
  if (isClientCredentials(warehouseObjectData['storage-credential'])) {
    emit('updateCredentials', {
      type: 'az',
      'credential-type': warehouseObjectData['storage-credential']['credential-type'],
      'client-id': warehouseObjectData['storage-credential']['client-id'],
      'client-secret': warehouseObjectData['storage-credential']['client-secret'],
      'tenant-id': warehouseObjectData['storage-credential']['tenant-id'],
    });
  } else if (isSharedAccessKey(warehouseObjectData['storage-credential'])) {
    emit('updateCredentials', {
      type: 'az',
      'credential-type': warehouseObjectData['storage-credential']['credential-type'],
      key: warehouseObjectData['storage-credential']['key'],
    });
  } else if (isAzureSystemIdentityKey(warehouseObjectData['storage-credential'])) {
    emit('updateCredentials', {
      type: 'az',
      'credential-type': warehouseObjectData['storage-credential']['credential-type'],
    });
  } else {
    throw new Error('Invalid credential type');
  }
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData['storage-profile'],
    credentials: {
      type: 'az',
      'credential-type': warehouseObjectData['storage-credential']['credential-type'],
      ...(isClientCredentials(warehouseObjectData['storage-credential']) && {
        'client-id': warehouseObjectData['storage-credential']['client-id'],
        'client-secret': warehouseObjectData['storage-credential']['client-secret'],
        'tenant-id': warehouseObjectData['storage-credential']['tenant-id'],
      }),
      ...(isSharedAccessKey(warehouseObjectData['storage-credential']) && {
        key: warehouseObjectData['storage-credential']['key'],
      }),
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit('updateProfile', newProfile);
};

onMounted(() => {
  if (props.warehouseObject) Object.assign(warehouseObjectData, props.warehouseObject);
  credentialType.value =
    warehouseObjectData['storage-credential']['credential-type'] || 'client-credentials';
});
</script>
