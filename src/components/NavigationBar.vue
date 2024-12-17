<template>
  <v-navigation-drawer v-model="visual.navBarShow">
    <v-list>
      <v-list-item link prepend-icon="mdi-home" title="Home" to="/"></v-list-item>
      <v-list-item
        link
        prepend-icon="mdi-warehouse"
        title="Warehouses"
        to="/warehouse"></v-list-item>
      <v-dialog v-model="isDialogActive" max-width="500">
        <template #activator="{ props: activatorProps }">
          <v-list-item
            v-bind="activatorProps"
            link
            prepend-icon="mdi-bucket"
            title="Volumes"></v-list-item>
        </template>

        <v-card title="Welcome to the Roadmap">
          <v-card-text>
            <div class="mb-2">Excited about the future of Lakekeeper?</div>

            Join the conversation and shape the journey!
            <a href="https://github.com/lakekeeper/lakekeeper/discussions/409" target="_blank">
              Click here
            </a>
            to explore and contribute to the roadmap discussion about Volumes on GitHub.
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="info" text="Close" @click="isDialogActive = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-list-item
        link
        prepend-icon="mdi-account-key"
        title="Roles"
        @click="routeToRoles"></v-list-item>
      <v-list-item
        link
        prepend-icon="mdi-cog"
        title="Server settings"
        to="/server-settings"></v-list-item>
    </v-list>
    <v-snackbar v-model="snackbarVisible" timeout="3000">Volumes are not active yet</v-snackbar>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVisualStore } from '../stores/visual';

import router from '../router';
import { enabledAuthorization, enabledPermissions } from '../app.config';
import { Type } from '../common/interfaces';

const visual = useVisualStore();
const snackbarVisible = ref(false);
const isDialogActive = ref(false);

function routeToRoles() {
  if (enabledAuthorization && enabledPermissions) {
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
