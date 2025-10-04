<template>
  <v-toolbar class="mb-4" color="transparent" density="compact" flat>
    <v-toolbar-title>
      <span class="text-subtitle-1">
        {{ namespacePath.split(String.fromCharCode(0x1f)).join('.') }}
      </span>
    </v-toolbar-title>
    <template #prepend>
      <v-icon>mdi-table</v-icon>
    </template>
    <v-spacer></v-spacer>
    <v-btn
      icon="mdi-magnify"
      variant="text"
      @click="showSearchDialog = true"
      aria-label="Search tables and views"></v-btn>

    <!-- Search Modal -->
    <SearchTabular v-model="showSearchDialog" :warehouse-id="warehouseId" />
  </v-toolbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  tableName: string;
}>();

const showSearchDialog = ref(false);

const namespacePath = computed(
  () => `${props.namespaceId}${String.fromCharCode(0x1f)}${props.tableName}`,
);
</script>
