<template>
  <v-dialog v-model="isDialogActive" max-width="800">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        density="default"
        icon="mdi-information-box-outline"
        size="small"
        color="info"></v-btn>
    </template>

    <v-card title="Warehouse Statistics">
      <v-card-text>
        <v-row>
          <v-col>
            <v-tabs v-model="tab" density="compact">
              <v-tab density="compact" value="plat">plot</v-tab>
              <v-tab density="compact" value="tables">table</v-tab>
            </v-tabs>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="plot"></v-tabs-window-item>
              <v-tabs-window-item value="tables">
                <v-data-table fixed-header :headers="headersStatistics" hover :items="props.stats">
                  <template v-slot:item.timestamp="{ item }">
                    {{ formatDate(item.timestamp) }}
                  </template>
                  <template v-slot:item.updated_at="{ item }">
                    {{ formatDate(item.updated_at) }}
                  </template>
                  <template #no-data>
                    <div>No statiscs available</div>
                  </template>
                </v-data-table>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn color="info" text="Close" @click="isDialogActive = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { Header } from '@/common/interfaces';
import { WarehouseStatistics } from '@/gen/management/types.gen';
import { defineProps, ref } from 'vue';

const isDialogActive = ref(false);
const tab = ref('plot');
const props = defineProps<{
  stats: WarehouseStatistics[];
}>();

const headersStatistics: readonly Header[] = Object.freeze([
  { title: 'Number of tables', key: 'number_of_tables', align: 'start' },
  { title: 'Number of views', key: 'number_of_views' },
  { title: 'Created', key: 'timestamp' },
  { title: 'Updated', key: 'updated_at' },
]);

function formatDate(dateString: string) {
  const options = {
    year: 'numeric' as const,
    month: '2-digit' as const,
    day: '2-digit' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    second: '2-digit' as const,
  };
  return new Date(dateString).toLocaleDateString('en-US', options).replace(',', '');
}
</script>
