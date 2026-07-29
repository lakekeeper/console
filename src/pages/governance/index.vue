<template>
  <v-row class="ml-1">
    <v-col>
      <v-tabs v-model="tab">
        <v-tab value="tags">Tags</v-tab>
        <!-- Future governance surfaces (e.g. policies) slot in here. -->
      </v-tabs>
      <v-tabs-window v-model="tab" style="max-height: calc(100vh - 140px); overflow-y: auto">
        <v-tabs-window-item value="tags">
          <TagDefinitionManager v-if="tab === 'tags'" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const tab = ref((route.query.tab as string) || 'tags');
</script>
