<template>
  <v-breadcrumbs :items="breadcrumbs">
    <v-breadcrumbs-item />
    <template #divider>
      <v-icon icon="mdi-chevron-right"></v-icon>
    </template>
  </v-breadcrumbs>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
import { Breadcrumb } from '../common/interfaces';
import { useVisualStore } from '../stores/visual';
import { useFunctions } from '@/plugins/functions';
import * as env from '../app.config';

const functions = useFunctions();
const breadcrumbs = reactive<Breadcrumb[]>([]);

const visual = useVisualStore();

async function loadBreadcrumbs(url: string) {
  try {
    breadcrumbs.splice(0, breadcrumbs.length);
    const paths = url.split('/').filter(Boolean);

    let currentPath = `${env.baseUrlPrefix}/ui`;

    for (let index = 0; index < paths.length; index++) {
      const segment = paths[index];
      currentPath += `/${segment}`;

      let title = segment;
      if (index === 1) {
        const response = await functions.getWarehouse(paths[1]);
        title = response.name;
        breadcrumbs.push({
          title,
          href: currentPath,
        });
      } else if (index === 2 || index === 4) {
        continue;
      } else if (index === 3) {
        const nsId =
          segment.split(String.fromCharCode(0x1f)).length > 1
            ? segment.split(String.fromCharCode(0x1f))
            : segment.split('%1F');

        const priviousBreadcrumb = `${breadcrumbs[breadcrumbs.length - 1].href}/namespace`;
        const nsPreviousPath: string[] = [];
        let path = '';

        nsId.forEach((p) => {
          nsPreviousPath.push(p);
          path = `${priviousBreadcrumb}/${nsPreviousPath.join(String.fromCharCode(0x1f))}`;

          breadcrumbs.push({
            title: p,
            href: decodeURIComponent(path),
          });
        });
      } else {
        breadcrumbs.push({
          title,
          href: currentPath,
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

watch(
  () => visual.currentUrl,
  (newVal) => {
    loadBreadcrumbs(newVal);
  },
  { immediate: true },
);
</script>
