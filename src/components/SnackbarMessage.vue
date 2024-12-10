<template>
  <v-snackbar
    v-for="(msg, index) in snackbarMsgs"
    :key="index"
    v-model="msg.visible"
    location="top"
    :timeout="msg.ttl"
    :timer="getTimerColor(msg)"
  >
    {{ msg.text }}
    <template #actions>
      <v-btn :color="msg.type" @click="msg.visible = false"> Close </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useVisualStore } from '@/stores/visual';
import { SnackbarMsg, Type } from '@/common/interfaces';

const visual = useVisualStore();
const snackbarMsgs = ref<Array<{ text: string; ttl: number; visible: boolean; type: Type }>>([]);

const snackbarMsg = computed<SnackbarMsg>(() => {
  const obj: SnackbarMsg = visual.getSnackbarMsg();
  return obj;
});

watch(
  () => snackbarMsg.value.ts,
  (newVal) => {
    if (newVal) {
      snackbarMsgs.value.push({
        text: snackbarMsg.value.text,
        ttl: snackbarMsg.value.ttl,
        visible: true,
        type: snackbarMsg.value.type,
      });
    }
  },
);

function getTimerColor(msg: { type: Type }): string {
  // Cover over types Success and Info and colors
  switch (msg.type) {
    case Type.ERROR:
      return 'red';
    case Type.WARNING:
      return 'orange';
    case Type.INFO:
      return 'blue';
    case Type.SUCCESS:
      return 'green';
    default:
      return 'grey';
  }
}
</script>

<style>
.v-snackbar--active {
  & ~ & {
    transform: translateY(60px);
  }
  & ~ & ~ & {
    transform: translateY(120px);
  }
  & ~ & ~ & ~ & {
    transform: translateY(180px);
  }
  & ~ & ~ & ~ & ~ & {
    transform: translateY(240px);
  }
}
</style>
