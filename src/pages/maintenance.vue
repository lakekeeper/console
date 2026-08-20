<template>
  <div class="maintenance-container">
    <PlusTeaser
      title="Automated maintenance for your lakehouse"
      description="Small files pile up. Snapshots accumulate. Orphaned data burns storage. Lakekeeper+ cleans it all up, on a schedule."
      :features="features"
      source="maintenance"
      subject="Lakekeeper+ — Maintenance">
      <template #oss-note>
        Open source shows tasks one entity at a time, in its
        <strong>Tasks</strong>
        tab. Lakekeeper+ adds scheduling, compaction and the project-wide view.
      </template>
    </PlusTeaser>
  </div>
</template>

<script lang="ts" setup>
import PlusTeaser from '@/components/PlusTeaser.vue';

const features = [
  {
    icon: 'mdi-view-dashboard-outline',
    title: 'One dashboard',
    text: 'Every task, every warehouse, one view.',
  },
  {
    icon: 'mdi-clock-outline',
    title: 'Runs on a schedule',
    text: 'Set it once. Per warehouse, namespace or table.',
  },
  {
    icon: 'mdi-file-compare',
    title: 'Compaction',
    text: 'Merge small files. Faster queries, lower request costs.',
  },
  {
    icon: 'mdi-broom',
    title: 'Automatic cleanup',
    text: 'Expire snapshots, purge deleted tables, reclaim orphans.',
  },
  {
    icon: 'mdi-tune-variant',
    title: 'Per-table overrides',
    text: 'Sensible defaults, exceptions where you need them.',
  },
  {
    icon: 'mdi-history',
    title: 'History & retries',
    text: 'See what failed and why. Retry in one click.',
  },
];
</script>

<style scoped>
.maintenance-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 24px;
  width: 100%;
  max-height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  overflow-y: auto;
}

@media (max-width: 960px) {
  .maintenance-container {
    padding: 8px 16px;
  }
}
</style>
