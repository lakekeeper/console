<template>
  <v-row>
    <v-col class="align-self-center">
      <NoAccessPage />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { NoAccessPage } from '@lakekeeper/console-components';
// Ensure the library stylesheet is present on this route (it isn't imported
// globally); without it the NoAccessPage's scoped styles — incl. the Tetris
// board grid — don't apply. Matches the pattern in bootstrap.vue.
import '@lakekeeper/console-components/style.css';
</script>
