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
    <RoleDetail :role-id="roleId" :can-edit="canManageGrants" />
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRolePermissions, useRoleAuthorizerPermissions } from '@lakekeeper/console-components';

const route = useRoute();
const params = computed(() => route.params as { id: string });
const roleId = computed(() => params.value.id);

const { loading, canRead } = useRolePermissions(roleId);
const { canManageGrants } = useRoleAuthorizerPermissions(roleId);
</script>
