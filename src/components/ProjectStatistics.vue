<template>
  <v-switch
    v-model="statisticsVisualTableSwitch"
    color="primary"
    :label="statisticsVisualTableSwitch ? 'Table' : 'Chart'"></v-switch>
  <v-card v-if="statisticsVisualTableSwitch">
    <v-data-table-virtual
      fixed-header
      height="50vh"
      :headers="headersStatistics"
      hover
      :items="tableStatisticsFormatted">
      <template #top>
        <v-toolbar color="transparent" density="compact" flat>
          <v-spacer></v-spacer>
          <span class="icon-text">
            <v-btn
              size="small"
              prepend-icon="mdi-file-download"
              variant="outlined"
              color="primary"
              @click="downloadStatsAsCSV">
              Download
            </v-btn>
          </span>
        </v-toolbar>
      </template>
      <template v-slot:item.timestamp="{ item }">
        {{ formatDate(item.timestamp) }}
      </template>
      <template #no-data>
        <div>No statiscs available</div>
      </template>
    </v-data-table-virtual>
  </v-card>
  <div v-else style="height: 50vh">
    <Line :data="data" :options="options" />
  </div>
</template>

<script setup lang="ts">
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
  ChartData,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { GetEndpointStatisticsResponse } from '@/gen/management/types.gen';
import { Header } from '@/common/interfaces';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const loaded = ref(true);
const statisticsVisualTableSwitch = ref(true);
const data = reactive<ChartData<'line'>>({
  labels: [],
  datasets: [
    {
      label: 'Number of API calls',
      backgroundColor: '#1e857d',
      borderColor: '#1e857d',
      data: [],
    },
  ],
});
const options = reactive({
  responsive: true,
  maintainAspectRatio: false,
});

const headersStatistics: readonly Header[] = Object.freeze([
  { title: 'Timestamp', key: 'timestamp', align: 'start' },
  { title: 'Count', key: 'count', align: 'start' },
  { title: 'HTTP Route', key: 'httpRoute', align: 'start' },
  { title: 'Status Code', key: 'statusCode', align: 'start' },
  { title: 'Warehouse ID', key: 'warehouseId', align: 'start' },
  { title: 'Warehouse Name', key: 'warehouseName', align: 'start' },
  { title: 'Created At', key: 'createdAt', align: 'start' },
  { title: 'Updated At', key: 'updatedAt', align: 'start' },
]);

const tableStatisticsFormatted = ref<
  Array<{
    timestamp: string;
    count: number;
    httpRoute: string;
    statusCode: number;
    warehouseId: string | null;
    warehouseName: string | null;
    createdAt: string;
    updatedAt: string | null;
  }>
>([]);

const props = defineProps<{
  stats: GetEndpointStatisticsResponse;
}>();

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

function downloadStatsAsCSV() {
  if (!tableStatisticsFormatted.value || tableStatisticsFormatted.value.length === 0) {
    console.warn('No statistics available to download.');
    return;
  }

  // Define CSV headers
  const csvHeaders = [
    'Timestamp',
    'Count',
    'HTTP Route',
    'Status Code',
    'Warehouse ID',
    'Warehouse Name',
    'Created At',
    'Updated At',
  ];

  // Map rows from tableStatisticsFormatted
  const csvRows = tableStatisticsFormatted.value.map((stat) => [
    formatDate(stat.timestamp),
    stat.count,
    stat.httpRoute,
    stat.statusCode,
    stat.warehouseId ?? '',
    stat.warehouseName ?? '',
    formatDate(stat.createdAt),
    stat.updatedAt ? formatDate(stat.updatedAt) : '',
  ]);

  // Combine headers and rows into CSV content
  const csvContent = [
    csvHeaders.join(','), // Add headers
    ...csvRows.map((row) => row.join(',')), // Add rows
  ].join('\n');

  // Create a Blob and trigger download
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `endpoint-statistics_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  try {
    // Step 1: Format the raw statistics into a table-friendly format
    const formattedTableData = formatStatisticsTable(props.stats);

    // Step 2: Aggregate data by date-hour
    const aggregatedData: { [key: string]: number } = {};
    const timestamps = formattedTableData.map((entry) => new Date(entry.timestamp));

    // Find the range of timestamps
    const minTimestamp = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const maxTimestamp = new Date(Math.max(...timestamps.map((t) => t.getTime())));

    // Normalize timestamps to date-hour and aggregate counts
    formattedTableData.forEach((entry) => {
      const dateHour = new Date(entry.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      if (!aggregatedData[dateHour]) {
        aggregatedData[dateHour] = 0;
      }
      aggregatedData[dateHour] += entry.count;
    });

    // Step 3: Fill in gaps with count 0
    const filledData: { label: string; count: number }[] = [];
    let currentTimestamp = new Date(minTimestamp);

    while (currentTimestamp <= maxTimestamp) {
      const dateHour = currentTimestamp.toISOString().slice(0, 13) + ':00:00Z';
      filledData.push({
        label: dateHour,
        count: aggregatedData[dateHour] || 0,
      });
      currentTimestamp.setHours(currentTimestamp.getHours() + 1); // Increment by 1 hour
    }

    // Step 4: Update chart data
    data.labels = filledData.map((item) => formatDate(item.label));
    data.datasets[0].data = filledData.map((item) => item.count);

    // Step 5: Update table data
    tableStatisticsFormatted.value.splice(0, tableStatisticsFormatted.value.length);
    tableStatisticsFormatted.value.push(...formattedTableData);

    console.log('Aggregated Chart Data:', filledData);
    console.log('Table Data:', tableStatisticsFormatted.value);
  } catch (error) {
    console.error(error);
  } finally {
    loaded.value = true;
  }
});

function formatStatisticsTable(statistics: any) {
  const result: Array<{
    timestamp: string;
    count: number;
    httpRoute: string;
    statusCode: number;
    warehouseId: string | null;
    warehouseName: string | null;
    createdAt: string;
    updatedAt: string | null;
  }> = [];

  // Iterate over timestamps and their corresponding called-endpoints arrays
  statistics.timestamps.forEach((timestamp: string, index: number) => {
    const endpointsGroup = statistics['called-endpoints'][index]; // Get the array of endpoints for the current timestamp
    if (endpointsGroup) {
      endpointsGroup.forEach((endpoint: any) => {
        const row = {
          timestamp, // Add timestamp to each endpoint object
          count: endpoint.count,
          httpRoute: endpoint['http-route'],
          statusCode: endpoint['status-code'],
          warehouseId: endpoint['warehouse-id'] ?? null,
          warehouseName: endpoint['warehouse-name'] ?? null,
          createdAt: endpoint['created-at'],
          updatedAt: endpoint['updated-at'] ?? null,
        };
        result.push(row);
      });
    }
  });

  return result;
}
</script>
