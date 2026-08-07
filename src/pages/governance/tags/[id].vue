<template>
  <v-row class="ml-1">
    <v-col>
      <TagDetail :tag-definition-id="params.id" />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { TagDetail } from '@lakekeeper/console-components';

const route = useRoute();
const params = computed(() => ({ id: (route.params as { id: string }).id }));
</script>
