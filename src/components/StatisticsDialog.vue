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
              <v-tab density="compact" value="plot">plot</v-tab>
              <v-tab density="compact" value="tables">table</v-tab>
            </v-tabs>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="plot">
                <Line :data="data" :options="options" />
              </v-tabs-window-item>
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
const isDialogActive = ref(false);
const tab = ref('plot');
const props = defineProps<{
  stats: WarehouseStatistics[];
}>();
onMounted(() => {
  const sortedStats = [...props.stats].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  data.labels = sortedStats.map((stat) => formatDate(stat.timestamp));
  data.datasets[0].data = sortedStats.map((stat) => stat.number_of_tables);
  data.datasets[1].data = sortedStats.map((stat) => stat.number_of_views);
});

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    backgroundColor: string;
    data: number[];
  }[];
}

const data = reactive<ChartData>({
  labels: [],
  datasets: [
    {
      label: 'Number of Tables',
      backgroundColor: '#1e857d',
      data: [],
    },
    {
      label: 'Number of Views',
      backgroundColor: '#0097fb',
      data: [],
    },
  ],
});

const options = reactive({
  responsive: true,
  maintainAspectRatio: false,
});

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
