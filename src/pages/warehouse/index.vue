<template>
  <v-row class="ml-1">
    <v-col>
      <v-breadcrumbs :items="['warehouses']"></v-breadcrumbs>

      <!-- Single flex container for navigation + content -->
      <div style="display: flex; height: calc(100vh - 200px); position: relative">
        <!-- Left: Navigation Tree -->
        <v-expand-x-transition>
          <div v-show="!isNavigationCollapsed" style="display: flex; height: 100%">
            <div
              :style="{
                width: leftWidth + 'px',
                minWidth: '200px',
                maxWidth: '800px',
                height: '100%',
                overflow: 'visible',
                borderRight: '1px solid rgba(var(--v-theme-on-surface), 0.12)',
              }">
              <WarehousesNavigationTree @navigate="handleNavigate" />
            </div>

            <!-- Resizable Divider -->
            <div
              @mousedown="startResize"
              style="
                width: 5px;
                cursor: col-resize;
                user-select: none;
                flex-shrink: 0;
                transition: background 0.3s;
              "
              :style="{
                background:
                  dividerHover || isResizing ? '#2196F3' : 'rgba(var(--v-theme-on-surface), 0.12)',
              }"
              @mouseenter="dividerHover = true"
              @mouseleave="dividerHover = false"></div>
          </div>
        </v-expand-x-transition>

        <!-- Right: Warehouse Manager (table content) -->
        <div style="flex: 1; height: 100%; overflow-y: auto; min-width: 0">
          <WarehouseManager />
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { useVisualStore } from '@lakekeeper/console-components';
import { useRouter } from 'vue-router';
const router = useRouter();
const leftWidth = ref(300); // Initial width in pixels

const dividerHover = ref(false);
const isResizing = ref(false);
const visual = useVisualStore();
const isNavigationCollapsed = computed({
  get: () => visual.isNavigationCollapsed,
  set: (value: boolean) => {
    visual.isNavigationCollapsed = value;
  },
});

function startResize(e: MouseEvent) {
  isResizing.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;

  function onMouseMove(e: MouseEvent) {
    const delta = e.clientX - startX;
    const newWidth = startWidth + delta;
    // Constrain between 200px and 800px
    leftWidth.value = Math.max(200, Math.min(800, newWidth));
  }

  function onMouseUp() {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleNavigate(item: {
  type: string;
  warehouseId: string;
  namespaceId?: string;
  name: string;
  tab?: string;
}) {
  // Convert namespace path from dot notation to API format for routing
  const namespaceForRoute = item.namespaceId?.split('.').join('\x1F');

  if (item.type === 'warehouse') {
    visual.whId = item.warehouseId;
    router.push(`/warehouse/${item.warehouseId}`);
  } else if (item.type === 'namespace' && namespaceForRoute) {
    const route = `/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}`;
    // Add tab as query parameter if provided
    if (item.tab) {
      router.push({ path: route, query: { tab: item.tab } });
    } else {
      router.push(route);
    }
  } else if (item.type === 'table' && namespaceForRoute) {
    router.push(`/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}/table/${item.name}`);
  } else if (item.type === 'view' && namespaceForRoute) {
    router.push(`/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}/view/${item.name}`);
  }
}
</script>
