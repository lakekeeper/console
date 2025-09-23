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
          <v-tab value="history" @click="loadTabData">history</v-tab>
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
                  @click="depthRawRepresentation = depthRawRepresentationMax"
                  append-icon="mdi-expand-all">
                  Expand
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

            <v-tabs-window-item value="history">
              <v-card-text>
                <div v-if="snapshotHistory.length === 0" class="text-center pa-8">
                  <v-icon size="64" color="grey">mdi-camera-off-outline</v-icon>
                  <div class="text-subtitle-1 mt-2">No snapshots found</div>
                  <div class="text-body-2 text-medium-emphasis">
                    This table has no snapshot history
                  </div>
                </div>

                <!-- Interactive Timeline Overview -->
                <div v-if="snapshotHistory.length > 0" class="mb-6">
                  <div class="text-subtitle-1 mb-3 d-flex align-center">
                    <v-icon class="mr-2" size="small">mdi-timeline-clock-outline</v-icon>
                    Timeline Overview
                    <v-spacer></v-spacer>
                    <v-chip size="small" variant="outlined" class="ml-2">
                      {{ snapshotHistory.length }} snapshots
                    </v-chip>
                  </div>

                  <v-card variant="outlined" class="pa-4">
                    <div class="horizontal-timeline-container" style="overflow-x: auto">
                      <v-timeline
                        direction="horizontal"
                        density="compact"
                        class="pa-0"
                        style="min-width: max-content">
                        <v-timeline-item
                          v-for="(event, index) in timelineEvents"
                          :key="event.id"
                          :dot-color="
                            event.type === 'schema-change'
                              ? 'warning'
                              : index === 0
                                ? 'success'
                                : 'info'
                          "
                          :size="event.type === 'schema-change' ? 'x-small' : 'small'"
                          style="min-width: 200px">
                          <template #icon>
                            <div
                              v-if="event.type === 'snapshot'"
                              style="
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                              "
                              @click="scrollToSnapshot(event.snapshot['snapshot-id'])">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-icon
                                    v-bind="props"
                                    :size="index === 0 ? 16 : 14"
                                    color="white">
                                    {{ index === 0 ? 'mdi-check-circle' : 'mdi-camera' }}
                                  </v-icon>
                                </template>
                                {{ event.snapshot['snapshot-id'] }}
                              </v-tooltip>
                            </div>
                            <div
                              v-else-if="event.type === 'schema-change'"
                              style="display: flex; align-items: center; justify-content: center">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-icon v-bind="props" size="12" color="white">
                                    mdi-table-cog
                                  </v-icon>
                                </template>
                                Schema Change: {{ event.schemaId }}
                              </v-tooltip>
                            </div>
                          </template>

                          <!-- Content directly under the icon -->
                          <div
                            class="text-center timeline-item-content"
                            style="min-width: 180px; max-width: 180px">
                            <div v-if="event.type === 'snapshot'">
                              <div class="text-caption mb-1">
                                {{ formatTimelineDate(event.snapshot['timestamp-ms']) }}
                              </div>
                              <div v-if="event.snapshot.summary?.operation">
                                <v-chip
                                  size="x-small"
                                  :color="getOperationColor(event.snapshot.summary.operation)"
                                  variant="flat"
                                  class="text-caption">
                                  {{ event.snapshot.summary.operation }}
                                </v-chip>
                              </div>
                            </div>
                            <div v-else-if="event.type === 'schema-change'">
                              <div class="text-caption mb-1" style="color: #fb8c00">
                                Schema Change
                              </div>
                              <v-chip
                                size="x-small"
                                color="warning"
                                variant="flat"
                                class="text-caption">
                                ID: {{ event.schemaId }}
                              </v-chip>
                            </div>
                          </div>
                        </v-timeline-item>
                      </v-timeline>
                    </div>
                  </v-card>
                </div>

                <div style="max-height: 60vh; overflow-y: auto" class="vertical-timeline-container">
                  <v-timeline
                    v-if="snapshotHistory.length > 0"
                    side="end"
                    density="compact"
                    class="pa-0">
                    <v-timeline-item
                      v-for="(snapshot, index) in snapshotHistory"
                      :key="snapshot['snapshot-id']"
                      :dot-color="index === 0 ? 'success' : 'info'"
                      size="small"
                      :data-snapshot-id="snapshot['snapshot-id']">
                      <template #icon>
                        <v-icon v-if="index === 0" size="small">mdi-check-circle</v-icon>
                        <v-icon v-else size="small">mdi-camera</v-icon>
                      </template>

                      <v-card
                        variant="outlined"
                        class="mb-4"
                        :data-snapshot-id="snapshot['snapshot-id']">
                        <v-card-title class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center">
                            <v-chip
                              v-if="index === 0"
                              size="small"
                              color="success"
                              variant="flat"
                              class="mr-2">
                              Current
                            </v-chip>
                            <span class="font-mono">{{ snapshot['snapshot-id'] }}</span>
                          </div>
                          <v-btn
                            icon="mdi-content-copy"
                            size="small"
                            variant="flat"
                            @click="
                              functions.copyToClipboard(String(snapshot['snapshot-id']))
                            "></v-btn>
                        </v-card-title>

                        <v-divider></v-divider>

                        <v-card-text>
                          <v-row>
                            <v-col cols="12" md="6">
                              <v-list density="compact">
                                <v-list-item>
                                  <v-list-item-title>Timestamp</v-list-item-title>
                                  <v-list-item-subtitle>
                                    {{ formatTimestamp(snapshot['timestamp-ms']) }}
                                  </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="snapshot.summary?.operation">
                                  <v-list-item-title>Operation</v-list-item-title>
                                  <v-list-item-subtitle>
                                    <v-chip size="small" variant="outlined">
                                      {{ snapshot.summary.operation }}
                                    </v-chip>
                                  </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="snapshot['schema-id']">
                                  <v-list-item-title>Schema ID</v-list-item-title>
                                  <v-list-item-subtitle class="font-mono">
                                    {{ snapshot['schema-id'] }}
                                    <v-chip
                                      v-if="getSchemaChanges(snapshot, index)"
                                      size="x-small"
                                      color="warning"
                                      variant="flat"
                                      class="ml-2">
                                      Schema Changed
                                    </v-chip>
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-list>
                            </v-col>

                            <v-col cols="12" md="6">
                              <v-list density="compact">
                                <v-list-item v-if="snapshot['manifest-list']">
                                  <v-list-item-title>Manifest List</v-list-item-title>
                                  <v-list-item-subtitle class="d-flex align-center">
                                    <span
                                      class="mr-2 font-mono text-truncate"
                                      style="max-width: 200px">
                                      {{ snapshot['manifest-list'] }}
                                    </span>
                                    <v-btn
                                      icon="mdi-content-copy"
                                      size="small"
                                      variant="flat"
                                      @click="
                                        functions.copyToClipboard(snapshot['manifest-list'])
                                      "></v-btn>
                                  </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="snapshot['parent-snapshot-id']">
                                  <v-list-item-title>Parent Snapshot</v-list-item-title>
                                  <v-list-item-subtitle class="font-mono">
                                    {{ snapshot['parent-snapshot-id'] }}
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-list>
                            </v-col>
                          </v-row>

                          <!-- Summary Details -->
                          <v-row
                            v-if="snapshot.summary && Object.keys(snapshot.summary).length > 1">
                            <v-col cols="12">
                              <v-divider class="my-2"></v-divider>
                              <div class="text-subtitle-2 mb-2 d-flex align-center">
                                <v-icon size="small" class="mr-1">mdi-chart-line</v-icon>
                                Operation Summary
                              </div>
                              <v-row>
                                <v-col
                                  v-for="(value, key) in snapshot.summary"
                                  :key="key"
                                  cols="6"
                                  md="3">
                                  <v-list-item
                                    class="pa-0"
                                    density="compact"
                                    v-if="String(key) !== 'operation'">
                                    <v-list-item-title class="text-caption text-medium-emphasis">
                                      {{ formatSummaryKey(key) }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="font-mono text-body-2">
                                      {{ formatSummaryValue(value) }}
                                    </v-list-item-subtitle>
                                  </v-list-item>
                                </v-col>
                              </v-row>
                            </v-col>
                          </v-row>

                          <!-- Schema Changes -->
                          <v-row v-if="getSchemaInfo(snapshot['schema-id'])">
                            <v-col cols="12">
                              <v-divider class="my-2"></v-divider>
                              <v-expansion-panels variant="accordion" class="mt-2">
                                <v-expansion-panel>
                                  <v-expansion-panel-title class="text-subtitle-2">
                                    <v-icon class="mr-2" size="small">mdi-table-cog</v-icon>
                                    Schema Details ({{
                                      getSchemaInfo(snapshot['schema-id'])?.fields?.length || 0
                                    }}
                                    fields)
                                    <v-chip
                                      v-if="getSchemaChanges(snapshot, index)"
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
                                          v-for="field in getSchemaInfo(snapshot['schema-id'])
                                            ?.fields || []"
                                          :key="field.id"
                                          class="pa-1">
                                          <template #prepend>
                                            <v-icon
                                              :color="
                                                isFieldNew(field, snapshot, index)
                                                  ? 'success'
                                                  : undefined
                                              "
                                              size="small">
                                              {{ getFieldIcon(field) }}
                                            </v-icon>
                                          </template>
                                          <v-list-item-title
                                            :class="
                                              isFieldNew(field, snapshot, index)
                                                ? 'text-success font-weight-bold'
                                                : ''
                                            ">
                                            {{ field.name }}
                                            <v-chip
                                              v-if="isFieldNew(field, snapshot, index)"
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
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-timeline-item>
                  </v-timeline>
                </div>
              </v-card-text>
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

// Helper functions for history tab
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

function scrollToSnapshot(snapshotId: number) {
  console.log('Scrolling to snapshot:', snapshotId);

  // Find the container first
  const container = document.querySelector('.vertical-timeline-container') as HTMLElement;

  if (!container) {
    console.log('Vertical timeline container not found');
    return;
  }

  // Find the specific card element within the vertical timeline container
  // Since v-card renders as a div, we need to look for any element with the data attribute
  const element = container.querySelector(
    `[data-snapshot-id="${snapshotId}"]:not(.v-timeline-item)`,
  ) as HTMLElement;

  console.log('Found container:', container);
  console.log('Found element:', element);

  if (element) {
    // Get the actual card element (should be a div with v-card classes)
    const cardElement = (element.closest('.v-card') || element) as HTMLElement;

    // Calculate element's position relative to container
    const elementTop = cardElement.offsetTop;
    const containerHeight = container.clientHeight;
    const elementHeight = cardElement.offsetHeight;

    // Calculate target scroll position to center the element
    const targetScrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

    console.log('Container height:', containerHeight);
    console.log('Element top offset:', elementTop);
    console.log('Element height:', elementHeight);
    console.log('Target scroll position:', targetScrollTop);

    // Scroll to the calculated position
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });

    // Add a brief highlight effect
    cardElement.classList.add('snapshot-highlight');
    setTimeout(() => {
      cardElement.classList.remove('snapshot-highlight');
    }, 2000);
  } else {
    console.log('No card element found with snapshot ID:', snapshotId);
    // Debug: Show all elements with data-snapshot-id in the container
    const allElements = container.querySelectorAll('[data-snapshot-id]');
    console.log(
      'All snapshot elements found in container:',
      Array.from(allElements).map((el) => ({
        id: el.getAttribute('data-snapshot-id'),
        tagName: el.tagName,
        classList: Array.from(el.classList),
      })),
    );

    // Fallback: try any element with the snapshot ID in the container
    const fallbackElement = container.querySelector(
      `[data-snapshot-id="${snapshotId}"]`,
    ) as HTMLElement;
    if (fallbackElement) {
      console.log('Using fallback element');
      fallbackElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }
}

function formatTimelineDate(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
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

// Computed properties for safe access
const currentSnapshot = computed(() => getCurrentSnapshot());
const currentSchemaInfo = computed(() => getCurrentSchema());

// Create timeline events that include both snapshots and schema changes
const timelineEvents = computed(() => {
  const events: Array<{
    type: 'snapshot' | 'schema-change';
    snapshot?: any;
    schemaId?: number;
    timestampMs: number;
    id: string;
  }> = [];

  // Add all snapshots as events
  snapshotHistory.forEach((snapshot, index) => {
    // Check if this snapshot introduces a new schema (compared to the previous snapshot)
    if (index < snapshotHistory.length - 1) {
      const prevSnapshot = snapshotHistory[index + 1]; // Previous in time (next in array since sorted desc)
      if (snapshot['schema-id'] !== prevSnapshot['schema-id']) {
        // Add schema change event before this snapshot
        events.push({
          type: 'schema-change',
          schemaId: snapshot['schema-id'],
          timestampMs: snapshot['timestamp-ms'] - 1, // Slightly before the snapshot
          id: `schema-${prevSnapshot['schema-id']}-${snapshot['schema-id']}`,
        });
      }
    }

    // Add the snapshot event
    events.push({
      type: 'snapshot',
      snapshot,
      timestampMs: snapshot['timestamp-ms'],
      id: `snapshot-${snapshot['snapshot-id']}`,
    });
  });

  // Sort events by timestamp (descending, newest first)
  return events.sort((a, b) => b.timestampMs - a.timestampMs);
});
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

.timeline-bubble-avatar {
  transition: all 0.2s ease;
}

.timeline-bubble-avatar:hover {
  transform: scale(1.1);
}

.snapshot-highlight {
  animation: highlight-pulse 2s ease-in-out;
}

.vertical-timeline-container {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 8px;
}

.horizontal-timeline-container {
  max-width: 100%;
  scrollbar-width: thin;
}

.horizontal-timeline-container::-webkit-scrollbar {
  height: 6px;
}

.horizontal-timeline-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.horizontal-timeline-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.horizontal-timeline-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.timeline-item-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0.1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}
</style>
