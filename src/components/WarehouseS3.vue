<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <v-select
      v-model="warehouseObjectData['storage-credential']['credential-type']"
      :items="credentialOptions"
      item-title="text"
      item-value="value"
      label="Credential Type"
      color="primary"
      outlined
      :rules="[rules.required]"></v-select>

    <!-- Access Key Fields -->
    <v-text-field
      v-if="warehouseObjectData['storage-credential']['credential-type'] === 'access-key'"
      v-model="warehouseObjectData['storage-credential']['aws-access-key-id']"
      autocomplete="username"
      label="AWS Access Key ID"
      placeholder="AKIAIOSFODNN7EXAMPLE"
      :rules="[rules.required]"></v-text-field>
    <v-text-field
      v-if="warehouseObjectData['storage-credential']['credential-type'] === 'access-key'"
      v-model="warehouseObjectData['storage-credential']['aws-secret-access-key']"
      :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
      autocomplete="current-password"
      label="AWS Secret Access Key"
      placeholder="your-aws-secret-access-key"
      :rules="[rules.required]"
      :type="showPassword ? 'text' : 'password'"
      @click:append-inner="showPassword = !showPassword"></v-text-field>

    <div v-if="warehouseObjectData['storage-credential']['credential-type'] === 'cloudflare-r2'">
      <v-text-field
        v-model="warehouseObjectData['storage-credential']['access-key-id']"
        autocomplete="username"
        label="Access Key ID"
        placeholder="AKIAIOSFODNN7EXAMPLE"
        :rules="[rules.required]"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-credential']['secret-access-key']"
        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
        autocomplete="current-password"
        label="Secret Access Key"
        placeholder="your-secret-access-key"
        :rules="[rules.required]"
        :type="showPassword ? 'text' : 'password'"
        @click:append-inner="showPassword = !showPassword"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-credential'].token"
        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
        autocomplete="current-password"
        label="Token"
        placeholder="7Ld5fNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-123456"
        :rules="[rules.required]"
        :type="showPassword ? 'text' : 'password'"
        @click:append-inner="showPassword = !showPassword"></v-text-field>

      <v-text-field
        v-model="warehouseObjectData['storage-credential']['account-id']"
        autocomplete="username"
        label="Account ID"
        placeholder="123456aaaaa1111"
        :rules="[rules.required]"></v-text-field>
    </div>

    <!-- AWS System Identity Fields -->

    <v-btn
      v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
      color="success"
      :disabled="
        (warehouseObjectData['storage-credential']['credential-type'] === 'access-key' &&
          (!warehouseObjectData['storage-credential']['aws-access-key-id'] ||
            !warehouseObjectData['storage-credential']['aws-secret-access-key'])) ||
        warehouseObjectData['storage-credential']['credential-type'] === 'aws-system-identity'
      "
      @click="emitNewCredentials">
      Update Credentials
    </v-btn>

    <v-divider class="mb-2"></v-divider>
    <!--Storage Profile-->

    <div
      v-if="
        props.objectType === ObjectType.STORAGE_PROFILE ||
        (props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE)
      ">
      <v-row>
        <v-col>
          <v-select
            v-model="warehouseObjectData['storage-profile'].flavor"
            item-title="name"
            item-value="code"
            :disabled="
              warehouseObjectData['storage-credential']['credential-type'] === 'cloudflare-r2'
            "
            :items="s3Flavor"
            label="S3 Flavor"
            placeholder="Select S3 Flavor"
            :rules="[rules.required]">
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :subtitle="item.raw.code"></v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col>
          <v-combobox
            v-model="warehouseObjectData['storage-profile'].region"
            :items="regions"
            label="Bucket Region"
            placeholder="eu-central-1"></v-combobox>
        </v-col>
        <v-col>
          <v-text-field
            v-model.number="warehouseObjectData['storage-profile']['sts-token-validity-seconds']"
            label="STS Token Validity Seconds (default: 3600)"
            type="number"
            clearable
            outlined></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-switch
            v-model="warehouseObjectData['storage-profile']['push-s3-delete-disabled']"
            color="primary"
            :label="
              warehouseObjectData['storage-profile']['push-s3-delete-disabled']
                ? `Push S3 delete is disabled`
                : `Push S3 delete is enabled`
            "></v-switch>
        </v-col>
        <v-col>
          <v-switch
            v-model="warehouseObjectData['storage-profile']['path-style-access']"
            color="primary"
            :label="
              warehouseObjectData['storage-profile']['path-style-access']
                ? `Path style access is enabled`
                : `Enable path style access`
            "></v-switch>
        </v-col>
        <v-col>
          <v-switch
            v-model="warehouseObjectData['storage-profile']['allow-alternative-protocols']"
            color="primary"
            :label="
              warehouseObjectData['storage-profile']['allow-alternative-protocols']
                ? `Alternative protocols are enabled`
                : `Enable alternative s3 protocols (s3a, s3n)`
            "></v-switch>
        </v-col>
      </v-row>

      <v-text-field
        v-model="warehouseObjectData['storage-profile'].bucket"
        label="Bucket"
        placeholder="my-bucket"
        :rules="[rules.required]"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key Prefix"
        placeholder="path/to/warehouse (optional)"></v-text-field>

      <v-text-field
        v-model="warehouseObjectData['storage-profile']['assume-role-arn']"
        :disabled="warehouseObjectData['storage-credential']['credential-type'] === 'cloudflare-r2'"
        label="Assume Role ARN"
        placeholder="arn:partition:service:region:account-id:resource-id"></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['aws-kms-key-arn']"
        :disabled="warehouseObjectData['storage-credential']['credential-type'] === 'cloudflare-r2'"
        label="AWS KMS Key ARN"
        placeholder="arn:partition:service:region:account-id:resource-id"></v-text-field>

      <v-text-field
        v-if="warehouseObjectData['storage-credential']['credential-type'] !== 'cloudflare-r2'"
        v-model="warehouseObjectData['storage-credential']['external-id']"
        label="External ID (optional)"
        placeholder="arn:aws:iam::123456789012..."
        :append-inner-icon="showPasswordExternalId ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
        :type="showPasswordExternalId ? 'text' : 'password'"
        @click:append-inner="showPasswordExternalId = !showPasswordExternalId"></v-text-field>

      <v-row>
        <v-col cols="8">
          <v-text-field
            v-model="warehouseObjectData['storage-profile'].endpoint"
            label="Endpoint"
            placeholder="https://s3.custom.example.com (optional)"></v-text-field>
        </v-col>
        <v-col>
          <v-select
            v-model="warehouseObjectData['storage-profile']['remote-signing-url-style']"
            item-title="name"
            item-value="code"
            :items="s3UrlDetectionModes"
            label="Remote signing URL style (optional)"
            clearable
            placeholder="optional"></v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="3">
          <v-switch
            v-model="warehouseObjectData['storage-profile']['sts-enabled']"
            color="primary"
            :label="
              warehouseObjectData['storage-profile']['sts-enabled']
                ? `STS is enabled `
                : `Enable STS`
            "></v-switch>
        </v-col>
        <v-col>
          <v-text-field
            v-if="warehouseObjectData['storage-profile']['sts-enabled']"
            v-model="warehouseObjectData['storage-profile']['sts-role-arn']"
            label="STS Role ARN"
            placeholder="arn:aws:iam::123456789012:role/role-name"></v-text-field>
        </v-col>
      </v-row>

      <!-- STS Session Tags -->
      <div v-if="warehouseObjectData['storage-profile']['sts-enabled']">
        <v-row>
          <v-col>
            <h4 class="text-subtitle-1 mb-2">STS Session Tags (Optional)</h4>
            <p class="text-caption text-medium-emphasis mb-3">
              Key-value pairs that are passed as session tags when assuming the STS role
            </p>
          </v-col>
        </v-row>

        <div v-if="stsSessionTagsArray.length > 0">
          <v-row v-for="(tag, index) in stsSessionTagsArray" :key="index">
            <v-col cols="5">
              <v-text-field
                v-model="tag.key"
                label="Key"
                placeholder="Environment"
                density="compact"
                @input="updateStsSessionTags"></v-text-field>
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model="tag.value"
                label="Value"
                placeholder="Production"
                density="compact"
                @input="updateStsSessionTags"></v-text-field>
            </v-col>
            <v-col cols="2" class="d-flex align-center">
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="removeStsSessionTag(index)"></v-btn>
            </v-col>
          </v-row>
        </div>

        <v-row>
          <v-col>
            <v-btn
              prepend-icon="mdi-plus"
              variant="outlined"
              size="small"
              class="mb-2"
              @click="addStsSessionTag">
              Session Tag
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <v-btn
        v-if="props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE"
        color="success"
        :disabled="
          (warehouseObjectData['storage-credential']['credential-type'] === 'access-key' &&
            (!warehouseObjectData['storage-credential']['aws-access-key-id'] ||
              !warehouseObjectData['storage-credential']['aws-secret-access-key'])) ||
          warehouseObjectData['storage-credential']['credential-type'] === 'aws-system-identity' ||
          !warehouseObjectData['storage-profile'].bucket ||
          (warehouseObjectData['storage-profile'].flavor === 'aws' &&
            !warehouseObjectData['storage-profile'].region) ||
          (warehouseObjectData['storage-profile']['sts-enabled'] &&
            warehouseObjectData['storage-profile'].flavor !== 's3-compat' &&
            !warehouseObjectData['storage-profile']['sts-role-arn'] &&
            !(
              warehouseObjectData['storage-profile'].flavor === 'aws' &&
              warehouseObjectData['storage-profile']['assume-role-arn'] &&
              warehouseObjectData['storage-profile']['sts-enabled']
            ))
        "
        type="submit">
        Submit
      </v-btn>
      <v-btn
        v-if="props.intent === Intent.UPDATE && props.objectType === ObjectType.STORAGE_PROFILE"
        color="success"
        :disabled="
          (warehouseObjectData['storage-credential']['credential-type'] === 'access-key' &&
            (!warehouseObjectData['storage-credential']['aws-access-key-id'] ||
              !warehouseObjectData['storage-credential']['aws-secret-access-key'])) ||
          warehouseObjectData['storage-credential']['credential-type'] === 'aws-system-identity' ||
          !warehouseObjectData['storage-profile'].bucket ||
          (warehouseObjectData['storage-profile'].flavor === 'aws' &&
            !warehouseObjectData['storage-profile'].region) ||
          (warehouseObjectData['storage-profile']['sts-enabled'] &&
            warehouseObjectData['storage-profile'].flavor !== 's3-compat' &&
            !warehouseObjectData['storage-profile']['sts-role-arn'] &&
            !(
              warehouseObjectData['storage-profile'].flavor === 'aws' &&
              warehouseObjectData['storage-profile']['assume-role-arn'] &&
              warehouseObjectData['storage-profile']['sts-enabled']
            ))
        "
        @click="emitNewProfile">
        Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';

import {
  S3Credential,
  S3Profile,
  StorageCredential,
  StorageProfile,
} from '@/gen/management/types.gen';
import { Intent, ObjectType } from '@/common/enums';
import { WarehousObject } from '@/common/interfaces';

const showPassword = ref(false);

const s3UrlDetectionModes = [
  { name: 'Path', code: 'path' },
  { name: 'Virtual Host', code: 'virtual_host' },
  { name: 'Auto', code: 'auto' },
];

const credentialOptions = [
  { text: 'Access Key ', value: 'access-key' },
  { text: 'AWS System Identity', value: 'aws-system-identity' },
  { text: 'Cloudflare R2', value: 'cloudflare-r2' },
];

const showPasswordExternalId = ref(false);
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
  'storage-profile': S3Profile & {
    type: 's3';
  };
  'storage-credential': S3Credential & { type: string };
}>({
  'storage-profile': {
    type: 's3',
    bucket: '',
    region: '',

    'sts-enabled': false,
  },
  'storage-credential': {
    type: 's3',
    'credential-type': 'access-key',
    'aws-access-key-id': '',
    'aws-secret-access-key': '',
    'external-id': null, // Optional, can be used for both credential types
  },
});

// STS Session Tags management
const stsSessionTagsArray = ref<Array<{ key: string; value: string }>>([]);

const updateStsSessionTags = () => {
  // Filter out empty tags and convert to object
  const validTags = stsSessionTagsArray.value.filter((tag) => tag.key.trim() && tag.value.trim());
  const tagsObject: { [key: string]: string } = {};

  validTags.forEach((tag) => {
    tagsObject[tag.key.trim()] = tag.value.trim();
  });

  warehouseObjectData['storage-profile']['sts-session-tags'] =
    Object.keys(tagsObject).length > 0 ? tagsObject : undefined;
};

const addStsSessionTag = () => {
  stsSessionTagsArray.value.push({ key: '', value: '' });
};

const removeStsSessionTag = (index: number) => {
  stsSessionTagsArray.value.splice(index, 1);
  updateStsSessionTags();
};

const regions = [
  'us-east-2',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-east-1',
  'ap-south-2',
  'ap-southeast-3',
  'ap-southeast-5',
  'ap-southeast-4',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'ca-west-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-south-1',
  'eu-west-3',
  'eu-south-2',
  'eu-north-1',
  'eu-central-2',
  'il-central-1',
  'me-south-1',
  'me-central-1',
  'sa-east-1',
  'us-gov-east-1',
  'us-gov-west-1',
];

const rules = {
  required: (value: any) => !!value || 'Required.',
  noSlash: (value: string) => !value.includes('/') || 'Cannot contain "/"',
};

const s3Flavor = [
  { name: 'AWS', code: 'aws' },
  { name: 'S3 Compatible Storage', code: 's3-compat' },
];

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

const emitNewCredentials = () => {
  let credentials: StorageCredential = {
    type: 's3',
    'credential-type': 'access-key',
    'aws-access-key-id': '',
    'aws-secret-access-key': '',
    'external-id': null,
  }; // Initialize with default values
  const credentialType = warehouseObjectData['storage-credential']['credential-type'];

  if (credentialType === 'access-key') {
    // Handle 'access-key' type
    credentials = {
      type: 's3' as const,
      'credential-type': 'access-key',
      'aws-access-key-id': warehouseObjectData['storage-credential']['aws-access-key-id'],
      'aws-secret-access-key': warehouseObjectData['storage-credential']['aws-secret-access-key'],
      'external-id': warehouseObjectData['storage-credential']['external-id'] || null, // Optional
    } as S3Credential & { type: 's3' };
  } else if (credentialType === 'aws-system-identity') {
    // Handle 'aws-system-identity' type
    credentials = {
      type: 's3' as const,
      'credential-type': 'aws-system-identity',
      'external-id': warehouseObjectData['storage-credential']['external-id'] || null, // Optional
    } as S3Credential & { type: 's3' };
  }

  emit('updateCredentials', credentials);
};

const emitNewProfile = () => {
  let credentials: StorageCredential = {
    type: 's3',
    'credential-type': 'access-key',
    'aws-access-key-id': '',
    'aws-secret-access-key': '',
    'external-id': null,
  }; // Initialize with default values
  const credentialType = warehouseObjectData['storage-credential']['credential-type'];

  if (credentialType === 'access-key') {
    // Handle 'access-key' type
    credentials = {
      type: 's3' as const,
      'credential-type': 'access-key',
      'aws-access-key-id': warehouseObjectData['storage-credential']['aws-access-key-id'],
      'aws-secret-access-key': warehouseObjectData['storage-credential']['aws-secret-access-key'],
      'external-id': warehouseObjectData['storage-credential']['external-id'] || null, // Optional
    } as S3Credential & { type: 's3' };
  } else if (credentialType === 'aws-system-identity') {
    // Handle 'aws-system-identity' type
    credentials = {
      type: 's3' as const,
      'credential-type': 'aws-system-identity',
      'external-id': warehouseObjectData['storage-credential']['external-id'] || null, // Optional
    } as S3Credential & { type: 's3' };
  }
  const newProfile = {
    profile: warehouseObjectData['storage-profile'],
    credentials: credentials,
  } as { profile: StorageProfile; credentials: StorageCredential };

  emit('updateProfile', newProfile);
};

onMounted(() => {
  if (props.warehouseObject) {
    Object.assign(warehouseObjectData, props.warehouseObject);

    // Initialize STS session tags array from existing data
    const existingTags = warehouseObjectData['storage-profile']['sts-session-tags'];
    if (existingTags) {
      stsSessionTagsArray.value = Object.entries(existingTags).map(([key, value]) => ({
        key,
        value,
      }));
    }
  }
});

watch(
  () => warehouseObjectData['storage-credential']['credential-type'],
  (newValue) => {
    if (newValue === 'cloudflare-r2') {
      warehouseObjectData['storage-profile'].flavor = 's3-compat';
    }
  },
);

watch(
  () => warehouseObjectData['storage-profile']['sts-enabled'],
  (newValue) => {
    if (!newValue) {
      // Clear STS session tags when STS is disabled
      stsSessionTagsArray.value = [];
      warehouseObjectData['storage-profile']['sts-session-tags'] = undefined;
    }
  },
);
</script>
