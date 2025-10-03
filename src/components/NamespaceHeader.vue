<template>
  <v-toolbar class="mb-4" color="transparent" density="compact" flat>
    <v-toolbar-title>
      <span class="text-subtitle-1">
        {{
          namespacePath.length > 0
            ? namespacePath.split(String.fromCharCode(0x1f)).join('.')
            : namespaceName
        }}
      </span>
    </v-toolbar-title>
    <template #prepend>
      <v-icon>mdi-folder-open</v-icon>
    </template>
    <v-spacer></v-spacer>
    <v-btn
      prepend-icon="mdi-magnify"
      class="mr-2"
      size="small"
      variant="outlined"
      @click="showSearchDialog = true"
      aria-label="Search tables and views">
      Search warehouse
    </v-btn>

    <!-- Search Modal -->
    <SearchTabular v-model="showSearchDialog" :warehouse-id="warehouseId" />
  </v-toolbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import type { GetNamespaceResponse } from '@/gen/iceberg/types.gen';
import SearchTabular from './SearchTabular.vue';

const props = defineProps<{
  warehouseId: string;
  namespacePath: string;
}>();

const functions = useFunctions();
const showSearchDialog = ref(false);
const namespace = ref<GetNamespaceResponse>({ namespace: [] });

const namespaceName = computed(() => {
  const ns = namespace.value.namespace;
  return ns && ns.length > 0 ? ns[ns.length - 1] : '';
});

onMounted(loadNamespaceMetadata);
watch(() => props.namespacePath, loadNamespaceMetadata);

async function loadNamespaceMetadata() {
  try {
    namespace.value = await functions.loadNamespaceMetadata(props.warehouseId, props.namespacePath);
  } catch (error) {
    console.error('Failed to load namespace metadata:', error);
  }
}
</script>
