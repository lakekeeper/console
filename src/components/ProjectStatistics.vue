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
    <v-switch
      v-model="drillDownSwitch"
      color="primary"
      :label="drillDownSwitch ? 'Drill-Down View' : 'Aggregated View'"></v-switch>
    <Line v-if="drillDownSwitch" :data="data" :options="options" />
    <Line v-else :data="data" :options="options" />
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
const drillDownSwitch = ref(false);
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
function updateChartData(
  filledData: Array<{ label: string; counts: { total: number; [statusCategory: string]: number } }>,
) {
  data.labels?.splice(0, data.labels.length);
  data.datasets.splice(0, data.datasets.length);
  if (drillDownSwitch.value) {
    // Drill-down view
    data.labels = filledData.map((item) => formatDate(item.label));
    data.datasets = [
      {
        label: '2xx',
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
        data: filledData.map((item) => item.counts['2xx']),
      },
      {
        label: '3xx',
        backgroundColor: '#ff9800',
        borderColor: '#ff9800',
        data: filledData.map((item) => item.counts['3xx']),
      },
      {
        label: '4xx',
        backgroundColor: '#f44336',
        borderColor: '#f44336',
        data: filledData.map((item) => item.counts['4xx']),
      },
      {
        label: '5xx',
        backgroundColor: '#9c27b0',
        borderColor: '#9c27b0',
        data: filledData.map((item) => item.counts['5xx']),
      },
      {
        label: 'Other',
        backgroundColor: '#607d8b',
        borderColor: '#607d8b',
        data: filledData.map((item) => item.counts['Other']),
      },
    ];
  } else {
    // Aggregated view
    data.labels = filledData.map((item) => formatDate(item.label));
    data.datasets = [
      {
        label: 'Total API Calls',
        backgroundColor: '#1e857d',
        borderColor: '#1e857d',
        data: filledData.map((item) => item.counts.total),
      },
    ];
  }
}

onMounted(() => {
  try {
    // Step 1: Format the raw statistics into a table-friendly format
    const formattedTableData = formatStatisticsTable(props.stats);

    // Step 2: Aggregate data by date-hour and status code categories
    const aggregatedData: { [key: string]: { total: number; [statusCategory: string]: number } } =
      {};
    const timestamps = formattedTableData.map((entry) => new Date(entry.timestamp));

    // Find the range of timestamps
    const minTimestamp = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const maxTimestamp = new Date(Math.max(...timestamps.map((t) => t.getTime())));

    // Helper function to categorize status codes
    function getStatusCategory(statusCode: number): string {
      if (statusCode >= 200 && statusCode < 300) return '2xx';
      if (statusCode >= 300 && statusCode < 400) return '3xx';
      if (statusCode >= 400 && statusCode < 500) return '4xx';
      if (statusCode >= 500 && statusCode < 600) return '5xx';
      return 'Other';
    }

    // Normalize timestamps to date-hour and aggregate counts by status category
    formattedTableData.forEach((entry) => {
      const dateHour = new Date(entry.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      const statusCategory = getStatusCategory(entry.statusCode);

      if (!aggregatedData[dateHour]) {
        aggregatedData[dateHour] = { total: 0, '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, Other: 0 };
      }
      aggregatedData[dateHour].total += entry.count;
      aggregatedData[dateHour][statusCategory] += entry.count;
    });

    // Step 3: Fill in gaps with count 0 for all status categories
    const filledData: {
      label: string;
      counts: { total: number; [statusCategory: string]: number };
    }[] = [];
    let currentTimestamp = new Date(minTimestamp);

    while (currentTimestamp <= maxTimestamp) {
      const dateHour = currentTimestamp.toISOString().slice(0, 13) + ':00:00Z';
      filledData.push({
        label: dateHour,
        counts: aggregatedData[dateHour] || {
          total: 0,
          '2xx': 0,
          '3xx': 0,
          '4xx': 0,
          '5xx': 0,
          Other: 0,
        },
      });
      currentTimestamp.setHours(currentTimestamp.getHours() + 1); // Increment by 1 hour
    }

    // Step 4: Update chart data using the new function
    updateChartData(filledData);

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

watch(drillDownSwitch, (newValue, old) => {
  // Reuse the filledData from onMounted or recompute it if necessary
  if (drillDownSwitch) {
    const filledData = tableStatisticsFormatted.value.map((item) => ({
      label: item.timestamp,
      counts: {
        total: item.count,
        '2xx': item.statusCode >= 200 && item.statusCode < 300 ? item.count : 0,
        '3xx': item.statusCode >= 300 && item.statusCode < 400 ? item.count : 0,
        '4xx': item.statusCode >= 400 && item.statusCode < 500 ? item.count : 0,
        '5xx': item.statusCode >= 500 && item.statusCode < 600 ? item.count : 0,
        Other: item.statusCode < 200 || item.statusCode >= 600 ? item.count : 0,
      },
    }));
    updateChartData(filledData);
  } else {
    const filledData = tableStatisticsFormatted.value.map((item) => ({
      label: item.timestamp,
      counts: {
        total: item.count,
        '2xx': item.statusCode >= 200 && item.statusCode < 300 ? item.count : 0,
        '3xx': item.statusCode >= 300 && item.statusCode < 400 ? item.count : 0,
        '4xx': item.statusCode >= 400 && item.statusCode < 500 ? item.count : 0,
        '5xx': item.statusCode >= 500 && item.statusCode < 600 ? item.count : 0,
        Other: item.statusCode < 200 || item.statusCode >= 600 ? item.count : 0,
      },
    }));

    updateChartData(filledData);
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
