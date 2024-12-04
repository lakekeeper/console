<template>
  <v-dialog max-width="500" v-model="isDialogActive">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" variant="flat" rounded="pill">
        <v-icon color="error">mdi-delete-outline</v-icon>
      </v-btn>
    </template>

    <v-card :title="`Confirm deletion of ${props.type}`">
      <v-card-text>
        <div class="ma-2">
          Please enter the name "{{ props.name }}" to confirm the delition
        </div>
        <v-text-field
          v-model="name"
          :label="`${props.type} Name`"
          maxlength="500"
          :placeholder="$props.name"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          text="Confirm"
          @click="confirm"
          color="success"
          :disabled="name != $props.name"
        ></v-btn>
        <v-btn text="Cancel" @click="reject" color="error"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from "vue";

const name = ref("");

const props = defineProps<{
  type: string;
  name: string;
}>();

const emit = defineEmits<{
  (e: "confirmed"): void;
  (e: "rejected"): void;
}>();

const isDialogActive = ref(false);

function confirm() {
  emit("confirmed");
}
function reject() {
  isDialogActive.value = false;
}
</script>
