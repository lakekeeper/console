<template>
  <v-container
    fluid
    style="
      height: calc(100vh - var(--v-layout-top, 48px) - var(--v-layout-bottom, 32px));
      padding: 0;
      overflow: hidden;
    ">
    <LoQEExplorer :base-url-prefix="baseUrlPrefix" :auto-init="true" />
  </v-container>
</template>

<script lang="ts" setup>
import { baseUrlPrefix } from '@/app.config';
</script>
