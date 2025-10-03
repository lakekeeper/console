<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab v-if="enabledAuthentication && enabledPermissions" value="permissions">
      Permissions
    </v-tab>
  </v-tabs>

  <v-tabs-window v-model="tab">
    <v-tabs-window-item value="overview">
      <RoleOverviewEdit :role-id="params.id" />
    </v-tabs-window-item>
    <v-tabs-window-item value="permissions">
      <PermissionManager :object-id="params.id" :relation-type="type" />
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { RelationType } from '../../common/interfaces';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

const route = useRoute();
const params = computed(() => route.params as { id: string });
const tab = ref('overview');
const type = ref<RelationType>('role');
</script>
