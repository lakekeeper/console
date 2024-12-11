<template>
  <v-dialog v-model="isDialogActive" max-width="500">
    <template #activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" rounded="pill" variant="flat">
        <v-icon color="error">mdi-delete-outline</v-icon>
      </v-btn>
    </template>

    <v-card :title="`Confirm deletion of ${props.type}`">
      <v-card-text>
        <div class="ma-2">Please enter the name "{{ props.name }}" to confirm the delition</div>
        <v-text-field
          v-model="deleteName"
          :label="`${props.type} Name`"
          maxlength="500"
          :placeholder="$props.name"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="success"
          :disabled="deleteName != $props.name"
          text="Confirm"
          @click="confirm"
        ></v-btn>
        <v-btn color="error" text="Cancel" @click="reject"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, ref } from 'vue';

const deleteName = ref('');

const props = defineProps<{
  type: string;
  name: string;
}>();

const emit = defineEmits<{
  (e: 'confirmed'): void;
  (e: 'rejected'): void;
}>();

const isDialogActive = ref(false);

function confirm() {
  emit('confirmed');
}
function reject() {
  isDialogActive.value = false;
}
</script>
