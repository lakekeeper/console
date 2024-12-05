<template>
  <v-menu v-model="menuOpen" location="start" offset-y="20px">
    <template v-slot:activator="{ props }">
      <v-btn icon="mdi-cog" variant="text" v-bind="props"></v-btn>
    </template>

    <v-list activatable>
      <v-list-item>
        <v-list-item-title>
          <RenameWarehouseDialog
            :warehouseName="warehouse.name"
            @rename-warehouse="emitRename"
          />
        </v-list-item-title>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>
          <AddWarehouseDialog
            :warehouse="warehouse"
            :processStatus="processStatus"
            :intent="Intent.UPDATE"
            :object-type="ObjectType.STORAGE_CREDENTIAL"
            @update-credentials="updateStorageCredential"
            @cancel="menuOpen = false"
            @close="$emit('close')"
          />
        </v-list-item-title>
      </v-list-item>
      <!--v-list-item>
        <v-list-item-title>
          <AddWarehouseDialog
            :warehouse="warehouse"
            :processStatus="processStatus"
            :intent="Intent.UPDATE"
            :object-type="ObjectType.STORAGE_PROFILE"
            @update-profile="updateStorageProfile"
            @cancel="menuOpen = false"
          />
        </v-list-item-title>
      </v-list-item-->
      <v-list-item>
        <v-list-item-title>
          <AddWarehouseDialog
            :warehouse="warehouse"
            :intent="Intent.UPDATE"
            :processStatus="processStatus"
            :object-type="ObjectType.DELETION_PROFILE"
            @update-deletion-profile="updateDelitionProfile"
            @cancel="menuOpen = false"
        /></v-list-item-title>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>
          <ComputeConnectDialog :warehouse-name="warehouse.name" />
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import {
  GetWarehouseResponse,
  StorageCredential,
  StorageProfile,
  TabularDeleteProfile,
} from "../gen/management/types.gen";
import { ref, watch } from "vue";
import { Intent, ObjectType } from "../common/enums";

const menuOpen = ref(false);

const emit = defineEmits<{
  (e: "rename-warehouse", warehouse: string): void;
  (e: "update-credentials", credentials: StorageCredential): void;
  (
    e: "update-profile",
    newProfile: { profile: StorageProfile; credentials: StorageCredential }
  ): void;
  (e: "update-delprofile", profile: TabularDeleteProfile): void;
  (e: "close"): void;
}>();

const { warehouse, processStatus } = defineProps<{
  warehouse: GetWarehouseResponse;
  processStatus: string;
}>();

onMounted(async () => {});

function emitRename(name: string) {
  emit("rename-warehouse", name);
  menuOpen.value = false;
}

function updateStorageCredential(e: StorageCredential) {
  emit("update-credentials", e);
}

// function updateStorageProfile(e: {
//   profile: StorageProfile;
//   credentials: StorageCredential;
// }) {
//   emit("update-profile", e);
//   menuOpen.value = false;
// }

function updateDelitionProfile(e: TabularDeleteProfile) {
  emit("update-delprofile", e);
  menuOpen.value = false;
}

watch(
  () => processStatus,
  (old, newVal) => {
    if (newVal === "success") {
      menuOpen.value = false;
    }
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>
