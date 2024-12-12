<template>
  <v-dialog v-model="isDialogActive" max-width="500">
    <template #activator="{ props: activatorProps }">
      <span class="text-subtitle-2" v-bind="activatorProps">Rename Warehouse</span>
    </template>
    <v-card :title="state.title">
      <v-card-text>
        <v-text-field
          v-model="warehouseNameInput"
          :label="state.label"
          :placeholder="state.placeholder"
          :rules="[rules]"></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="success"
          :disabled="
            warehouseNameInput == '' ||
            warehouseNameInput.length < 3 ||
            warehouseNameInput == warehouseName
          "
          @click="emitRename">
          rename
        </v-btn>
        <v-btn color="error" text="Cancel" @click="isDialogActive = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
const isDialogActive = ref(false);
const rules = (value: string) =>
  value.length >= 3 || 'Namespace must be at least 3 characters long';

const warehouseNameInput = ref('');

const state = reactive({
  title: 'Rename Warehouse',
  label: 'Warehouse Name',
  placeholder: 'my-warehouse',
});

const { warehouseName } = defineProps<{
  warehouseName: string;
}>();

const emit = defineEmits<{
  (e: 'renameWarehouse', warehouseName: string): void;
}>();

function emitRename() {
  emit('renameWarehouse', warehouseNameInput.value);
  isDialogActive.value = false;
}

onMounted(() => {
  warehouseNameInput.value = warehouseName;
});
</script>
