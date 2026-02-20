<template>
  <v-container fluid style="height: calc(100vh - 64px); padding: 0">
    <LoQEExplorer :base-url-prefix="baseUrlPrefix" :auto-init="true" />
  </v-container>
</template>

<script lang="ts" setup>
import { baseUrlPrefix } from '@/app.config';
</script>
