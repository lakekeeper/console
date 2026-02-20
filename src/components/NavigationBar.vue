<template>
  <v-navigation-drawer :rail="!visual.navBarShow" permanent>
    <v-list nav density="compact" color="primary" class="pa-2">
      <v-list-subheader v-show="visual.navBarShow" class="text-uppercase font-weight-bold">
        Navigation
      </v-list-subheader>
      <v-list-item link title="Home" to="/" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Home
          </v-tooltip>
          <v-icon size="small" icon="mdi-home-circle"></v-icon>
        </template>
      </v-list-item>
      <v-list-item link title="Warehouses" to="/warehouse" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Warehouses
          </v-tooltip>
          <v-icon size="small" icon="mdi-database"></v-icon>
        </template>
      </v-list-item>
      <v-list-item link title="Volumes" to="/volumes" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Volumes
          </v-tooltip>
          <v-icon size="small" icon="mdi-bucket"></v-icon>
        </template>
        <template #append>
          <v-chip v-show="visual.navBarShow" size="x-small" color="warning" variant="tonal">
            Roadmap
          </v-chip>
        </template>
      </v-list-item>
      <v-list-item link title="Roles" rounded="lg" :active="isRolesActive" @click="routeToRoles">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Roles
          </v-tooltip>
          <v-icon size="small" icon="mdi-shield-account"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-subheader v-show="visual.navBarShow" class="text-uppercase font-weight-bold">
        Tools
      </v-list-subheader>
      <v-list-item link title="LoQE" to="/loqe" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            LoQE
          </v-tooltip>
          <v-icon size="small" icon="mdi-console"></v-icon>
        </template>
        <template #append>
          <v-chip v-show="visual.navBarShow" size="x-small" color="info" variant="tonal">
            Beta
          </v-chip>
        </template>
      </v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-subheader v-show="visual.navBarShow" class="text-uppercase font-weight-bold">
        System
      </v-list-subheader>
      <v-list-item link title="Server settings" to="/server-settings" rounded="lg">
        <template #prepend>
          <v-tooltip activator="parent" location="end" :disabled="visual.navBarShow">
            Server settings
          </v-tooltip>
          <v-icon size="small" icon="mdi-cog"></v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVisualStore } from '@lakekeeper/console-components';
import { useRoute, useRouter } from 'vue-router';
import { Type } from '@lakekeeper/console-components';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

const visual = useVisualStore();
const router = useRouter();
const route = useRoute();
const isRolesActive = computed(() => route.path.startsWith('/roles'));

function routeToRoles() {
  if (enabledAuthentication && enabledPermissions) {
    router.push('/roles');
  } else {
    visual.setSnackbarMsg({
      function: 'routeToRoles',
      text: 'Authorization is disabled',
      ttl: 3000,
      ts: Date.now(),
      type: Type.INFO,
    });
  }
}
</script>

<style scoped>
:deep(.v-list-item__prepend > .v-icon) {
  font-size: 18px !important;
}
</style>
