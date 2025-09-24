<template>
  <div class="pa-4">
    <div class="text-h6 mb-4 d-flex align-center">
      <v-icon class="mr-2">mdi-source-branch</v-icon>
      Branch Graph
    </div>

    <div
      v-if="!table.metadata.refs || Object.keys(table.metadata.refs).length === 0"
      class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-source-branch-remove</v-icon>
      <div class="text-h6 mt-2 text-grey-lighten-1">No branches found</div>
      <div class="text-body-1 text-grey-lighten-1">This table has no branch references</div>
    </div>

    <div v-else class="graph-container">
      <v-row>
        <!-- Graph Column -->
        <v-col cols="12" lg="8">
          <v-card variant="outlined" class="pa-4">
            <!-- Zoom Controls -->
            <div class="d-flex align-center mb-3">
              <v-btn-group variant="outlined" size="x-small">
                <v-btn
                  :disabled="zoomScale >= maxZoom"
                  size="small"
                  @click="zoomIn"
                  prepend-icon="mdi-magnify-plus"></v-btn>
                <v-btn @click="resetZoom" prepend-icon="mdi-magnify" size="small">
                  {{ Math.round(zoomScale * 100) }}%
                </v-btn>
                <v-btn
                  :disabled="zoomScale <= minZoom"
                  size="small"
                  @click="zoomOut"
                  prepend-icon="mdi-magnify-minus"></v-btn>
              </v-btn-group>
            </div>

            <div
              class="graph-content"
              :style="{
                height: Math.min(graphHeight + 50, 700) + 'px',
                overflow: 'auto',
                border: '1px solid rgba(var(--v-border-color), var(--v-border-opacity))',
                borderRadius: '4px',
              }">
              <svg
                :width="graphWidth * zoomScale"
                :height="graphHeight * zoomScale"
                :viewBox="`0 0 ${graphWidth} ${graphHeight}`"
                class="branch-graph"
                style="display: block">
                <g :transform="`scale(${zoomScale})`">
                  <defs>
                    <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3" />
                    </filter>
                  </defs>

                  <!-- Branch lines -->
                  <g v-for="(path, branchName) in branchPaths" :key="branchName">
                    <path
                      :d="path.pathData"
                      :stroke="path.color"
                      stroke-width="3"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      opacity="0.8" />
                  </g>

                  <!-- Snapshot nodes -->
                  <g v-for="node in graphNodes" :key="node.id">
                    <circle
                      :cx="node.x"
                      :cy="node.y"
                      :r="node.radius"
                      :fill="node.color"
                      :stroke="node.strokeColor"
                      :stroke-width="selectedSnapshot?.['snapshot-id'] === node.snapshotId ? 4 : 3"
                      filter="url(#nodeShadow)"
                      style="cursor: pointer"
                      @click="selectSnapshot(node.snapshotId)" />

                    <!-- Sequence number inside the node -->
                    <text
                      :x="node.x"
                      :y="node.y - 2"
                      font-size="10"
                      font-weight="bold"
                      fill="white"
                      text-anchor="middle"
                      style="cursor: pointer; pointer-events: none">
                      {{ node.sequenceNumber }}
                    </text>

                    <!-- Schema change indicator below sequence number -->
                    <text
                      v-if="node.schemaChangeInfo?.hasSchemaChange"
                      :x="node.x"
                      :y="node.y + 8"
                      font-size="8"
                      font-weight="bold"
                      fill="white"
                      text-anchor="middle"
                      style="pointer-events: none; opacity: 0.9">
                      {{ `S${node.schemaChangeInfo.fromSchema}→${node.schemaChangeInfo.toSchema}` }}
                    </text>

                    <!-- Schema change icon indicator -->
                    <circle
                      v-if="node.schemaChangeInfo?.hasSchemaChange"
                      :cx="node.x + node.radius - 2"
                      :cy="node.y - node.radius + 2"
                      r="6"
                      fill="#ff5722"
                      stroke="white"
                      stroke-width="1"
                      style="pointer-events: none"></circle>
                    <text
                      v-if="node.schemaChangeInfo?.hasSchemaChange"
                      :x="node.x + node.radius - 2"
                      :y="node.y - node.radius + 5"
                      font-size="8"
                      font-weight="bold"
                      fill="white"
                      text-anchor="middle"
                      style="pointer-events: none">
                      S
                    </text>

                    <!-- Branch labels -->
                    <text
                      v-for="branch in node.branches"
                      :key="branch"
                      :x="node.x + 20"
                      :y="node.y + 5"
                      font-size="12"
                      font-weight="500"
                      :fill="getBranchColor(branch)"
                      style="pointer-events: none">
                      {{ branch }}
                    </text>

                    <!-- Snapshot ID tooltip -->
                    <title>
                      Sequence: {{ node.sequenceNumber }} | Snapshot: {{ node.snapshotId
                      }}{{
                        node.schemaChangeInfo?.hasSchemaChange
                          ? ` | Schema: ${node.schemaChangeInfo.fromSchema}→${node.schemaChangeInfo.toSchema}`
                          : ''
                      }}
                    </title>
                  </g>
                </g>
              </svg>
            </div>
          </v-card>

          <!-- Legend -->
          <v-card variant="outlined" class="mt-4 pa-3">
            <div class="text-subtitle-2 mb-2">Legend</div>
            <div class="d-flex flex-wrap gap-4 mb-3">
              <div v-for="entry in legendEntries" :key="entry.name" class="d-flex align-center">
                <div
                  class="branch-color-indicator mr-2"
                  :style="{
                    backgroundColor: entry.color,
                    width: '16px',
                    height: '2px',
                    borderRadius: '2px',
                    opacity: entry.opacity,
                  }"></div>
                <span
                  class="text-body-2 mr-2"
                  :class="{ 'text-grey-darken-1': entry.type === 'dropped-branch' }">
                  {{ entry.name }}
                </span>
              </div>
            </div>
            <div class="d-flex flex-wrap gap-4 align-center">
              <div class="d-flex align-center">
                <div class="mr-2" style="position: relative">
                  <div
                    style="
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      background-color: #ff9800;
                      border: 2px solid #f57c00;
                    "></div>
                  <div
                    style="
                      position: absolute;
                      top: -2px;
                      right: -2px;
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background-color: #ff5722;
                      border: 1px solid white;
                    "></div>
                </div>
                <span class="text-body-2">Schema Changed</span>
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Details Column -->
        <v-col cols="12" lg="4">
          <v-card variant="outlined" class="pa-4" style="height: 60vh">
            <div v-if="!selectedSnapshot" class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-2">mdi-cursor-default-click</v-icon>
              <div class="text-h6 mt-2 text-grey-lighten-1">Select a Node</div>
              <div class="text-body-2 text-grey-lighten-1">
                Click on any node in the graph to view snapshot details
              </div>
            </div>

            <div v-else style="height: 100%; overflow-y: auto">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="text-h6 d-flex align-center">
                  <v-icon class="mr-2">mdi-camera-outline</v-icon>
                  Snapshot Details
                </div>
                <v-btn
                  icon="mdi-close"
                  size="small"
                  variant="flat"
                  @click="selectedSnapshot = null"></v-btn>
              </div>

              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h6">
                  ID: {{ selectedSnapshot['snapshot-id'] }}
                </v-card-title>
                <v-card-text>
                  <div class="mb-2">
                    <strong>Sequence:</strong>
                    {{ selectedSnapshot['sequence-number'] }}
                  </div>
                  <div class="mb-2">
                    <strong>Schema ID:</strong>
                    {{ selectedSnapshot['schema-id'] }}
                  </div>
                  <div class="mb-2">
                    <strong>Timestamp:</strong>
                    {{
                      selectedSnapshot['timestamp-ms']
                        ? new Date(selectedSnapshot['timestamp-ms']).toLocaleString()
                        : 'N/A'
                    }}
                  </div>
                  <div v-if="selectedSnapshot['parent-snapshot-id']" class="mb-2">
                    <strong>Parent:</strong>
                    {{ selectedSnapshot['parent-snapshot-id'] }}
                  </div>
                  <div v-if="selectedSnapshot.summary?.operation" class="mb-2">
                    <strong>Operation:</strong>
                    <v-chip
                      :color="getOperationColor(selectedSnapshot.summary.operation)"
                      size="small"
                      variant="flat"
                      class="ml-1">
                      {{ selectedSnapshot.summary.operation }}
                    </v-chip>
                  </div>
                  <div v-if="selectedSnapshot['manifest-list']" class="mb-2">
                    <strong>Manifest List:</strong>
                    <div class="text-caption text-wrap">
                      {{ selectedSnapshot['manifest-list'] }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Operational Summary -->
              <v-expansion-panels v-if="selectedSnapshot.summary" class="mb-4">
                <v-expansion-panel>
                  <v-expansion-panel-title>Operational Summary</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="summary-grid">
                      <div
                        v-for="[key, value] in Object.entries(selectedSnapshot.summary)"
                        :key="key"
                        class="mb-2">
                        <strong>{{ formatSummaryKey(key) }}:</strong>
                        <span class="ml-2">{{ formatSummaryValue(value) }}</span>
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- Schema Information -->
              <v-expansion-panels v-if="getSchemaInfo(selectedSnapshot['schema-id'])">
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    Schema Information
                    <v-chip
                      v-if="
                        getSchemaChanges(
                          selectedSnapshot,
                          snapshotHistory.findIndex(
                            (s) => s['snapshot-id'] === selectedSnapshot['snapshot-id'],
                          ),
                        )
                      "
                      size="x-small"
                      color="warning"
                      variant="flat"
                      class="ml-2">
                      Changed
                    </v-chip>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div
                      class="schema-fields-container"
                      style="max-height: 300px; overflow-y: auto">
                      <v-list density="compact">
                        <v-list-item
                          v-for="field in getSchemaInfo(selectedSnapshot['schema-id'])?.fields ||
                          []"
                          :key="field.id"
                          class="pa-1">
                          <template #prepend>
                            <v-icon
                              :color="
                                isFieldNew(
                                  field,
                                  selectedSnapshot,
                                  snapshotHistory.findIndex(
                                    (s) => s['snapshot-id'] === selectedSnapshot['snapshot-id'],
                                  ),
                                )
                                  ? 'success'
                                  : undefined
                              "
                              size="small">
                              {{ getFieldIcon(field) }}
                            </v-icon>
                          </template>
                          <v-list-item-title
                            :class="
                              isFieldNew(
                                field,
                                selectedSnapshot,
                                snapshotHistory.findIndex(
                                  (s) => s['snapshot-id'] === selectedSnapshot['snapshot-id'],
                                ),
                              )
                                ? 'text-success font-weight-bold'
                                : ''
                            ">
                            {{ field.name }}
                            <v-chip
                              v-if="
                                isFieldNew(
                                  field,
                                  selectedSnapshot,
                                  snapshotHistory.findIndex(
                                    (s) => s['snapshot-id'] === selectedSnapshot['snapshot-id'],
                                  ),
                                )
                              "
                              size="x-small"
                              color="success"
                              variant="flat"
                              class="ml-2">
                              New
                            </v-chip>
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ getFieldTypeString(field.type) }}
                            <span v-if="field.required" class="text-error ml-1">*</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

// Props
interface Props {
  table: any;
  snapshotHistory: any[];
}

const props = defineProps<Props>();

// Reactive data
const selectedSnapshot = ref<any>(null);

// Zoom functionality
const zoomScale = ref(1);
const minZoom = 0.1;
const maxZoom = 3;
const zoomStep = 0.1;

// Graph dimensions
const graphWidth = ref(1000);
const graphHeight = ref(700);

// Zoom functions
function zoomIn() {
  if (zoomScale.value < maxZoom) {
    zoomScale.value = Math.min(zoomScale.value + zoomStep, maxZoom);
  }
}

function zoomOut() {
  if (zoomScale.value > minZoom) {
    zoomScale.value = Math.max(zoomScale.value - zoomStep, minZoom);
  }
}

function resetZoom() {
  zoomScale.value = 1;
}

// Branch info computed
const branchInfo = computed(() => {
  const branches: Record<string, { color: string; type: string; snapshotId: number }> = {};
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b', '#c2185b'];
  let colorIndex = 0;

  // Add existing branches from refs
  if (props.table.metadata.refs) {
    Object.entries(props.table.metadata.refs).forEach(([branchName, refData]: [string, any]) => {
      branches[branchName] = {
        color: colors[colorIndex % colors.length],
        type: refData.type || 'branch',
        snapshotId: refData['snapshot-id'],
      };
      colorIndex++;
    });
  }

  // Detect dropped branches - improved logic
  if (props.snapshotHistory.length > 0) {
    const sortedSnapshots = [...props.snapshotHistory].sort((a, b) => {
      const seqA = a['sequence-number'] || 0;
      const seqB = b['sequence-number'] || 0;
      return seqA - seqB;
    });

    // Build a map of parent-child relationships
    const childrenMap = new Map<number, number[]>();
    sortedSnapshots.forEach((snapshot) => {
      const parentId = snapshot['parent-snapshot-id'];
      if (parentId) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(snapshot['snapshot-id']);
      }
    });

    // Build ancestry map only for the current heads of named branches
    const currentBranchHeads = new Set<number>();
    Object.values(branches).forEach((branch) => {
      currentBranchHeads.add(branch.snapshotId);
    });

    // Find all snapshots that are reachable from current branch heads
    const reachableFromBranches = new Set<number>();

    const traceReachable = (snapshotId: number, visited = new Set<number>()) => {
      if (visited.has(snapshotId) || reachableFromBranches.has(snapshotId)) return;
      visited.add(snapshotId);
      reachableFromBranches.add(snapshotId);

      const snapshot = sortedSnapshots.find((s) => s['snapshot-id'] === snapshotId);
      if (snapshot && snapshot['parent-snapshot-id']) {
        traceReachable(snapshot['parent-snapshot-id'], visited);
      }
    };

    // Trace from each current branch head
    currentBranchHeads.forEach((headId) => {
      traceReachable(headId);
    });

    // Find all snapshots that are not reachable from any current branch head
    const unreachableSnapshots = sortedSnapshots.filter((snapshot) => {
      const snapshotId = snapshot['snapshot-id'];
      const isNamedBranchHead = currentBranchHeads.has(snapshotId);
      const isReachableFromBranch = reachableFromBranches.has(snapshotId);

      // An unreachable snapshot is one that is not reachable from any current branch head
      return !isNamedBranchHead && !isReachableFromBranch;
    });

    // Group unreachable snapshots into dropped branch chains
    const processedSnapshots = new Set<number>();

    unreachableSnapshots.forEach((snapshot) => {
      const snapshotId = snapshot['snapshot-id'];
      if (processedSnapshots.has(snapshotId)) return;

      const currentSeq = snapshot['sequence-number'] || 0;
      if (currentSeq <= 1) return; // Don't consider the initial snapshot

      // Find the root of this dropped branch chain
      let headSnapshot = snapshot;
      let current = snapshot;

      // Trace back to find the head of this dropped branch
      while (current && current['parent-snapshot-id']) {
        const parent = sortedSnapshots.find(
          (s) => s['snapshot-id'] === current['parent-snapshot-id'],
        );
        if (!parent) break;

        // If parent is reachable from current branches, we found the divergence point
        if (reachableFromBranches.has(parent['snapshot-id'])) {
          break;
        }

        // If parent is also unreachable, it's part of this dropped branch chain
        if (unreachableSnapshots.some((s) => s['snapshot-id'] === parent['snapshot-id'])) {
          headSnapshot = parent;
          current = parent;
        } else {
          break;
        }
      }

      // Mark all snapshots in this chain as processed
      let chainCurrent = headSnapshot;
      while (chainCurrent) {
        processedSnapshots.add(chainCurrent['snapshot-id']);

        // Find the next snapshot in the chain
        const children = childrenMap.get(chainCurrent['snapshot-id']) || [];
        const nextInChain = children.find(
          (childId) =>
            unreachableSnapshots.some((s) => s['snapshot-id'] === childId) &&
            !processedSnapshots.has(childId),
        );

        if (nextInChain) {
          chainCurrent = sortedSnapshots.find((s) => s['snapshot-id'] === nextInChain);
        } else {
          break;
        }
      }

      // Create dropped branch entry
      const droppedBranchName = `dropped-seq-${headSnapshot['sequence-number']}`;
      branches[droppedBranchName] = {
        color: '#9e9e9e',
        type: 'dropped-branch',
        snapshotId: headSnapshot['snapshot-id'],
      };
    });
  }

  return branches;
});

// Group legend entries to avoid duplicate "dropped-branch" entries
const legendEntries = computed(() => {
  const entries = [];
  const droppedBranches = [];

  // Separate regular branches from dropped branches
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branch.type === 'dropped-branch') {
      droppedBranches.push({ branchName, branch });
    } else {
      entries.push({
        name: branchName,
        color: branch.color,
        type: branch.type,
        opacity: 1,
      });
    }
  });

  // Add a single entry for all dropped branches if any exist
  if (droppedBranches.length > 0) {
    entries.push({
      name: `dropped branches (${droppedBranches.length})`,
      color: '#9e9e9e',
      type: 'dropped-branch',
      opacity: 0.7,
    });
  }

  return entries;
});

// Helper function to detect schema changes
function getSchemaChangeInfo(snapshot: any): {
  hasSchemaChange: boolean;
  fromSchema?: number;
  toSchema?: number;
} {
  if (!snapshot || !snapshot['parent-snapshot-id']) {
    return { hasSchemaChange: false };
  }

  const parentSnapshot = props.snapshotHistory.find(
    (s) => s['snapshot-id'] === snapshot['parent-snapshot-id'],
  );

  if (!parentSnapshot) {
    return { hasSchemaChange: false };
  }

  const hasChange = snapshot['schema-id'] !== parentSnapshot['schema-id'];
  return {
    hasSchemaChange: hasChange,
    fromSchema: hasChange ? parentSnapshot['schema-id'] : undefined,
    toSchema: hasChange ? snapshot['schema-id'] : undefined,
  };
}

// Graph nodes computed
const graphNodes = computed(() => {
  if (!props.snapshotHistory.length) return [];

  const nodes: Array<{
    id: string;
    snapshotId: number;
    x: number;
    y: number;
    radius: number;
    color: string;
    strokeColor: string;
    branches: string[];
    parentId?: number;
    level: number;
    sequenceNumber: number;
    schemaChangeInfo?: { hasSchemaChange: boolean; fromSchema?: number; toSchema?: number };
  }> = [];

  // Sort snapshots by sequence number (1 = first commit at bottom, highest = latest at top)
  const sortedSnapshots = [...props.snapshotHistory].sort((a, b) => {
    const seqA = a['sequence-number'] || 0;
    const seqB = b['sequence-number'] || 0;
    return seqA - seqB;
  });

  const nodeSpacingX = 120;
  const nodeSpacingY = 80;

  // Calculate dynamic height based on number of snapshots
  const minHeight = 200;
  const padding = 100;
  const calculatedHeight = padding + sortedSnapshots.length * nodeSpacingY;
  const totalHeight = Math.max(minHeight, calculatedHeight);
  graphHeight.value = totalHeight;

  // Create a map to track which column each branch should use
  const branchColumns = new Map<string, number>();
  let nextRightColumn = 1;
  let nextLeftColumn = -1;

  // Function to trace a branch's full history from its head snapshot
  function getBranchHistory(branchSnapshotId: number): number[] {
    const history: number[] = [];
    const visited = new Set<number>();

    function trace(snapshotId: number) {
      if (visited.has(snapshotId)) return;
      visited.add(snapshotId);

      const snapshot = sortedSnapshots.find((s) => s['snapshot-id'] === snapshotId);
      if (!snapshot) return;

      history.push(snapshotId);

      if (snapshot['parent-snapshot-id']) {
        trace(snapshot['parent-snapshot-id']);
      }
    }

    trace(branchSnapshotId);
    return history;
  }

  // Build branch histories
  const branchHistories = new Map<string, number[]>();
  const mainHistory: number[] = [];

  // Find main branch (usually the one with most snapshots or "main"/"master")
  const mainBranchName =
    Object.keys(branchInfo.value).find((name) => name === 'main' || name === 'master') ||
    Object.keys(branchInfo.value)[0];

  if (mainBranchName && branchInfo.value[mainBranchName]) {
    const mainBranchHistory = getBranchHistory(branchInfo.value[mainBranchName].snapshotId);
    branchHistories.set('main', mainBranchHistory);
    mainHistory.push(...mainBranchHistory);
  }

  // Build other branch histories
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branchName !== mainBranchName && branch.type !== 'dropped-branch') {
      const branchHistory = getBranchHistory(branch.snapshotId);
      branchHistories.set(branchName, branchHistory);

      // Assign columns to branches
      if (!branchColumns.has(branchName)) {
        branchColumns.set(branchName, nextRightColumn++);
      }
    }
  });

  // Pre-assign columns for dropped branches to ensure proper width calculation
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branch.type === 'dropped-branch' && !branchColumns.has(branchName)) {
      branchColumns.set(branchName, nextLeftColumn--);
    }
  });

  // Calculate all column numbers that will be used (now including dropped branches)
  const columnNumbers = Array.from(branchColumns.values());

  const minColumn = Math.min(...columnNumbers, 0);
  const maxColumn = Math.max(...columnNumbers, 0);

  // Adjust starting X position to account for left-side branches
  const leftPadding = Math.abs(minColumn) * nodeSpacingX + 100;
  const startX = leftPadding;

  // Update graph width to accommodate all columns with extra padding
  const totalColumns = maxColumn - minColumn + 1;
  graphWidth.value = leftPadding + (totalColumns - 1) * nodeSpacingX + 100;

  // Position snapshots from bottom (sequence 1) to top (latest sequence)
  sortedSnapshots.forEach((snapshot, index) => {
    const snapshotId = snapshot['snapshot-id'];
    const sequenceNumber = snapshot['sequence-number'] || 0;
    const schemaChangeInfo = getSchemaChangeInfo(snapshot);

    // Use index directly: index 0 (sequence 1) at bottom, higher index going up
    const yPosition = totalHeight - nodeSpacingY - index * nodeSpacingY;

    // Determine which branches this snapshot belongs to
    const belongsToMain = mainHistory.includes(snapshotId);
    const otherBranches: string[] = [];

    // Check if this snapshot belongs to any dropped branch (including chain members)
    let belongsToDroppedBranch = false;
    let droppedBranchName = '';

    // Check all dropped branches to see if this snapshot belongs to any of them
    for (const [branchName, branch] of Object.entries(branchInfo.value)) {
      if (branch.type !== 'dropped-branch') continue;

      // If it's the head of the dropped branch
      if (branch.snapshotId === snapshotId) {
        belongsToDroppedBranch = true;
        droppedBranchName = branchName;
        break;
      }

      // Check if it's part of the dropped branch chain by following parent-child relationships
      // Starting from the head, follow children until we find this snapshot or reach the end
      let current = props.snapshotHistory.find((s) => s['snapshot-id'] === branch.snapshotId);
      const visited = new Set<number>();

      while (current && !visited.has(current['snapshot-id'])) {
        visited.add(current['snapshot-id']);

        if (current['snapshot-id'] === snapshotId) {
          belongsToDroppedBranch = true;
          droppedBranchName = branchName;
          break;
        }

        // Find children and follow the dropped branch chain
        const children = props.snapshotHistory.filter(
          (s) => s['parent-snapshot-id'] === current['snapshot-id'],
        );
        // Find a child that is not part of any named branch (likely continuation of dropped branch)
        current =
          children.find((child) => {
            return !Object.values(branchInfo.value).some(
              (b) =>
                b.type !== 'dropped-branch' &&
                branchHistories.get('main')?.includes(child['snapshot-id']),
            );
          }) || null;
      }

      if (belongsToDroppedBranch) break;
    }

    // Check regular branches (non-dropped)
    branchHistories.forEach((history, branchName) => {
      if (branchName !== 'main' && history.includes(snapshotId)) {
        // Skip if this is a dropped branch - it should be handled separately
        const branchType = branchInfo.value[branchName]?.type;
        if (branchType === 'dropped-branch') return;

        otherBranches.push(branchName);
        if (!branchColumns.has(branchName)) {
          branchColumns.set(branchName, nextRightColumn++);
        }
      }
    });

    // Special handling for dropped branches
    if (belongsToDroppedBranch) {
      const columnX = startX + (branchColumns.get(droppedBranchName || '') || -1) * nodeSpacingX;
      const branchColor = branchInfo.value[droppedBranchName || '']?.color || '#9e9e9e';

      nodes.push({
        id: `node-${snapshotId}-${droppedBranchName}`,
        snapshotId,
        x: columnX,
        y: yPosition,
        radius: schemaChangeInfo.hasSchemaChange ? 15 : 12,
        color: schemaChangeInfo.hasSchemaChange ? '#ff9800' : branchColor,
        strokeColor: schemaChangeInfo.hasSchemaChange ? '#f57c00' : '#757575',
        branches: [droppedBranchName || 'dropped'],
        parentId: snapshot['parent-snapshot-id'],
        level: index,
        sequenceNumber,
        schemaChangeInfo,
      });
    } else if (belongsToMain && otherBranches.length === 0) {
      // Only on main branch
      nodes.push({
        id: `node-${snapshotId}-main`,
        snapshotId,
        x: startX,
        y: yPosition,
        radius: schemaChangeInfo.hasSchemaChange ? 15 : 12,
        color: schemaChangeInfo.hasSchemaChange ? '#ff9800' : '#4caf50',
        strokeColor: schemaChangeInfo.hasSchemaChange ? '#f57c00' : '#388e3c',
        branches: ['main'],
        parentId: snapshot['parent-snapshot-id'],
        level: index,
        sequenceNumber,
        schemaChangeInfo,
      });
    } else if (!belongsToMain && otherBranches.length > 0) {
      // Only on other branch(es)
      otherBranches.forEach((branchName) => {
        const columnX = startX + (branchColumns.get(branchName) || 0) * nodeSpacingX;
        const branchColor = branchInfo.value[branchName]?.color || '#2196f3';
        nodes.push({
          id: `node-${snapshotId}-${branchName}`,
          snapshotId,
          x: columnX,
          y: yPosition,
          radius: schemaChangeInfo.hasSchemaChange ? 15 : 12,
          color: schemaChangeInfo.hasSchemaChange ? '#ff9800' : branchColor,
          strokeColor: schemaChangeInfo.hasSchemaChange
            ? '#f57c00'
            : branchInfo.value[branchName]?.color || '#1976d2',
          branches: [branchName],
          parentId: snapshot['parent-snapshot-id'],
          level: index,
          sequenceNumber,
          schemaChangeInfo,
        });
      });
    } else if (belongsToMain && otherBranches.length > 0) {
      // Divergence point - create main node only
      nodes.push({
        id: `node-${snapshotId}-main`,
        snapshotId,
        x: startX,
        y: yPosition,
        radius: schemaChangeInfo.hasSchemaChange ? 18 : 15,
        color: schemaChangeInfo.hasSchemaChange ? '#ff9800' : '#4caf50',
        strokeColor: schemaChangeInfo.hasSchemaChange ? '#f57c00' : '#388e3c',
        branches: ['main'],
        parentId: snapshot['parent-snapshot-id'],
        level: index,
        sequenceNumber,
        schemaChangeInfo,
      });
    } else {
      // Fallback - shouldn't happen but create a generic node
      nodes.push({
        id: `node-${snapshotId}`,
        snapshotId,
        x: startX,
        y: yPosition,
        radius: schemaChangeInfo.hasSchemaChange ? 12 : 10,
        color: schemaChangeInfo.hasSchemaChange ? '#ff9800' : '#666',
        strokeColor: schemaChangeInfo.hasSchemaChange ? '#f57c00' : '#444',
        branches: [],
        parentId: snapshot['parent-snapshot-id'],
        level: index,
        sequenceNumber,
        schemaChangeInfo,
      });
    }
  });

  return nodes;
});

// Branch paths computed
const branchPaths = computed(() => {
  if (!graphNodes.value.length) return {};

  const paths: Record<string, { pathData: string; color: string }> = {};

  // Helper function to create straight or curved path
  function createPath(
    startNode: any,
    endNode: any,
    isBranchDivergence: boolean = false,
    branchIndex: number = 0,
  ): string {
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let startX, startY, endX, endY;

    if (isBranchDivergence) {
      // For branch divergence: start from top of parent node, end at bottom of child node
      startX = startNode.x;
      startY = startNode.y - startNode.radius;
      endX = endNode.x;
      endY = endNode.y + endNode.radius;
    } else {
      // For regular connections: use margins from node centers
      const margin = 15;
      startX = startNode.x + (dx / distance) * margin;
      startY = startNode.y + (dy / distance) * margin;
      endX = endNode.x - (dx / distance) * margin;
      endY = endNode.y - (dy / distance) * margin;
    }

    // For straight vertical lines (same branch), always use straight line
    if (Math.abs(dx) < 10) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    // For branch divergences or cross-branch connections, use curves
    if (isBranchDivergence) {
      const midY = startY + (endY - startY) * 0.3;
      const controlX1 = startX;
      const controlY1 = midY;
      const controlX2 = endX;
      const controlY2 = midY;
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    } else {
      // Regular curved connection
      const offset = Math.min(Math.abs(dx) * 0.3, 50);
      const controlX1 = startX + (dx > 0 ? offset : -offset);
      const controlY1 = startY;
      const controlX2 = endX - (dx > 0 ? offset : -offset);
      const controlY2 = endY;
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    }
  }

  // Track connections to avoid duplicates
  const processedConnections = new Set<string>();
  const branchDivergenceConnections = new Set<string>();

  // First, identify branch divergence points
  const mainHistory: number[] = [];
  const branchHistories = new Map<string, number[]>();

  // Build branch histories (simplified version for path calculation)
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branch.type === 'dropped-branch') return;

    const branchHistory: number[] = [];
    const visited = new Set<number>();

    function traceBranch(snapshotId: number) {
      if (visited.has(snapshotId)) return;
      visited.add(snapshotId);

      const snapshot = props.snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
      if (!snapshot) return;

      branchHistory.push(snapshotId);
      if (snapshot['parent-snapshot-id']) {
        traceBranch(snapshot['parent-snapshot-id']);
      }
    }

    traceBranch(branch.snapshotId);
    branchHistories.set(branchName, branchHistory);

    if (branchName === 'main' || branchName === 'master') {
      mainHistory.push(...branchHistory);
    }
  });

  // Pre-identify branch divergence connections to exclude from parent-child processing
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branchName === 'main') return;

    if (branch.type === 'dropped-branch') {
      const droppedSnapshot = props.snapshotHistory.find(
        (s) => s['snapshot-id'] === branch.snapshotId,
      );
      if (droppedSnapshot && droppedSnapshot['parent-snapshot-id']) {
        branchDivergenceConnections.add(
          `${droppedSnapshot['parent-snapshot-id']}-${branch.snapshotId}`,
        );
      }
    } else {
      const branchHistory = branchHistories.get(branchName) || [];
      let divergenceSnapshotId: number | null = null;
      let maxSequence = 0;

      branchHistory.forEach((snapshotId) => {
        if (mainHistory.includes(snapshotId)) {
          const snapshot = props.snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
          if (snapshot && (snapshot['sequence-number'] || 0) > maxSequence) {
            maxSequence = snapshot['sequence-number'] || 0;
            divergenceSnapshotId = snapshotId;
          }
        }
      });

      const branchSpecificSnapshot = props.snapshotHistory.find(
        (s) =>
          s['parent-snapshot-id'] === divergenceSnapshotId &&
          branchHistory.includes(s['snapshot-id']) &&
          !mainHistory.includes(s['snapshot-id']),
      );

      if (branchSpecificSnapshot) {
        branchDivergenceConnections.add(
          `${divergenceSnapshotId}-${branchSpecificSnapshot['snapshot-id']}`,
        );
      }
    }
  });

  // Create parent-child connections for each branch (excluding divergence connections)
  graphNodes.value.forEach((node) => {
    if (node.parentId) {
      const connectionId = `${node.parentId}-${node.snapshotId}`;

      // Skip if this is a branch divergence connection - it will be handled separately
      if (branchDivergenceConnections.has(connectionId)) return;

      if (processedConnections.has(connectionId)) return;
      processedConnections.add(connectionId);

      const parentNode = graphNodes.value.find((n) => n.snapshotId === node.parentId);
      if (parentNode) {
        // Determine the branch color
        const branchColor = node.branches[0]
          ? branchInfo.value[node.branches[0]]?.color || '#2196f3'
          : '#2196f3';

        paths[connectionId] = {
          pathData: createPath(parentNode, node, false),
          color: branchColor,
        };
      }
    }
  });

  // Add branch divergence lines
  let branchIndex = 0;
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branchName === 'main') return;

    branchIndex++;

    // Special handling for dropped branches
    if (branch.type === 'dropped-branch') {
      const droppedSnapshot = props.snapshotHistory.find(
        (s) => s['snapshot-id'] === branch.snapshotId,
      );
      if (droppedSnapshot && droppedSnapshot['parent-snapshot-id']) {
        const parentNode = graphNodes.value.find(
          (n) =>
            n.snapshotId === droppedSnapshot['parent-snapshot-id'] && n.branches.includes('main'),
        );
        const droppedNode = graphNodes.value.find(
          (n) => n.snapshotId === branch.snapshotId && n.branches.includes(branchName),
        );

        if (parentNode && droppedNode) {
          const pathId = `divergence-${branchName}-${droppedSnapshot['parent-snapshot-id']}`;
          paths[pathId] = {
            pathData: createPath(parentNode, droppedNode, true, branchIndex),
            color: branch.color,
          };
        }
      }
    } else {
      // Regular branch handling
      const branchHistory = branchHistories.get(branchName) || [];
      let divergenceSnapshotId: number | null = null;
      let maxSequence = 0;

      branchHistory.forEach((snapshotId) => {
        if (mainHistory.includes(snapshotId)) {
          const snapshot = props.snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
          if (snapshot && (snapshot['sequence-number'] || 0) > maxSequence) {
            maxSequence = snapshot['sequence-number'] || 0;
            divergenceSnapshotId = snapshotId;
          }
        }
      });

      // Find the first branch-specific snapshot
      const branchSpecificSnapshot = props.snapshotHistory.find(
        (s) =>
          s['parent-snapshot-id'] === divergenceSnapshotId &&
          branchHistory.includes(s['snapshot-id']) &&
          !mainHistory.includes(s['snapshot-id']),
      );

      if (branchSpecificSnapshot) {
        const divergenceNode = graphNodes.value.find(
          (n) => n.snapshotId === divergenceSnapshotId && n.branches.includes('main'),
        );
        const branchNode = graphNodes.value.find(
          (n) =>
            n.snapshotId === branchSpecificSnapshot['snapshot-id'] &&
            n.branches.includes(branchName),
        );

        if (divergenceNode && branchNode) {
          const pathId = `divergence-${branchName}-${divergenceSnapshotId}`;
          paths[pathId] = {
            pathData: createPath(divergenceNode, branchNode, true, branchIndex),
            color: branchInfo.value[branchName]?.color || '#2196f3',
          };
        }
      }
    }
  });

  return paths;
});

// Helper functions
function getBranchColor(branchName: string): string {
  return branchInfo.value[branchName]?.color || '#666';
}

function selectSnapshot(snapshotId: number) {
  const snapshot = props.snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
  if (snapshot) {
    selectedSnapshot.value = snapshot;
  }
}

// Schema helper functions
function getSchemaInfo(schemaId: number) {
  if (!props.table.metadata.schemas || props.table.metadata.schemas.length === 0) return null;
  return props.table.metadata.schemas.find((schema: any) => schema['schema-id'] === schemaId);
}

function getSchemaChanges(version: any, index: number): boolean {
  if (index === props.snapshotHistory.length - 1) return false;
  const nextVersion = props.snapshotHistory[index + 1];
  return version['schema-id'] !== nextVersion['schema-id'];
}

function isFieldNew(field: any, version: any, index: number): boolean {
  if (index === props.snapshotHistory.length - 1) return false;
  const nextVersion = props.snapshotHistory[index + 1];
  const nextSchema = getSchemaInfo(nextVersion['schema-id']);
  if (!nextSchema) return true;
  return !nextSchema.fields.some((f: any) => f.id === field.id);
}

function getFieldIcon(field: any): string {
  const type = field.type;
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'string':
        return 'mdi-format-text';
      case 'int':
      case 'integer':
      case 'long':
      case 'double':
      case 'float':
        return 'mdi-numeric';
      case 'boolean':
        return 'mdi-checkbox-outline';
      case 'date':
        return 'mdi-calendar';
      case 'timestamp':
        return 'mdi-clock-outline';
      default:
        return 'mdi-file-outline';
    }
  }
  if (typeof type === 'object') {
    if (type.type === 'list') return 'mdi-format-list-bulleted';
    if (type.type === 'map') return 'mdi-code-braces';
    if (type.type === 'struct') return 'mdi-code-braces-box';
  }
  return 'mdi-file-outline';
}

function getFieldTypeString(type: any): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'object') {
    if (type.type === 'list') return `list<${getFieldTypeString(type.element)}>`;
    if (type.type === 'map')
      return `map<${getFieldTypeString(type.key)}, ${getFieldTypeString(type.value)}>`;
    if (type.type === 'struct') return 'struct';
    return type.type || 'unknown';
  }
  return 'unknown';
}

function formatSummaryKey(key: string): string {
  return key
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatSummaryValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'number') {
    // Format large numbers with commas
    if (value >= 1000) {
      return value.toLocaleString();
    }
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string') {
    // Check if it's a timestamp
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(value).toLocaleString();
    }
    return value;
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function getOperationColor(operation: string): string {
  const operationColors: Record<string, string> = {
    append: 'success',
    overwrite: 'warning',
    delete: 'error',
    replace: 'primary',
    merge: 'info',
    optimize: 'secondary',
    expire: 'orange',
    compact: 'teal',
  };

  return operationColors[operation?.toLowerCase()] || 'default';
}
</script>

<style scoped>
.graph-container {
  width: 100%;
}

.branch-graph {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgba(var(--v-theme-surface));
}

.branch-color-indicator {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.graph-content {
  position: relative;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.summary-grid > div {
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
}
</style>
