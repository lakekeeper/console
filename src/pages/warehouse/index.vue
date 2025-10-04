<template>
  <v-row class="ml-1">
    <v-col>
      <v-breadcrumbs :items="['warehouses']"></v-breadcrumbs>
      <WarehouseManager />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { WarehouseManager } from '@lakekeeper/console-components';
</script>
