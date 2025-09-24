<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <BreadcrumbsFromUrl />
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">
              {{ namespacePath.split(String.fromCharCode(0x1f)).join('.') }}
            </span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-table</v-icon>
          </template>
        </v-toolbar>
        <v-tabs v-model="tab">
          <v-tab value="overview" @click="loadTabData">overview</v-tab>
          <v-tab value="raw" @click="loadTabData">raw</v-tab>
          <v-tab value="details" @click="loadTabData">details</v-tab>
          <v-tab value="branch" @click="loadTabData">branch</v-tab>
          <v-tab
            v-if="enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
          <v-tab value="tasks" @click="loadTabData">tasks</v-tab>
        </v-tabs>
        <v-card style="max-height: 80vh; overflow: auto">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="overview">
              <v-toolbar color="transparent" density="compact" flat>
                <v-switch
                  v-model="recursiveDeleteProtection"
                  class="ml-4 mt-4"
                  color="info"
                  :label="
                    recursiveDeleteProtection
                      ? 'Recursive Delete Protection enabled'
                      : 'Recursive Delete Protection disabled'
                  "
                  @click="setProtection"></v-switch>
              </v-toolbar>

              <v-treeview :items="schemaFieldsTransformed" open-on-click>
                <template #prepend="{ item }">
                  <v-icon v-if="item.datatype == 'string'" size="small">mdi-alphabetical</v-icon>
                  <v-icon v-else-if="item.datatype == 'int'" size="small">mdi-numeric</v-icon>
                  <v-icon
                    v-else-if="item.datatype == 'long' || item.datatype == 'double'"
                    size="small">
                    mdi-decimal
                  </v-icon>

                  <v-icon v-else-if="item.datatype == 'array'" size="small">
                    mdi-format-list-group
                  </v-icon>
                  <v-icon v-else size="small">mdi-pound-box-outline</v-icon>
                </template>
                <template #append="{ item }">
                  <span>
                    <span v-if="item.required" style="font-size: 0.575rem">required</span>
                    <v-icon v-if="item.required" color="error" size="x-small">mdi-asterisk</v-icon>
                  </span>
                </template>
              </v-treeview>
            </v-tabs-window-item>
            <v-tabs-window-item value="raw">
              <div class="mb-4 mt-4">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="info"
                  class="mr-8 ml-4"
                  @click="depthRawRepresentation = 1"
                  append-icon="mdi-collapse-all">
                  Collapse
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="success"
                  class="mr-8"
                  @click="depthRawRepresentation = depthRawRepresentationMax"
                  append-icon="mdi-expand-all">
                  Expand
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="primary"
                  @click="copyTableJson"
                  prepend-icon="mdi-content-copy">
                  Copy JSON
                </v-btn>
              </div>
              <div style="height: 65vh; overflow: auto">
                <vue-json-pretty
                  :data="table"
                  :deep="depthRawRepresentation"
                  :theme="themeText"
                  :showLineNumber="true"
                  :virtual="false" />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="details">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-information-outline</v-icon>
                        Table Information
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Table UUID</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono">{{ table.metadata['table-uuid'] }}</span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(table.metadata['table-uuid'])
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>Format Version</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata['format-version'] }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="table.metadata.location">
                          <v-list-item-title>Location</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ table.metadata.location }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="functions.copyToClipboard(table.metadata.location)"></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="table.metadata['last-updated-ms']">
                          <v-list-item-title>Last Updated</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatTimestamp(table.metadata['last-updated-ms']) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="table.metadata['current-schema-id']">
                          <v-list-item-title>Current Schema ID</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata['current-schema-id'] }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="table.metadata['current-snapshot-id']">
                          <v-list-item-title>Current Snapshot ID</v-list-item-title>
                          <v-list-item-subtitle class="font-mono">
                            {{ table.metadata['current-snapshot-id'] }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-table-cog</v-icon>
                        Schema Information
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item
                          v-if="table.metadata.schemas && table.metadata.schemas.length > 0">
                          <v-list-item-title>Total Schemas</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata.schemas.length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSchemaInfo">
                          <v-list-item-title>Current Schema Fields</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ currentSchemaInfo?.fields?.length || 0 }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="table.metadata.snapshots && table.metadata.snapshots.length > 0">
                          <v-list-item-title>Total Snapshots</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata.snapshots.length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="
                            table.metadata['partition-specs'] &&
                            table.metadata['partition-specs'].length > 0
                          ">
                          <v-list-item-title>Partition Specs</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata['partition-specs'].length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="
                            table.metadata['sort-orders'] &&
                            table.metadata['sort-orders'].length > 0
                          ">
                          <v-list-item-title>Sort Orders</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata['sort-orders'].length }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Properties Section -->
                <v-row
                  v-if="
                    table.metadata.properties && Object.keys(table.metadata.properties).length > 0
                  ">
                  <v-col cols="12">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-cog-outline</v-icon>
                        Table Properties
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-card-text>
                        <v-row>
                          <v-col
                            v-for="(value, key) in table.metadata.properties"
                            :key="key"
                            cols="12"
                            md="6">
                            <v-list-item class="pa-0">
                              <v-list-item-title class="text-body-2 font-weight-medium">
                                {{ key }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="font-mono text-wrap">
                                {{ value }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Current Snapshot Details -->
                <v-row v-if="currentSnapshot">
                  <v-col cols="12">
                    <v-card variant="outlined">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-camera-outline</v-icon>
                        Current Snapshot Details
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Snapshot ID</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono">{{ currentSnapshot['snapshot-id'] }}</span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(String(currentSnapshot['snapshot-id']))
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot['timestamp-ms']">
                          <v-list-item-title>Timestamp</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatTimestamp(currentSnapshot['timestamp-ms']) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot.summary?.operation">
                          <v-list-item-title>Operation</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip size="small" variant="outlined">
                              {{ currentSnapshot.summary.operation }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot['manifest-list']">
                          <v-list-item-title>Manifest List</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ currentSnapshot['manifest-list'] }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(currentSnapshot['manifest-list'])
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot.summary">
                          <v-list-item-title>Summary</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-row>
                              <v-col
                                v-for="(value, key) in currentSnapshot.summary"
                                :key="key"
                                cols="12"
                                md="6">
                                <v-list-item class="pa-0" density="compact">
                                  <v-list-item-title class="text-caption">
                                    {{ key }}
                                  </v-list-item-title>
                                  <v-list-item-subtitle class="font-mono">
                                    {{ value }}
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-col>
                            </v-row>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-tabs-window-item>

            <v-tabs-window-item value="branch">
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
                  <div class="text-body-1 text-grey-lighten-1">
                    This table has no branch references
                  </div>
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
                            border:
                              '1px solid rgba(var(--v-border-color), var(--v-border-opacity))',
                            borderRadius: '4px',
                          }">
                          <svg
                            :width="graphWidth * zoomScale"
                            :height="graphHeight * zoomScale"
                            class="branch-graph">
                            <g :transform="`scale(${zoomScale})`">
                              <defs>
                                <filter
                                  id="nodeShadow"
                                  x="-20%"
                                  y="-20%"
                                  width="140%"
                                  height="140%">
                                  <feDropShadow
                                    dx="2"
                                    dy="2"
                                    stdDeviation="2"
                                    flood-opacity="0.3" />
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
                                  :stroke-width="
                                    selectedSnapshot?.['snapshot-id'] === node.snapshotId ? 4 : 3
                                  "
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
                                  {{
                                    `S${node.schemaChangeInfo.fromSchema}→${node.schemaChangeInfo.toSchema}`
                                  }}
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
                                  Sequence: {{ node.sequenceNumber }} | Snapshot:
                                  {{ node.snapshotId
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
                          <div
                            v-for="(branch, branchName) in branchInfo"
                            :key="branchName"
                            class="d-flex align-center">
                            <div
                              class="branch-color-indicator mr-2"
                              :style="{
                                backgroundColor: branch.color,
                                width: '16px',
                                height: '2px',
                                borderRadius: '2px',
                                opacity: branch.type === 'dropped-branch' ? 0.7 : 1,
                              }"></div>
                            <span
                              class="text-body-2 mr-2"
                              :class="{ 'text-grey-darken-1': branch.type === 'dropped-branch' }">
                              {{ branch.type }}
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
                            <span class="text-body-2">Schema Change</span>
                          </div>
                          <div class="d-flex align-center ml-2">
                            <div
                              style="
                                width: 16px;
                                height: 16px;
                                border-radius: 50%;
                                background-color: #4caf50;
                                border: 2px solid #388e3c;
                              "
                              class="mr-2"></div>
                            <span class="text-body-2">Regular Snapshot</span>
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

                          <v-divider class="mb-4"></v-divider>

                          <!-- Basic Info -->
                          <v-card variant="outlined" class="mb-4">
                            <v-card-title class="text-subtitle-1 pa-3">
                              <v-icon class="mr-2" size="small">mdi-information-outline</v-icon>
                              Basic Information
                            </v-card-title>
                            <v-divider></v-divider>
                            <v-list density="compact">
                              <v-list-item>
                                <v-list-item-title>Snapshot ID</v-list-item-title>
                                <v-list-item-subtitle class="d-flex align-center">
                                  <span class="mr-2 font-mono">
                                    {{ selectedSnapshot['snapshot-id'] }}
                                  </span>
                                  <v-btn
                                    icon="mdi-content-copy"
                                    size="x-small"
                                    variant="flat"
                                    @click="
                                      functions.copyToClipboard(
                                        String(selectedSnapshot['snapshot-id']),
                                      )
                                    "></v-btn>
                                </v-list-item-subtitle>
                              </v-list-item>

                              <v-list-item v-if="selectedSnapshot['sequence-number']">
                                <v-list-item-title>Sequence Number</v-list-item-title>
                                <v-list-item-subtitle>
                                  {{ selectedSnapshot['sequence-number'] }}
                                </v-list-item-subtitle>
                              </v-list-item>

                              <v-list-item v-if="selectedSnapshot['timestamp-ms']">
                                <v-list-item-title>Timestamp</v-list-item-title>
                                <v-list-item-subtitle>
                                  {{ formatTimestamp(selectedSnapshot['timestamp-ms']) }}
                                </v-list-item-subtitle>
                              </v-list-item>

                              <v-list-item v-if="selectedSnapshot.summary?.operation">
                                <v-list-item-title>Operation</v-list-item-title>
                                <v-list-item-subtitle>
                                  <v-chip
                                    size="small"
                                    :color="getOperationColor(selectedSnapshot.summary.operation)"
                                    variant="flat">
                                    {{ selectedSnapshot.summary.operation }}
                                  </v-chip>
                                </v-list-item-subtitle>
                              </v-list-item>

                              <v-list-item v-if="selectedSnapshot['parent-snapshot-id']">
                                <v-list-item-title>Parent Snapshot</v-list-item-title>
                                <v-list-item-subtitle class="font-mono">
                                  {{ selectedSnapshot['parent-snapshot-id'] }}
                                </v-list-item-subtitle>
                              </v-list-item>

                              <v-list-item v-if="selectedSnapshot['schema-id']">
                                <v-list-item-title>Schema ID</v-list-item-title>
                                <v-list-item-subtitle class="font-mono">
                                  {{ selectedSnapshot['schema-id'] }}
                                </v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-card>

                          <!-- Operation Summary -->
                          <v-card
                            v-if="
                              selectedSnapshot.summary &&
                              Object.keys(selectedSnapshot.summary).length > 1
                            "
                            variant="outlined"
                            class="mb-4">
                            <v-card-title class="text-subtitle-1 pa-3">
                              <v-icon class="mr-2" size="small">mdi-chart-line</v-icon>
                              Operation Summary
                            </v-card-title>
                            <v-divider></v-divider>
                            <v-card-text class="pa-3">
                              <v-row dense>
                                <v-col
                                  v-for="(value, key) in selectedSnapshot.summary"
                                  :key="key"
                                  cols="12">
                                  <v-list-item
                                    v-if="String(key) !== 'operation'"
                                    class="pa-0"
                                    density="compact">
                                    <v-list-item-title class="text-caption text-medium-emphasis">
                                      {{ formatSummaryKey(key) }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="font-mono text-body-2">
                                      {{ formatSummaryValue(value) }}
                                    </v-list-item-subtitle>
                                  </v-list-item>
                                </v-col>
                              </v-row>
                            </v-card-text>
                          </v-card>

                          <!-- Manifest List -->
                          <v-card
                            v-if="selectedSnapshot['manifest-list']"
                            variant="outlined"
                            class="mb-4">
                            <v-card-title class="text-subtitle-1 pa-3">
                              <v-icon class="mr-2" size="small">mdi-file-document-outline</v-icon>
                              Manifest List
                            </v-card-title>
                            <v-divider></v-divider>
                            <v-card-text class="pa-3">
                              <div class="d-flex align-center">
                                <span
                                  class="mr-2 font-mono text-wrap text-body-2"
                                  style="word-break: break-all">
                                  {{ selectedSnapshot['manifest-list'] }}
                                </span>
                                <v-btn
                                  icon="mdi-content-copy"
                                  size="x-small"
                                  variant="flat"
                                  @click="
                                    functions.copyToClipboard(selectedSnapshot['manifest-list'])
                                  "></v-btn>
                              </div>
                            </v-card-text>
                          </v-card>

                          <!-- Schema Details -->
                          <v-card
                            v-if="getSchemaInfo(selectedSnapshot['schema-id'])"
                            variant="outlined"
                            class="mb-4">
                            <v-card-text class="pa-0">
                              <v-expansion-panels variant="accordion">
                                <v-expansion-panel>
                                  <v-expansion-panel-title class="text-subtitle-2">
                                    <v-icon class="mr-2" size="small">mdi-table-cog</v-icon>
                                    Schema Details ({{
                                      getSchemaInfo(selectedSnapshot['schema-id'])?.fields
                                        ?.length || 0
                                    }}
                                    fields)
                                    <v-chip
                                      v-if="
                                        getSchemaChanges(
                                          selectedSnapshot,
                                          snapshotHistory.findIndex(
                                            (s) =>
                                              s['snapshot-id'] === selectedSnapshot['snapshot-id'],
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
                                          v-for="field in getSchemaInfo(
                                            selectedSnapshot['schema-id'],
                                          )?.fields || []"
                                          :key="field.id"
                                          class="pa-1">
                                          <template #prepend>
                                            <v-icon
                                              :color="
                                                isFieldNew(
                                                  field,
                                                  selectedSnapshot,
                                                  snapshotHistory.findIndex(
                                                    (s) =>
                                                      s['snapshot-id'] ===
                                                      selectedSnapshot['snapshot-id'],
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
                                                  (s) =>
                                                    s['snapshot-id'] ===
                                                    selectedSnapshot['snapshot-id'],
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
                                                    (s) =>
                                                      s['snapshot-id'] ===
                                                      selectedSnapshot['snapshot-id'],
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
                                            <span v-if="field.required" class="text-error ml-1">
                                              *
                                            </span>
                                          </v-list-item-subtitle>
                                        </v-list-item>
                                      </v-list>
                                    </div>
                                  </v-expansion-panel-text>
                                </v-expansion-panel>
                              </v-expansion-panels>
                            </v-card-text>
                          </v-card>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item v-if="canReadPermissions" value="permissions">
              <PermissionManager
                v-if="loaded"
                :status="assignStatus"
                :assignable-obj="permissionObject"
                :existing-permissions-from-obj="existingPermissions"
                :relation-type="permissionType"
                @permissions="assign" />
            </v-tabs-window-item>
            <v-tabs-window-item value="tasks">
              <TaskManager
                v-if="loaded && tableId"
                :warehouse-id="warehouseId"
                :table-id="tableId"
                entity-type="table" />
              <div v-else class="text-center pa-8">
                <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                <div class="text-subtitle-1 mt-2">Loading table information...</div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </span>
</template>
<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import TaskManager from '../../components/TaskManager.vue';
import { LoadTableResultReadable, StructField } from '../../gen/iceberg/types.gen';
import { TableAction, TableAssignment } from '../../gen/management/types.gen';
import { AssignmentCollection, RelationType } from '../../common/interfaces';
import { useVisualStore } from '../../stores/visual';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';
const depthRawRepresentation = ref(3);
const depthRawRepresentationMax = ref(1000);

const recursiveDeleteProtection = ref(false);

const assignStatus = ref(StatusIntent.INACTIVE);

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const namespacePath = ref('');
const loading = ref(true);
const myAccess = reactive<TableAction[]>([]);
const canReadPermissions = ref(false);
const warehouseId = (route.params as { id: string }).id;
const namespaceId = (route.params as { nsid: string }).nsid;
const tableName = (route.params as { tid: string }).tid;
const tableId = ref('');
const table = reactive<LoadTableResultReadable>({
  metadata: {
    'format-version': 0,
    'table-uuid': '',
  },
});
const permissionType = ref<RelationType>('table');
const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: '',
});

const visual = useVisualStore();
const themeLight = computed(() => {
  return visual.themeLight;
});
const themeText = computed(() => {
  return themeLight.value ? 'light' : 'dark';
});

interface TreeItem {
  id: number;
  title: string;
  datatype: string;
  required: boolean;
  children?: TreeItem[];
}

const schemaFields = reactive<StructField[]>([]);
const schemaFieldsTransformed = reactive<TreeItem[]>([]);
const currentSchema = ref(0);
const existingPermissions = reactive<TableAssignment[]>([]);
const loaded = ref(false);
const snapshotHistory = reactive<any[]>([]);
const selectedSnapshot = ref<any>(null);

// Zoom functionality
const zoomScale = ref(1);
const minZoom = 0.1;
const maxZoom = 3;
const zoomStep = 0.1;

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

async function init() {
  loaded.value = false;
  const serverInfo = await functions.getServerInfo();

  namespacePath.value = `${namespaceId}${String.fromCharCode(0x1f)}${tableName}`;
  Object.assign(table, await functions.loadTableCustomized(warehouseId, namespaceId, tableName));

  tableId.value = table.metadata['table-uuid'];
  currentSchema.value = table.metadata['current-schema-id'] || 0;

  permissionObject.id = tableId.value;
  permissionObject.name = tableName;
  if (serverInfo['authz-backend'] != 'allow-all') {
    Object.assign(myAccess, await functions.getTableAccessById(tableId.value, warehouseId));
    await getProtection();
    canReadPermissions.value = !!myAccess.includes('read_assignments');

    existingPermissions.splice(0, existingPermissions.length);
    Object.assign(
      existingPermissions,
      canReadPermissions.value
        ? await functions.getTableAssignmentsById(tableId.value, warehouseId)
        : [],
    );
  }
  loaded.value = true;

  schemaFields.splice(0, schemaFields.length);
  if (table.metadata.schemas) {
    table.metadata.schemas.forEach((schema) => {
      if (schema['schema-id'] === currentSchema.value) {
        for (const field of schema.fields) {
          schemaFields.push(field);
        }
        schemaFieldsTransformed.splice(0, schemaFieldsTransformed.length);
        schemaFieldsTransformed.push(...transformFields(schemaFields));
      }
    });
  }

  // Process snapshot history - sort by timestamp descending (newest first)
  snapshotHistory.splice(0, snapshotHistory.length);
  if (table.metadata.snapshots) {
    const sortedSnapshots = [...table.metadata.snapshots].sort((a, b) => {
      return (b['timestamp-ms'] || 0) - (a['timestamp-ms'] || 0);
    });
    snapshotHistory.push(...sortedSnapshots);
  }

  depthRawRepresentationMax.value = getMaxDepth(table);
}
onMounted(async () => {
  await init();
  loading.value = false;
});

function getMaxDepth(obj: any): number {
  let maxDepth = 0;

  function findDepth(obj: any, depth: number) {
    if (typeof obj === 'object' && obj !== null) {
      depth++;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findDepth(obj[key], depth);
        }
      }
    }
  }

  findDepth(obj, 0);
  return maxDepth;
}

function isStructType(type: any): type is { type: 'struct'; fields: StructField[] } {
  return type && type.type === 'struct' && Array.isArray(type.fields);
}

function isListType(type: any): type is { type: 'list'; element: any } {
  return type && type.type === 'list' && type.element;
}

function transformFields(fields: StructField[]): TreeItem[] {
  return fields.map((field) => {
    let title = field.name;
    let datatype = typeof field.type === 'string' ? field.type : '';

    if (typeof field.type === 'object') {
      if (isStructType(field.type)) {
        datatype = 'struct';
      } else if (isListType(field.type)) {
        datatype = 'array';
      }
    }
    title = `${title} (${datatype})`;

    const item: TreeItem = {
      id: field.id,
      title,
      datatype,
      required: field.required,
    };

    if (typeof field.type === 'object') {
      if (isStructType(field.type)) {
        item.children = transformFields(field.type.fields);
      } else if (isListType(field.type) && isStructType(field.type.element)) {
        item.children = transformFields(field.type.element.fields);
      }
    }

    return item;
  });
}

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    const del = permissions.del as TableAssignment[];
    const writes = permissions.writes as TableAssignment[];

    await functions.updateTableAssignmentsById(tableId.value, del, writes, warehouseId);
    assignStatus.value = StatusIntent.SUCCESS;
    loaded.value = true;
    await init();
  } catch (error) {
    console.error(error);

    assignStatus.value = StatusIntent.FAILURE;

    await init();
  }
}

async function loadTabData() {
  await init();
}

async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getTableProtection(warehouseId, tableId.value)
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setTableProtection(
      warehouseId,
      tableId.value,
      !recursiveDeleteProtection.value,
    );
    await getProtection();
  } catch (error) {
    console.error(error);
  }
}

// Helper functions for details tab
function formatTimestamp(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleString();
}

function getCurrentSchema() {
  if (!table.metadata.schemas || table.metadata.schemas.length === 0) return null;
  return table.metadata.schemas.find((schema) => schema['schema-id'] === currentSchema.value);
}

function getCurrentSnapshot() {
  if (!table.metadata.snapshots || table.metadata.snapshots.length === 0) return null;
  return table.metadata.snapshots.find(
    (snapshot) => snapshot['snapshot-id'] === table.metadata['current-snapshot-id'],
  );
}

// Helper functions for schema information
function getSchemaInfo(schemaId: number) {
  if (!table.metadata.schemas || table.metadata.schemas.length === 0) return null;
  return table.metadata.schemas.find((schema) => schema['schema-id'] === schemaId);
}

function getSchemaChanges(snapshot: any, index: number): boolean {
  if (index === snapshotHistory.length - 1) return false; // Last snapshot, no previous to compare
  const nextSnapshot = snapshotHistory[index + 1];
  return snapshot['schema-id'] !== nextSnapshot['schema-id'];
}

function isFieldNew(field: any, snapshot: any, index: number): boolean {
  if (index === snapshotHistory.length - 1) return false; // Last snapshot, all fields are "original"

  const nextSnapshot = snapshotHistory[index + 1];
  const nextSchemaInfo = getSchemaInfo(nextSnapshot['schema-id']);

  if (!nextSchemaInfo || !nextSchemaInfo.fields) return true;

  // Check if this field existed in the previous schema
  return !nextSchemaInfo.fields.some((prevField: any) => prevField.id === field.id);
}

function getSchemaChangeInfo(snapshot: any): {
  hasSchemaChange: boolean;
  fromSchema?: number;
  toSchema?: number;
} {
  if (!snapshot || !snapshot['parent-snapshot-id']) {
    return { hasSchemaChange: false };
  }

  const parentSnapshot = snapshotHistory.find(
    (s) => s['snapshot-id'] === snapshot['parent-snapshot-id'],
  );
  if (!parentSnapshot) {
    return { hasSchemaChange: false };
  }

  const currentSchemaId = snapshot['schema-id'];
  const parentSchemaId = parentSnapshot['schema-id'];

  if (currentSchemaId !== parentSchemaId) {
    return {
      hasSchemaChange: true,
      fromSchema: parentSchemaId,
      toSchema: currentSchemaId,
    };
  }

  return { hasSchemaChange: false };
}

function getFieldIcon(field: any): string {
  const fieldType = getFieldTypeString(field.type);
  if (fieldType.includes('string')) return 'mdi-alphabetical';
  if (fieldType.includes('int')) return 'mdi-numeric';
  if (fieldType.includes('long') || fieldType.includes('double')) return 'mdi-decimal';
  if (fieldType.includes('array') || fieldType.includes('list')) return 'mdi-format-list-group';
  if (fieldType.includes('struct')) return 'mdi-code-braces';
  return 'mdi-pound-box-outline';
}

function getFieldTypeString(type: any): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'object') {
    if (type.type === 'struct') return 'struct';
    if (type.type === 'list') return `list<${getFieldTypeString(type.element)}>`;
    if (type.type === 'map')
      return `map<${getFieldTypeString(type.key)}, ${getFieldTypeString(type.value)}>`;
    return type.type || 'unknown';
  }
  return 'unknown';
}

function formatSummaryKey(key: string | number): string {
  const keyStr = String(key);
  return keyStr
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatSummaryValue(value: any): string {
  if (typeof value === 'number') {
    // Format large numbers with commas
    if (value >= 1000) {
      return value.toLocaleString();
    }
  }
  return String(value);
}

function getOperationColor(operation: string): string {
  switch (operation?.toLowerCase()) {
    case 'append':
      return 'success';
    case 'overwrite':
      return 'warning';
    case 'delete':
      return 'error';
    case 'replace':
      return 'info';
    default:
      return 'primary';
  }
}

function copyTableJson() {
  try {
    const jsonString = JSON.stringify(table, null, 2);
    functions.copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to copy table JSON:', error);
  }
}

// Computed properties for safe access
const currentSnapshot = computed(() => getCurrentSnapshot());
const currentSchemaInfo = computed(() => getCurrentSchema());

// Graph visualization computed properties
const graphWidth = ref(1000);
const graphHeight = ref(700);

const branchInfo = computed(() => {
  const branches: Record<string, { color: string; type: string; snapshotId: number }> = {};
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b', '#c2185b'];
  let colorIndex = 0;

  // Add existing branches from refs
  if (table.metadata.refs) {
    Object.entries(table.metadata.refs).forEach(([branchName, refData]: [string, any]) => {
      branches[branchName] = {
        color: colors[colorIndex % colors.length],
        type: refData.type || 'branch',
        snapshotId: refData['snapshot-id'],
      };
      colorIndex++;
    });
  }

  // Detect dropped branches
  if (snapshotHistory.length > 0) {
    const sortedSnapshots = [...snapshotHistory].sort((a, b) => {
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

    // Find snapshots that are dropped branches
    // A dropped branch is a snapshot that:
    // 1. Has no children (is a leaf node)
    // 2. Is not the head of any named branch
    // 3. Is not part of the main development line
    sortedSnapshots.forEach((snapshot, index) => {
      const snapshotId = snapshot['snapshot-id'];
      const currentSeq = snapshot['sequence-number'] || 0;

      // Check if this snapshot has no children
      const hasChildren = childrenMap.has(snapshotId) && childrenMap.get(snapshotId)!.length > 0;

      // Check if this snapshot is the head of any named branch
      const isNamedBranchHead = Object.values(branches).some(
        (branch) => branch.snapshotId === snapshotId,
      );

      // Check if this snapshot is part of the main line of development
      // Main line consists of snapshots that have children or are the current head
      const isPartOfMainLine = hasChildren || isNamedBranchHead;

      // If this snapshot has no children and is not a named branch head,
      // it's likely a dropped branch
      if (!isPartOfMainLine && currentSeq > 1) {
        // Don't consider the initial snapshot
        const droppedBranchName = `dropped-seq-${currentSeq}`;

        branches[droppedBranchName] = {
          color: '#9e9e9e', // Gray color for dropped branches
          type: 'dropped-branch',
          snapshotId: snapshotId,
        };
      }
    });
  }

  return branches;
});

const graphNodes = computed(() => {
  if (!snapshotHistory.length) return [];

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
  const sortedSnapshots = [...snapshotHistory].sort((a, b) => {
    const seqA = a['sequence-number'] || 0;
    const seqB = b['sequence-number'] || 0;
    return seqA - seqB;
  });

  const nodeSpacingX = 120;
  const nodeSpacingY = 80;

  // Calculate dynamic height based on number of snapshots
  const minHeight = 200; // Minimum height for small graphs
  const padding = 100; // Top and bottom padding
  const calculatedHeight = padding + sortedSnapshots.length * nodeSpacingY;
  const totalHeight = Math.max(minHeight, calculatedHeight); // No maximum cap for large graphs
  graphHeight.value = totalHeight;

  // Create a map to track which column each branch should use
  const branchColumns = new Map<string, number>();
  let nextRightColumn = 1; // Columns to the right of main (1, 2, 3...)
  let nextLeftColumn = -1; // Columns to the left of main (-1, -2, -3...)

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
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    branchHistories.set(branchName, getBranchHistory(branch.snapshotId));
  });

  // Find divergence points between branches
  function findDivergencePoint(branch1History: number[], branch2History: number[]): number | null {
    // Find the last common snapshot between two branches
    const common = branch1History.filter((id) => branch2History.includes(id));
    if (common.length === 0) return null;

    // Find the snapshot with the highest sequence number among common ones
    let lastCommon = common[0];
    let maxSequence = 0;

    common.forEach((snapshotId) => {
      const snapshot = sortedSnapshots.find((s) => s['snapshot-id'] === snapshotId);
      if (snapshot && (snapshot['sequence-number'] || 0) > maxSequence) {
        maxSequence = snapshot['sequence-number'] || 0;
        lastCommon = snapshotId;
      }
    });

    return lastCommon;
  }

  // Assign columns for branches
  if (branchHistories.has('main')) {
    branchColumns.set('main', 0); // Main branch is at column 0
  }

  // Assign columns for branches
  const mainHistory = branchHistories.get('main') || [];
  branchHistories.forEach((history, branchName) => {
    if (branchName !== 'main' && !branchColumns.has(branchName)) {
      const branchType = branchInfo.value[branchName]?.type;

      if (branchType === 'dropped-branch') {
        // Dropped branches go to the left side
        branchColumns.set(branchName, nextLeftColumn--);
      } else {
        // Regular branches go to the right side
        branchColumns.set(branchName, nextRightColumn++);
      }
    }
  });

  // Calculate the range of columns to determine graph width and starting position
  const columnNumbers = Array.from(branchColumns.values());
  const minColumn = Math.min(...columnNumbers, 0); // Include 0 for main branch
  const maxColumn = Math.max(...columnNumbers, 0);

  // Adjust starting X position to account for left-side branches
  const leftPadding = Math.abs(minColumn) * nodeSpacingX + 80;
  const startX = leftPadding; // This will be the X position for column 0 (main)

  // Update graph width to accommodate all columns
  const totalColumns = maxColumn - minColumn + 1;
  graphWidth.value = leftPadding + (totalColumns - 1) * nodeSpacingX + 80;

  // Position snapshots from bottom (sequence 1) to top (latest sequence)
  sortedSnapshots.forEach((snapshot, index) => {
    const snapshotId = snapshot['snapshot-id'];
    const sequenceNumber = snapshot['sequence-number'] || 0;
    const schemaChangeInfo = getSchemaChangeInfo(snapshot);

    // Position from bottom to top (sequence 1 at bottom, higher sequences going up)
    // Use index directly: index 0 (sequence 1) at bottom, higher index going up
    const yPosition = totalHeight - nodeSpacingY - index * nodeSpacingY;

    // Determine which branches this snapshot belongs to
    const belongsToMain = mainHistory.includes(snapshotId);
    const otherBranches: string[] = [];
    const isDroppedBranch = Object.keys(branchInfo.value).some(
      (branchName) =>
        branchInfo.value[branchName].type === 'dropped-branch' &&
        branchInfo.value[branchName].snapshotId === snapshotId,
    );

    // Check regular branches (non-dropped)
    branchHistories.forEach((history, branchName) => {
      if (branchName !== 'main' && history.includes(snapshotId)) {
        // Skip if this is a dropped branch - it should be handled separately
        const branchType = branchInfo.value[branchName]?.type;
        if (branchType === 'dropped-branch') return;

        // Check if this snapshot is part of the unique path for this branch
        // (i.e., not shared with main branch)
        const divergencePoint = findDivergencePoint(mainHistory, history);
        const branchHead = branchInfo.value[branchName].snapshotId;

        // Trace from branch head to divergence point to get unique branch path
        const uniqueBranchPath: number[] = [];
        let current = branchHead;

        while (current && current !== divergencePoint) {
          uniqueBranchPath.push(current);
          const currentSnapshot = sortedSnapshots.find((s) => s['snapshot-id'] === current);
          current = currentSnapshot?.['parent-snapshot-id'];
        }

        if (uniqueBranchPath.includes(snapshotId)) {
          otherBranches.push(branchName);
        }
      }
    });

    // Create nodes based on branch membership
    if (isDroppedBranch) {
      // This is a dropped branch - give it its own column on the left side
      const droppedBranchName = Object.keys(branchInfo.value).find(
        (branchName) =>
          branchInfo.value[branchName].type === 'dropped-branch' &&
          branchInfo.value[branchName].snapshotId === snapshotId,
      );

      if (droppedBranchName && !branchColumns.has(droppedBranchName)) {
        branchColumns.set(droppedBranchName, nextLeftColumn--);
      }

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
        radius: schemaChangeInfo.hasSchemaChange ? 15 : 12, // Larger radius for schema changes
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
        radius: schemaChangeInfo.hasSchemaChange ? 18 : 15, // Even larger for divergence points with schema changes
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

const branchPaths = computed(() => {
  if (!graphNodes.value.length) return {};

  const paths: Record<string, { pathData: string; color: string }> = {};

  // Helper function to create straight or curved path with anti-crossing logic
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
      startY = startNode.y - startNode.radius; // Top of parent node
      endX = endNode.x;
      endY = endNode.y + endNode.radius; // Bottom of child node
    } else {
      // For regular connections: use margins from node centers
      const margin = 15; // Distance from node edge
      startX = startNode.x + (dx / distance) * margin;
      startY = startNode.y + (dy / distance) * margin;
      endX = endNode.x - (dx / distance) * margin;
      endY = endNode.y - (dy / distance) * margin;
    }

    // For straight vertical lines (same branch), always use straight line
    if (Math.abs(dx) < 10) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    // For branch divergence (lines between different columns), use anti-crossing curves
    if (isBranchDivergence && Math.abs(dx) > 50) {
      // Calculate dynamic offset based on branch index to prevent crossings
      const baseOffset = 30;
      const offsetMultiplier = 20; // Additional offset per branch
      const rightOffset = baseOffset + branchIndex * offsetMultiplier;

      // Calculate curve points to avoid crossings
      const verticalDistance = Math.abs(dy) * 0.3;
      const horizontalDistance = Math.abs(dx);

      // Use different curve strategies based on direction
      if (dx > 0) {
        // Diverging to the right - use outward curve
        const control1X = startX + rightOffset;
        const control1Y = startY - verticalDistance * 0.3;
        const control2X = startX + rightOffset + horizontalDistance * 0.4;
        const control2Y = startY - verticalDistance * 0.8;

        return `M ${startX} ${startY} 
                C ${control1X} ${control1Y} ${control2X} ${control2Y} ${endX} ${endY}`;
      } else {
        // Diverging to the left - use inward curve
        const control1X = startX - rightOffset;
        const control1Y = startY - verticalDistance * 0.3;
        const control2X = startX - rightOffset + horizontalDistance * 0.6;
        const control2Y = startY - verticalDistance * 0.8;

        return `M ${startX} ${startY} 
                C ${control1X} ${control1Y} ${control2X} ${control2Y} ${endX} ${endY}`;
      }
    }

    // For all other connections, use straight line
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  // Helper function to get branch history
  function getBranchHistoryForPaths(branchSnapshotId: number): number[] {
    if (!branchSnapshotId) return [];

    const history: number[] = [];
    const visited = new Set<number>();

    function trace(snapshotId: number) {
      if (visited.has(snapshotId)) return;
      visited.add(snapshotId);

      const snapshot = snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
      if (!snapshot) return;

      history.push(snapshotId);

      if (snapshot['parent-snapshot-id']) {
        trace(snapshot['parent-snapshot-id']);
      }
    }

    trace(branchSnapshotId);
    return history;
  }

  // First, collect all branch divergence connections to avoid duplicates
  const branchDivergenceConnections = new Set<string>();

  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branchName === 'main') return;

    // For dropped branches, we need special handling
    if (branch.type === 'dropped-branch') {
      // Find the parent of the dropped branch snapshot
      const droppedSnapshot = snapshotHistory.find((s) => s['snapshot-id'] === branch.snapshotId);
      if (droppedSnapshot && droppedSnapshot['parent-snapshot-id']) {
        branchDivergenceConnections.add(
          `${droppedSnapshot['parent-snapshot-id']}-${branch.snapshotId}`,
        );
      }
      return;
    }

    // Regular branch handling
    const branchHistory = getBranchHistoryForPaths(branch.snapshotId);
    const mainHistory = getBranchHistoryForPaths(branchInfo.value['main']?.snapshotId || 0);

    // Find last common snapshot
    const common = branchHistory.filter((id) => mainHistory.includes(id));
    if (common.length === 0) return;

    let divergenceSnapshotId = common[0];
    let maxSequence = 0;

    common.forEach((snapshotId) => {
      const snapshot = snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
      if (snapshot && (snapshot['sequence-number'] || 0) > maxSequence) {
        maxSequence = snapshot['sequence-number'] || 0;
        divergenceSnapshotId = snapshotId;
      }
    });

    // Find the first branch-specific snapshot (child of divergence point)
    const branchSpecificSnapshot = snapshotHistory.find(
      (s) =>
        s['parent-snapshot-id'] === divergenceSnapshotId &&
        branchHistory.includes(s['snapshot-id']) &&
        !mainHistory.includes(s['snapshot-id']),
    );

    if (branchSpecificSnapshot) {
      // Mark this connection as a branch divergence
      branchDivergenceConnections.add(
        `${divergenceSnapshotId}-${branchSpecificSnapshot['snapshot-id']}`,
      );
    }
  });

  // Create parent-child connections for each branch, but skip if it's a branch divergence
  graphNodes.value.forEach((node) => {
    if (node.parentId) {
      // Check if this is a branch divergence connection that we'll handle separately
      const connectionKey = `${node.parentId}-${node.snapshotId}`;
      if (branchDivergenceConnections.has(connectionKey)) {
        return; // Skip this connection, it will be handled as a branch divergence
      }

      // Find parent node in the same branch first
      let parentNode = graphNodes.value.find(
        (n) => n.snapshotId === node.parentId && n.branches[0] === node.branches[0],
      );

      // If no same-branch parent, find main branch parent (for branch connections)
      if (!parentNode) {
        parentNode = graphNodes.value.find(
          (n) => n.snapshotId === node.parentId && n.branches.includes('main'),
        );
      }

      if (parentNode) {
        const pathId = `connection-${node.id}-${parentNode.id}`;
        const branchColor = node.branches.includes('main')
          ? '#4caf50'
          : branchInfo.value[node.branches[0]]?.color || '#2196f3';

        paths[pathId] = {
          pathData: createPath(parentNode, node, false),
          color: branchColor,
        };
      }
    }
  });

  // Add branch divergence lines (from main branch to other branches at divergence points)
  let branchIndex = 0;
  Object.entries(branchInfo.value).forEach(([branchName, branch]) => {
    if (branchName === 'main') return;

    branchIndex++; // Increment for each non-main branch

    // Special handling for dropped branches
    if (branch.type === 'dropped-branch') {
      const droppedSnapshot = snapshotHistory.find((s) => s['snapshot-id'] === branch.snapshotId);
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
            color: branch.color || '#9e9e9e',
          };
        }
      }
      return;
    }

    // Regular branch handling
    const branchHistory = getBranchHistoryForPaths(branch.snapshotId);
    const mainHistory = getBranchHistoryForPaths(branchInfo.value['main']?.snapshotId || 0);

    // Find last common snapshot
    const common = branchHistory.filter((id) => mainHistory.includes(id));
    if (common.length === 0) return;

    let divergenceSnapshotId = common[0];
    let maxSequence = 0;

    common.forEach((snapshotId) => {
      const snapshot = snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
      if (snapshot && (snapshot['sequence-number'] || 0) > maxSequence) {
        maxSequence = snapshot['sequence-number'] || 0;
        divergenceSnapshotId = snapshotId;
      }
    });

    // Find the first branch-specific snapshot (child of divergence point)
    const branchSpecificSnapshot = snapshotHistory.find(
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
          n.snapshotId === branchSpecificSnapshot['snapshot-id'] && n.branches.includes(branchName),
      );

      if (divergenceNode && branchNode) {
        const pathId = `divergence-${branchName}-${divergenceSnapshotId}`;
        paths[pathId] = {
          pathData: createPath(divergenceNode, branchNode, true, branchIndex),
          color: branchInfo.value[branchName]?.color || '#2196f3',
        };
      }
    }
  });

  return paths;
});

function getBranchColor(branchName: string): string {
  return branchInfo.value[branchName]?.color || '#666';
}

function selectSnapshot(snapshotId: number) {
  const snapshot = snapshotHistory.find((s) => s['snapshot-id'] === snapshotId);
  if (snapshot) {
    selectedSnapshot.value = snapshot;
  }
}
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}

.font-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

.text-wrap {
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

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
</style>
