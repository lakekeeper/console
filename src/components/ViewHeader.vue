<template>
  <v-toolbar class="mb-4" color="transparent" density="compact" flat>
    <v-toolbar-title>
      <span class="text-subtitle-1">{{ namespacePath }}.{{ viewName }}</span>
    </v-toolbar-title>
    <template #prepend>
      <v-icon>mdi-table</v-icon>
    </template>
    <v-spacer></v-spacer>
    <v-btn
      icon="mdi-magnify"
      variant="text"
      @click="openSearchDialog"
      aria-label="Search tables and views"></v-btn>
  </v-toolbar>

  <!-- Search Modal -->
  <SearchTabular v-model="showSearchDialog" :warehouse-id="warehouseId" />
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  viewName: string;
}>();

const showSearchDialog = ref(false);

const namespacePath = computed(() => {
  return props.namespaceId.split(String.fromCharCode(0x1f)).join('.');
});

function openSearchDialog() {
  showSearchDialog.value = true;
}
</script>
