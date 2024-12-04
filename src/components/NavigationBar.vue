<template>
  <v-navigation-drawer v-model="visual.navBarShow">
    <v-list>
      <v-list-item
        link
        to="/"
        title="Home"
        prepend-icon="mdi-home"
      ></v-list-item>
      <v-list-item
        link
        to="/warehouse"
        title="Warehouses"
        prepend-icon="mdi-warehouse"
      ></v-list-item>
      <v-dialog max-width="500" v-model="isDialogActive">
        <template v-slot:activator="{ props: activatorProps }">
          <v-list-item
            v-bind="activatorProps"
            link
            title="Volumes"
            prepend-icon="mdi-bucket"
          ></v-list-item>
        </template>

        <v-card title="Welcome to the Roadmap">
          <v-card-text>
            <div class="mb-2">Excited about the future of Lakekeeper?</div>

            Join the conversation and shape the journey!
            <a
              href="https://github.com/lakekeeper/lakekeeper/discussions/409"
              target="_blank"
            >
              Click here </a
            >to explore and contribute to the roadmap discussion about Volumes
            on GitHub.
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Close"
              @click="isDialogActive = false"
              color="info"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-list-item
        link
        @click="routeToRoles"
        title="Roles"
        prepend-icon="mdi-account-key"
      ></v-list-item>
      <v-list-item
        link
        to="/server-settings"
        title="Server settings"
        prepend-icon="mdi-cog"
      ></v-list-item>
    </v-list>
    <v-snackbar v-model="snackbarVisible" timeout="3000">
      Volumes are not active yet
    </v-snackbar>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useVisualStore } from "../stores/visual";

import router from "../router";
import { enabledAuthorization } from "../app.config";
import { Type } from "../common/interfaces";

const visual = useVisualStore();
const snackbarVisible = ref(false);
const isDialogActive = ref(false);

function routeToRoles() {
  if (enabledAuthorization) {
    router.push("/roles");
  } else {
    visual.setSnackbarMsg({
      function: "routeToRoles",
      text: "Authorization is disabled",
      ttl: 3000,
      ts: Date.now(),
      type: Type.INFO,
    });
  }
}
</script>
