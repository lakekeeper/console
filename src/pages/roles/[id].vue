<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab v-if="enabledAuthentication && enabledPermissions" value="permissions">
      Permissions
    </v-tab>
  </v-tabs>

  <v-card>
    <v-card-title>Role: {{ role.name }}</v-card-title>

    <v-card-subtitle>
      <div>Created At: {{ role['created-at'] }}</div>
      ID: {{ role.id }}
      <v-btn
        icon="mdi-content-copy"
        size="small"
        variant="flat"
        @click="functions.copyToClipboard(role.id)"></v-btn>
    </v-card-subtitle>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="overview">
        <RoleOverviewEdit :role-id="params.id" @role-loaded="handleRoleLoaded" />
      </v-tabs-window-item>
      <v-tabs-window-item value="permissions">
        <PermissionManager :assignable-obj="role" :relation-type="type" />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import { RelationType } from '../../common/interfaces';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

const functions = useFunctions();
const route = useRoute();
const params = computed(() => route.params as { id: string });
const tab = ref('overview');
const type = ref<RelationType>('role');

const role = reactive<any>({
  id: '',
  description: '',
  name: '',
  'created-at': '',
});

function handleRoleLoaded(loadedRole: any) {
  Object.assign(role, loadedRole);
}
</script>
