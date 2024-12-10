<template>
  <v-dialog v-model="isDialogActive" max-width="300">
    <v-card style="max-height: 90vh; overflow-y: auto">
      <v-card-title>Deleting</v-card-title>

      <v-card-text style="min-height: 25vh">
        <v-row justify="center">
          <v-progress-circular
            class="mt-4"
            color="error"
            indeterminate
            :size="126"
          ></v-progress-circular>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";

const isDialogActive = ref(false);

const { deleting } = defineProps<{
  deleting: boolean;
}>();

onMounted(() => {
  if (deleting) {
    isDialogActive.value = true;
  }
});

watch(
  () => deleting,
  (oldVal: boolean, newVal: boolean) => {
    isDialogActive.value = newVal;
  }
);
</script>
