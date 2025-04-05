<template>
  <v-switch
    v-model="statisticsVisualTableSwitch"
    :color="statisticsVisualTableSwitch ? 'primary' : 'success'"
    :label="statisticsVisualTableSwitch ? 'Table' : 'Chart'"></v-switch>
  <v-card>
    <v-data-table-virtual
      v-if="statisticsVisualTableSwitch"
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
        <div>No statistics available</div>
      </template>
    </v-data-table-virtual>

    <v-row v-else>
      <v-col cols="6">
        <v-btn color="primary" variant="outlined" @click="drillDownSwitch = !drillDownSwitch">
          <v-icon left>{{ drillDownSwitch ? 'mdi-database-search' : 'mdi-database' }}</v-icon>
          {{ drillDownSwitch ? 'Drill-Down View' : 'Aggregated View' }}
        </v-btn>
        <Line v-if="drillDownSwitch" :data="data_aggr_all" :options="options" />
        <Line v-else :data="data_aggr_by_code" :options="options" style="height: 40vh" />
      </v-col>
    </v-row>
  </v-card>
</template>
<script setup lang="ts">
import { defineProps, ref, reactive, onMounted } from 'vue';
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

const headersStatistics: readonly Header[] = Object.freeze([
  { title: 'Timestamp', key: 'timestamp', align: 'start', sortable: true },
  { title: 'Count', key: 'count', align: 'start', sortable: true },
  { title: 'HTTP Route', key: 'httpRoute', align: 'start', sortable: true },
  { title: 'Status Code', key: 'statusCode', align: 'start', sortable: true },
  { title: 'Warehouse ID', key: 'warehouseId', align: 'start', sortable: true },
  { title: 'Warehouse Name', key: 'warehouseName', align: 'start', sortable: true },
  { title: 'Created At', key: 'createdAt', align: 'start', sortable: true },
  { title: 'Updated At', key: 'updatedAt', align: 'start', sortable: true },
]);
const statisticsVisualTableSwitch = ref(true);
const drillDownSwitch = ref(false);

const data_aggr_all = reactive<ChartData<'line'>>({
  labels: [],
  datasets: [],
});

const data_aggr_by_code = reactive<ChartData<'line'>>({
  labels: [],
  datasets: [],
});

const options = {
  responsive: true,
  maintainAspectRatio: true,
};

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

onMounted(() => {
  try {
    const formattedTableData = formatStatisticsTable(props.stats);

    // Aggregate data for `data_aggr_all`
    const aggregatedAll = formattedTableData.reduce(
      (acc, entry) => {
        const dateHour = new Date(entry.timestamp).toISOString().slice(0, 13) + ':00:00Z';
        if (!acc[dateHour]) acc[dateHour] = 0;
        acc[dateHour] += entry.count;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log('aggregatedAll', aggregatedAll);
    data_aggr_all.labels = Object.keys(aggregatedAll);
    data_aggr_all.datasets = [
      {
        label: 'Total API Calls',
        backgroundColor: '#1e857d',
        borderColor: '#1e857d',
        data: Object.values(aggregatedAll),
      },
    ];

    // Aggregate data for `data_aggr_by_code`
    const aggregatedByCode = formattedTableData.reduce(
      (acc, entry) => {
        const dateHour = new Date(entry.timestamp).toISOString().slice(0, 13) + ':00:00Z';
        const statusCategory = getStatusCategory(entry.statusCode);
        if (!acc[dateHour]) acc[dateHour] = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, Other: 0 };
        acc[dateHour][statusCategory] += entry.count;
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    );
    console.log('aggregatedByCode', aggregatedByCode);
    data_aggr_by_code.labels = Object.keys(aggregatedByCode);
    data_aggr_by_code.datasets = [
      {
        label: '2xx',
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
        data: Object.values(aggregatedByCode).map((item) => item['2xx']),
      },
      {
        label: '3xx',
        backgroundColor: '#ff9800',
        borderColor: '#ff9800',
        data: Object.values(aggregatedByCode).map((item) => item['3xx']),
      },
      {
        label: '4xx',
        backgroundColor: '#f44336',
        borderColor: '#f44336',
        data: Object.values(aggregatedByCode).map((item) => item['4xx']),
      },
      {
        label: '5xx',
        backgroundColor: '#9c27b0',
        borderColor: '#9c27b0',
        data: Object.values(aggregatedByCode).map((item) => item['5xx']),
      },
      {
        label: 'Other',
        backgroundColor: '#607d8b',
        borderColor: '#607d8b',
        data: Object.values(aggregatedByCode).map((item) => item['Other']),
      },
    ];
    console.log('data_aggr_by_code', data_aggr_by_code);
    tableStatisticsFormatted.value.splice(0, tableStatisticsFormatted.value.length);
    tableStatisticsFormatted.value.push(...formattedTableData);
  } catch (error) {
    console.error(error);
  }
});

function getStatusCategory(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return '2xx';
  if (statusCode >= 300 && statusCode < 400) return '3xx';
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500 && statusCode < 600) return '5xx';
  return 'Other';
}

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

  statistics.timestamps.forEach((timestamp: string, index: number) => {
    const endpointsGroup = statistics['called-endpoints'][index];
    if (endpointsGroup) {
      endpointsGroup.forEach((endpoint: any) => {
        result.push({
          timestamp,
          count: endpoint.count,
          httpRoute: endpoint['http-route'],
          statusCode: endpoint['status-code'],
          warehouseId: endpoint['warehouse-id'] ?? null,
          warehouseName: endpoint['warehouse-name'] ?? null,
          createdAt: endpoint['created-at'],
          updatedAt: endpoint['updated-at'] ?? null,
        });
      });
    }
  });

  return result;
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
</script>
