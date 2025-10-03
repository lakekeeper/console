<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-center fill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>
    </v-responsive>
  </v-container>

  <v-container v-else-if="!canRead" class="fill-height">
    <v-responsive class="align-center fill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-col cols="12" class="text-center">
          <v-icon size="64" color="warning">mdi-lock</v-icon>
          <h2 class="mt-4">Access Denied</h2>
          <p class="mt-2">You don't have permission to view this role.</p>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>

  <div v-else>
    <v-tabs v-model="tab">
      <v-tab value="overview">overview</v-tab>
      <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="overview">
        <RoleOverviewEdit :role-id="roleId" />
      </v-tabs-window-item>
      <v-tabs-window-item value="permissions">
        <PermissionManager :object-id="roleId" :relation-type="type" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { RelationType } from '../../common/interfaces';
import { useRolePermissions } from '@/composables/usePermissions';

const route = useRoute();
const params = computed(() => route.params as { id: string });
const tab = ref('overview');
const type = RelationType.Role;

// Create a computed ref for the role ID
const roleId = computed(() => params.value.id);

// Use the role permissions composable
const { loading, canRead, showPermissionsTab } = useRolePermissions(roleId);
</script>
