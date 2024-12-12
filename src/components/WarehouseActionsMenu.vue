<template>
  <v-menu v-model="menuOpen" location="start" offset-y="20px">
    <template #activator="{ props }">
      <v-btn icon="mdi-cog" variant="text" v-bind="props"></v-btn>
    </template>

    <v-list activatable>
      <v-list-item>
        <v-list-item-title>
          <RenameWarehouseDialog :warehouse-name="warehouse.name" @rename-warehouse="emitRename" />
        </v-list-item-title>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>
          <AddWarehouseDialog
            :intent="Intent.UPDATE"
            :object-type="ObjectType.STORAGE_CREDENTIAL"
            :process-status="processStatus"
            :warehouse="warehouse"
            @cancel="menuOpen = false"
            @close="$emit('close')"
            @update-credentials="updateStorageCredential" />
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
            :intent="Intent.UPDATE"
            :object-type="ObjectType.DELETION_PROFILE"
            :process-status="processStatus"
            :warehouse="warehouse"
            @cancel="menuOpen = false"
            @update-deletion-profile="updateDelitionProfile" />
        </v-list-item-title>
      </v-list-item>
      <!--v-list-item>
        <v-list-item-title>
          <ComputeConnectDialog :warehouse-name="warehouse.name" />
        </v-list-item-title>
      </v-list-item-->
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import {
  GetWarehouseResponse,
  StorageCredential,
  StorageProfile,
  TabularDeleteProfile,
} from '../gen/management/types.gen';
import { ref, watch, onMounted } from 'vue';
import { Intent, ObjectType } from '../common/enums';

const menuOpen = ref(false);

const emit = defineEmits<{
  (e: 'renameWarehouse', warehouse: string): void;
  (e: 'updateCredentials', credentials: StorageCredential): void;
  (
    e: 'updateProfile',
    newProfile: { profile: StorageProfile; credentials: StorageCredential },
  ): void;
  (e: 'updateDelprofile', profile: TabularDeleteProfile): void;
  (e: 'close'): void;
}>();

const { warehouse, processStatus } = defineProps<{
  warehouse: GetWarehouseResponse;
  processStatus: string;
}>();

onMounted(async () => {});

function emitRename(name: string) {
  emit('renameWarehouse', name);
  menuOpen.value = false;
}

function updateStorageCredential(e: StorageCredential) {
  emit('updateCredentials', e);
}

// function updateStorageProfile(e: {
//   profile: StorageProfile;
//   credentials: StorageCredential;
// }) {
//   emit("update-profile", e);
//   menuOpen.value = false;
// }

function updateDelitionProfile(e: TabularDeleteProfile) {
  emit('updateDelprofile', e);
  menuOpen.value = false;
}

watch(
  () => processStatus,
  (newVal) => {
    if (newVal === 'success') {
      menuOpen.value = false;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
