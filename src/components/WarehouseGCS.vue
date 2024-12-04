<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <v-text-field
      v-model="
        warehouseObjectData['storage-credential'].key
          .auth_provider_x509_cert_url
      "
      label="auth_provider_x509_cert_url"
      :rules="[rules.required]"
      placeholder="https://www.googleapis.com/oauth2/v1/certs"
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.auth_uri"
      label="auth_uri"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.client_email"
      label="client_email"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.client_id"
      label="client_id"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="
        warehouseObjectData['storage-credential'].key.client_x509_cert_url
      "
      label="client_x509_cert_url"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.private_key"
      label="private_key"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.private_key_id"
      label="private_key_id"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.project_id"
      label="project_id"
      placeholder=""
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.token_uri"
      label="token_uri"
      placeholder="https://oauth2.googleapis.com/token"
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.type"
      label="type"
      placeholder="service_account"
    ></v-text-field>
    <v-text-field
      v-model="warehouseObjectData['storage-credential'].key.universe_domain"
      label="universe_domain"
      placeholder="google.com"
    ></v-text-field>

    <v-btn
      v-if="props.objectType === ObjectType.STORAGE_CREDENTIAL"
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
      <v-text-field
        v-model="warehouseObjectData['storage-profile'].bucket"
        label="Bucket"
        :rules="[rules.required]"
        placeholder="my-bucket"
      ></v-text-field>
      <v-text-field
        v-model="warehouseObjectData['storage-profile']['key-prefix']"
        label="Key-prefix"
        placeholder="key-prefix"
      ></v-text-field>

      <v-btn
        color="success"
        type="submit"
        v-if="
          props.intent === Intent.CREATE &&
          props.objectType === ObjectType.WAREHOUSE
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
        :disabled="!warehouseObjectData['storage-profile'].bucket"
        >Update Profile
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
} from "@/gen/management/types.gen";
import { Intent, ObjectType } from "@/common/enums";
import { WarehousObject } from "@/common/interfaces";

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

const key = reactive<GcsServiceKey>({
  auth_provider_x509_cert_url: "",
  auth_uri: "",
  client_email: "",
  client_id: "",
  client_x509_cert_url: "",
  private_key: "",
  private_key_id: "",
  project_id: "",
  token_uri: "",
  type: "",
  universe_domain: "",
});
const warehouseObjectData = reactive<{
  "storage-profile": GcsProfile & { type: string };
  "storage-credential": GcsCredential & { type: string };
}>({
  "storage-profile": {
    bucket: "",
    type: "gcs",
  },
  "storage-credential": {
    "credential-type": "service-account-key",
    key: key,
    type: "gcs",
  },
});

const rules = {
  required: (value: any) => !!value || "Required.",
  noSlash: (value: string) => !value.includes("/") || 'Cannot contain "/"',
};

const handleSubmit = () => {
  emit("submit", warehouseObjectData);
};

const emitNewCredentials = () => {
  const credentials = {
    type: "gcs",
  } as StorageCredential;

  emit("update-credentials", credentials);
};

const emitNewProfile = () => {
  const newProfile = {
    profile: warehouseObjectData["storage-profile"],
    credentials: {
      type: "gcs",
    } as StorageCredential,
  } as { profile: StorageProfile; credentials: StorageCredential };
  emit("update-profile", newProfile);
};

onMounted(() => {
  if (props.warehouseObject)
    Object.assign(warehouseObjectData, props.warehouseObject);
});
</script>
