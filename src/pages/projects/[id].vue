<template>
  <div class="pa-4">
    <!-- No heading: the pane's own identity row names the project, and a title
         above it would say the same thing twice. -->
    <ProjectDetail :project-id="projectId" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ProjectDetail } from '@lakekeeper/console-components';

const route = useRoute();
const projectId = computed(() => (route.params as { id: string }).id ?? '');
</script>
