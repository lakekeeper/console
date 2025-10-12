<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <NamespaceHeader :warehouse-id="params.id" :namespace-path="params.nsid" />

      <v-tabs v-model="tab">
        <v-tab value="namespaces">namespaces</v-tab>
        <v-tab value="tables">tables</v-tab>
        <v-tab value="views">views</v-tab>
        <v-tab value="deleted">deleted</v-tab>
        <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
      </v-tabs>

      <v-card>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="namespaces">
            <NamespaceNamespaces
              v-if="tab === 'namespaces'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="tables">
            <NamespaceTables
              v-if="tab === 'tables'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="views">
            <NamespaceViews
              v-if="tab === 'views'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="deleted">
            <NamespaceDeleted
              v-if="tab === 'deleted'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
            <PermissionManager
              v-if="tab === 'permissions'"
              :objectId="namespaceId"
              :relationType="RelationType.Namespace" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  useFunctions,
  useNamespacePermissions,
  RelationType,
} from '@lakekeeper/console-components';

const route = useRoute();
const functions = useFunctions();
const tab = ref('namespaces');
const namespaceId = ref('');
const lastNamespaceRequest = ref(0);

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
}));

async function loadNamespaceMetadata() {
  const { id, nsid } = params.value;
  const requestToken = ++lastNamespaceRequest.value;
  // Clear stale namespace id so downstream consumers don't operate on the previous namespace
  namespaceId.value = '';
  try {
    const namespace = await functions.loadNamespaceMetadata(id, nsid);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    namespaceId.value = namespace.properties?.namespace_id || '';
  } catch (error) {
    console.error('Failed to load namespace metadata:', error);
    if (requestToken === lastNamespaceRequest.value) {
      namespaceId.value = '';
    }
  }
}

// Load namespace metadata on mount to get namespaceId for permissions
onMounted(loadNamespaceMetadata);

// Reload when route params change
watch(
  () => [params.value.id, params.value.nsid],
  () => loadNamespaceMetadata(),
  { immediate: false },
);

const { showPermissionsTab } = useNamespacePermissions(namespaceId);
</script>
