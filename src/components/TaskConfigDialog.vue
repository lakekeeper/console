<template>
  <!-- Task Config - Lakekeeper PLUS only -->
  <v-list-item @click="openDialog">
    <template #prepend>
      <v-icon>mdi-cog-outline</v-icon>
    </template>
    <v-list-item-title>Task Config</v-list-item-title>
    <template #append>
      <v-chip size="x-small" color="primary" variant="tonal">PLUS</v-chip>
    </template>
  </v-list-item>

  <!-- Task Config PLUS Feature Dialog -->
  <v-dialog v-model="showTaskConfigDialog" max-width="500px">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-star</v-icon>
        Lakekeeper PLUS Feature
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-4">
        <div class="text-center mb-4">
          <v-icon size="64" color="primary">mdi-cog-outline</v-icon>
        </div>

        <div class="text-h6 text-center mb-3">Task Configuration</div>

        <div class="text-body-1 mb-3">
          Task Configuration allows you to customize and manage automated tasks for your warehouse
          including:
        </div>

        <v-list density="compact" class="mb-3">
          <v-list-item>
            <template #prepend>
              <v-icon size="small">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Tabular Expiration Settings</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon size="small">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Tabular Purge Configuration</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon size="small">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Custom Task Queues</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon size="small">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Advanced Scheduling Options</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-alert type="info" variant="tonal" density="compact">
          <strong>This feature is available in Lakekeeper PLUS.</strong>
          Upgrade to unlock advanced task management capabilities.
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" variant="text" @click="showTaskConfigDialog = false">Close</v-btn>
        <v-btn
          color="success"
          variant="flat"
          size="small"
          @click="scheduleMeeting('https://zcal.co/viktor-kessler/demo')">
          request a demo
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          href="mailto:info@vakamo.com?subject=Demo%20Lakekeeper%20PLUS&body=Hello%20Lakekeeper%20Team%2C%0A%0AI%20want%20to%20know%20more%20about%20the%20PLUS%20capabilities.">
          Contact us
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { GetWarehouseResponse } from '@/gen/management/types.gen';

defineProps<{
  warehouse: GetWarehouseResponse;
}>();

const showTaskConfigDialog = ref(false);

const openDialog = (event: Event) => {
  // Prevent the parent menu from closing
  event.stopPropagation();
  showTaskConfigDialog.value = true;
};

const scheduleMeeting = (url: string) => {
  // trackEvent('demo-request'); // TODO: Add analytics tracking
  window.open(url, '_blank');
};
</script>
