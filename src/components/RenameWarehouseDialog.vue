<template>
  <v-dialog max-width="500" v-model="isDialogActive">
    <template v-slot:activator="{ props: activatorProps }">
      <span class="text-subtitle-2" v-bind="activatorProps">
        Rename Warehouse</span
      >
    </template>
    <v-card :title="state.title">
      <v-card-text>
        <v-text-field
          v-model="warehouseNameInput"
          :label="state.label"
          :placeholder="state.placeholder"
          :rules="[rules]"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          @click="emitRename"
          color="success"
          :disabled="
            warehouseNameInput == '' ||
            warehouseNameInput.length < 3 ||
            warehouseNameInput == warehouseName
          "
          >rename</v-btn
        >
        <v-btn
          text="Cancel"
          @click="isDialogActive = false"
          color="error"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const isDialogActive = ref(false);
const rules = (value: string) =>
  value.length >= 3 || "Namespace must be at least 3 characters long";

const warehouseNameInput = ref("");

const state = reactive({
  title: "Rename Warehouse",
  label: "Warehouse Name",
  placeholder: "my-warehouse",
});

const { warehouseName } = defineProps<{
  warehouseName: string;
}>();

const emit = defineEmits<{
  (e: "rename-warehouse", warehouseName: string): void;
}>();

function emitRename() {
  emit("rename-warehouse", warehouseNameInput.value);
  isDialogActive.value = false;
}

onMounted(() => {
  warehouseNameInput.value = warehouseName;
});
</script>
