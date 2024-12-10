<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <v-text-field
      v-model="warehouseObjectData['storage-credential']['aws-access-key-id']"
      autocomplete="username"
      label="AWS Access Key ID"
      placeholder="AKIAIOSFODNN7EXAMPLE"
      :rules="[rules.required]"
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential']['aws-secret-access-key']"
      :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
      autocomplete="current-password"
      label="AWS Secret Access Key"
      placeholder="your-aws-secret-access-key"
      :rules="[rules.required]"
      :type="showPassword ? 'text' : 'password'"
      @click:append-inner="showPassword = !showPassword"
    ></v-text-field>
    <v-btn
      v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
      color="success"
      :disabled="
        !warehouseObjectData['storage-credential']['aws-access-key-id'] ||
        !warehouseObjectData['storage-credential']['aws-secret-access-key']
      "
      @click="emitNewCredentials"
      >Update Credentials
    </v-btn>

    <v-divider></v-divider>
    <!--Storage Profile-->

    <div
      v-if="
        props.objectType === ObjectType.STORAGE_PROFILE ||
        (props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE)
      "
    >
      <v-select
        v-model="warehouseObjectData['storage-profile'].flavor"
        item-title="name"
        item-value="code"
        :items="s3Flavor"
        label="S3 Flavor"
        placeholder="Select S3 Flavor"
        :rules="[rules.required]"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :subtitle="item.raw.code"></v-list-item> </template
      ></v-select>

      <v-text-field
        v-model="warehouseObjectData['storage-profile'].bucket"
        label="Bucket"
        placeholder="my-bucket"
        :rules="[rules.required]"
      ></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key Prefix"
        placeholder="path/to/warehouse (optional)"
      ></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile'].endpoint"
        label="Endpoint"
        placeholder="https://s3.custom.example.com (optional)"
      ></v-text-field>

      <v-combobox
        v-model="warehouseObjectData['storage-profile'].region"
        :items="regions"
        label="Bucket Region"
        placeholder="eu-central-1"
        :rules="[rules.required]"
      ></v-combobox>

      <v-row>
        <v-col cols="3">
          <v-switch
            v-model="warehouseObjectData['storage-profile']['sts-enabled']"
            color="primary"
            :label="
              warehouseObjectData['storage-profile']['sts-enabled']
                ? `STS is enabled `
                : `Enable STS`
            "
          ></v-switch
        ></v-col>
        <v-col
          ><v-text-field
            v-if="warehouseObjectData['storage-profile']['sts-enabled']"
            v-model="warehouseObjectData['storage-profile']['sts-role-arn']"
            label="STS Role ARN"
            placeholder="arn:aws:iam::123456789012:role/role-name"
          ></v-text-field
        ></v-col>
      </v-row>

      <v-btn
        v-if="props.intent === Intent.CREATE && props.objectType === ObjectType.WAREHOUSE"
        color="success"
        :disabled="
          !warehouseObjectData['storage-credential']['aws-access-key-id'] ||
          !warehouseObjectData['storage-credential']['aws-secret-access-key'] ||
          !warehouseObjectData['storage-profile'].bucket ||
          !warehouseObjectData['storage-profile'].region ||
          !warehouseObjectData['storage-profile']['key-prefix'] ||
          (warehouseObjectData['storage-profile']['sts-enabled'] &&
            !warehouseObjectData['storage-profile']['sts-role-arn'])
        "
        type="submit"
        >Submit
      </v-btn>
      <v-btn
        v-if="props.intent === Intent.UPDATE && props.objectType === ObjectType.STORAGE_PROFILE"
        color="success"
        :disabled="
          !warehouseObjectData['storage-credential']['aws-access-key-id'] ||
          !warehouseObjectData['storage-credential']['aws-secret-access-key'] ||
          !warehouseObjectData['storage-profile'].bucket ||
          !warehouseObjectData['storage-profile'].region ||
          !warehouseObjectData['storage-profile']['key-prefix'] ||
          (warehouseObjectData['storage-profile']['sts-enabled'] &&
            !warehouseObjectData['storage-profile']['sts-role-arn'])
        "
        @click="emitNewProfile"
        >Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import {
  S3Credential,
  S3Profile,
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
    'aws-access-key-id': '',
    'aws-secret-access-key': '',
    'credential-type': 'access-key',
  },
});

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
  { name: 'S3 Compatible Stotage', code: 's3-compat' },
];

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

const emitNewCredentials = () => {
  const credentials = {
    type: 's3',
    'credential-type': 'access-key',
    'aws-access-key-id': warehouseObjectData['storage-credential']['aws-access-key-id'],
    'aws-secret-access-key': warehouseObjectData['storage-credential']['aws-secret-access-key'],
  } as StorageCredential;

  emit('updateCredentials', credentials);
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData['storage-profile'],
    credentials: {
      type: 's3',
      'credential-type': 'access-key',
      'aws-access-key-id': warehouseObjectData['storage-credential']['aws-access-key-id'],
      'aws-secret-access-key': warehouseObjectData['storage-credential']['aws-secret-access-key'],
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit('updateProfile', newProfile);
};

onMounted(() => {
  if (props.warehouseObject) Object.assign(warehouseObjectData, props.warehouseObject);
});
</script>
