<template>
  <div class="pa-4">
    <h1 class="text-h6 mb-4 d-flex align-center ga-2">
      <v-icon>mdi-shield-check-outline</v-icon>
      Governance
    </h1>
    <v-tabs v-model="tab">
      <v-tab value="tags">Tags</v-tab>
      <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
      <!-- Cedar backends surface Policies here instead of Permissions (follow-up). -->
    </v-tabs>
    <v-tabs-window v-model="tab" style="max-height: calc(100vh - 140px); overflow-y: auto">
      <v-tabs-window-item value="tags">
        <TagDefinitionManager v-if="tab === 'tags'" />
      </v-tabs-window-item>
      <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
        <PermissionExplorer v-if="tab === 'permissions'" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVisualStore } from '@lakekeeper/console-components';

const route = useRoute();
const router = useRouter();
const visual = useVisualStore();

const tab = ref((route.query.tab as string) || 'tags');

// Permission assignments are an OpenFGA concept — show the tab whenever the
// backend is OpenFGA (per-scope visibility is handled inside the explorer).
// Cedar surfaces policies instead; allow-all has no permission management.
const showPermissionsTab = computed(() => visual.getServerInfo()['authz-backend'] === 'openfga');

watch(tab, (t) => router.replace({ query: { ...route.query, tab: t } }));
</script>
