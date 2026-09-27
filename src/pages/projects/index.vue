<template>
  <div class="px-4 pt-4">
    <h1 class="text-h6 mb-4 d-flex align-center ga-2">
      <v-icon>mdi-home-silo</v-icon>
      Projects
    </h1>
    <!-- No height here: the pane measures its own top edge and ends above the
         footer, which is the only thing that stays right when the heading
         above it wraps or a banner appears. -->
    <ProjectsView />
  </div>
</template>

<script lang="ts" setup>
import { ProjectsView } from '@lakekeeper/console-components';
</script>
