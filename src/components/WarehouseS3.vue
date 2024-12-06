<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <v-text-field
      v-model="warehouseObjectData['storage-credential']['aws-access-key-id']"
      label="AWS Access Key ID"
      :rules="[rules.required]"
      placeholder="AKIAIOSFODNN7EXAMPLE"
      autocomplete="username"
    ></v-text-field>
    <v-text-field
      v-model="
        warehouseObjectData['storage-credential']['aws-secret-access-key']
      "
      autocomplete="current-password"
      label="AWS Secret Access Key"
      :rules="[rules.required]"
      placeholder="your-aws-secret-access-key"
      :type="showPassword ? 'text' : 'password'"
      :append-inner-icon="
        showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'
      "
      @click:append-inner="showPassword = !showPassword"
    ></v-text-field>
    <v-btn
      v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
      :disabled="
        !warehouseObjectData['storage-credential']['aws-access-key-id'] ||
        !warehouseObjectData['storage-credential']['aws-secret-access-key']
      "
      color="success"
      @click="emitNewCredentials"
      >Update Credentials
    </v-btn>

    <v-divider></v-divider>
    <!--Storage Profile-->

    <div
      v-if="
        props.objectType === ObjectType.STORAGE_PROFILE ||
        (props.intent === Intent.CREATE &&
          props.objectType === ObjectType.WAREHOUSE)
      "
    >
      <v-select
        v-model="warehouseObjectData['storage-profile'].flavor"
        :items="s3Flavor"
        item-title="name"
        item-value="code"
        label="S3 Flavor"
        :rules="[rules.required]"
        placeholder="Select S3 Flavor"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item
            v-bind="props"
            :subtitle="item.raw.code"
          ></v-list-item> </template
      ></v-select>

      <v-text-field
        v-model="warehouseObjectData['storage-profile'].bucket"
        label="Bucket"
        :rules="[rules.required]"
        placeholder="my-bucket"
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
        :rules="[rules.required]"
        placeholder="eu-central-1"
      ></v-combobox>

      <v-row>
        <v-col cols="3">
          <v-switch
            v-model="warehouseObjectData['storage-profile']['sts-enabled']"
            :label="
              warehouseObjectData['storage-profile']['sts-enabled']
                ? `STS is enabled `
                : `Enable STS`
            "
            color="primary"
          ></v-switch
        ></v-col>
        <v-col
          ><v-text-field
            v-model="warehouseObjectData['storage-profile']['sts-role-arn']"
            v-if="warehouseObjectData['storage-profile']['sts-enabled']"
            label="STS Role ARN"
            placeholder="arn:aws:iam::123456789012:role/role-name"
          ></v-text-field
        ></v-col>
      </v-row>

      <v-btn
        color="success"
        type="submit"
        v-if="
          props.intent === Intent.CREATE &&
          props.objectType === ObjectType.WAREHOUSE
        "
        :disabled="
          !warehouseObjectData['storage-credential']['aws-access-key-id'] ||
          !warehouseObjectData['storage-credential']['aws-secret-access-key'] ||
          !warehouseObjectData['storage-profile'].bucket ||
          !warehouseObjectData['storage-profile'].region ||
          !warehouseObjectData['storage-profile']['key-prefix'] ||
          (warehouseObjectData['storage-profile']['sts-enabled'] &&
            !warehouseObjectData['storage-profile']['sts-role-arn'])
        "
        >Submit
      </v-btn>
      <v-btn
        color="success"
        @click="emitNewProfile"
        v-if="
          props.intent === Intent.UPDATE &&
          props.objectType === ObjectType.STORAGE_PROFILE
        "
        :disabled="
          !warehouseObjectData['storage-credential']['aws-access-key-id'] ||
          !warehouseObjectData['storage-credential']['aws-secret-access-key'] ||
          !warehouseObjectData['storage-profile'].bucket ||
          !warehouseObjectData['storage-profile'].region ||
          !warehouseObjectData['storage-profile']['key-prefix'] ||
          (warehouseObjectData['storage-profile']['sts-enabled'] &&
            !warehouseObjectData['storage-profile']['sts-role-arn'])
        "
        >Update Profile
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from "vue";

import {
  S3Credential,
  S3Profile,
  StorageCredential,
  StorageProfile,
} from "@/gen/management/types.gen";
import { Intent, ObjectType } from "@/common/enums";
import { WarehousObject } from "@/common/interfaces";

const showPassword = ref(false);

const props = defineProps<{
  credentialsOnly: boolean;
  intent: Intent;
  objectType: ObjectType;
  warehouseObject: WarehousObject | null;
}>();

const emit = defineEmits<{
  (e: "submit", warehouseObjectDataEmit: WarehousObject): void;
  (e: "update-credentials", credentials: StorageCredential): void;
  (
    e: "update-profile",
    newProfile: { profile: StorageProfile; credentials: StorageCredential }
  ): void;
}>();

const warehouseObjectData = reactive<{
  "storage-profile": S3Profile & {
    type: "s3";
  };
  "storage-credential": S3Credential & { type: string };
}>({
  "storage-profile": {
    type: "s3",
    bucket: "",
    region: "",
    "sts-enabled": false,
  },
  "storage-credential": {
    type: "s3",
    "aws-access-key-id": "",
    "aws-secret-access-key": "",
    "credential-type": "access-key",
  },
});

const regions = [
  "us-east-2",
  "us-east-1",
  "us-west-1",
  "us-west-2",
  "af-south-1",
  "ap-east-1",
  "ap-south-2",
  "ap-southeast-3",
  "ap-southeast-5",
  "ap-southeast-4",
  "ap-south-1",
  "ap-northeast-3",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "ca-west-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-south-1",
  "eu-west-3",
  "eu-south-2",
  "eu-north-1",
  "eu-central-2",
  "il-central-1",
  "me-south-1",
  "me-central-1",
  "sa-east-1",
  "us-gov-east-1",
  "us-gov-west-1",
];

const rules = {
  required: (value: any) => !!value || "Required.",
  noSlash: (value: string) => !value.includes("/") || 'Cannot contain "/"',
};

const s3Flavor = [
  { name: "AWS", code: "aws" },
  { name: "Minio", code: "minio" },
];

const handleSubmit = () => {
  emit("submit", warehouseObjectData);
};

const emitNewCredentials = () => {
  const credentials = {
    type: "s3",
    "credential-type": "access-key",
    "aws-access-key-id":
      warehouseObjectData["storage-credential"]["aws-access-key-id"],
    "aws-secret-access-key":
      warehouseObjectData["storage-credential"]["aws-secret-access-key"],
  } as StorageCredential;

  emit("update-credentials", credentials);
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData["storage-profile"],
    credentials: {
      type: "s3",
      "credential-type": "access-key",
      "aws-access-key-id":
        warehouseObjectData["storage-credential"]["aws-access-key-id"],
      "aws-secret-access-key":
        warehouseObjectData["storage-credential"]["aws-secret-access-key"],
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit("update-profile", newProfile);
};

onMounted(() => {
  if (props.warehouseObject)
    Object.assign(warehouseObjectData, props.warehouseObject);
});
</script>
