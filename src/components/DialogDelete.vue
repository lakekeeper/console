<template>
  <v-dialog v-model="isDialogActive" max-width="500">
    <template #activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" rounded="pill" variant="flat">
        <v-icon color="error">mdi-delete-outline</v-icon>
      </v-btn>
    </template>

    <v-card :title="`Confirm deletion of ${props.type}`">
      <v-card-text>
        <div class="ma-2">Please enter the name "{{ props.name }}" to confirm the deletion</div>
        <v-text-field
          v-model="deleteName"
          :label="`Type ${capitalize(props.type)} Name`"
          maxlength="500"
          :placeholder="$props.name"></v-text-field>

        <div>Delete Options:</div>
        <span v-if="props.type === 'namespace'">
          <v-switch
            v-model="optionsNamespace.force"
            class="ml-4"
            color="info"
            :label="optionsNamespace.force ? 'Force activated' : 'Force deactivated'"></v-switch>
          <v-switch
            v-model="optionsNamespace.recursive"
            class="ml-4"
            color="info"
            :label="
              optionsNamespace.recursive ? 'Recursive activated' : 'Recursive deactivated'
            "></v-switch>
          <v-switch
            v-model="optionsNamespace.purge"
            class="ml-4"
            color="info"
            :label="optionsNamespace.purge ? 'Purge activated' : 'Purgedeactivated '"></v-switch>
        </span>
        <span v-else-if="props.type === 'table'">
          <v-switch
            v-model="optionsTable.force"
            class="ml-4"
            color="info"
            :label="optionsNamespace.force ? 'Force activated' : 'Force deactivated'"></v-switch>
          <v-switch
            v-model="optionsTable.purgeRequested"
            class="ml-4"
            color="info"
            :label="
              optionsNamespace.recursive ? 'Purge activated' : 'Purge deactivated'
            "></v-switch>
        </span>
        <span v-else-if="props.type === 'view'">
          <v-switch
            v-model="optionsView.force"
            class="ml-4"
            color="info"
            :label="optionsNamespace.force ? 'Force activated' : 'Force deactivated'"></v-switch>
        </span>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="success"
          :disabled="deleteName != $props.name"
          text="Confirm"
          @click="confirm"></v-btn>
        <v-btn color="error" text="Cancel" @click="reject"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, ref, reactive } from 'vue';

const deleteName = ref('');

const optionsNamespace = reactive({
  force: false,
  recursive: false,
  purge: false,
});

const optionsTable = reactive({
  force: false,
  purgeRequested: false,
});

const optionsView = reactive({
  force: false,
});

const props = defineProps<{
  type: string;
  name: string;
}>();

const emit = defineEmits<{
  (e: 'deleteWithOptions', options: { force: boolean; recursive: boolean; purge: boolean }): void;
  (e: 'deleteTableWithOptions', options: { force: boolean; purgeRequested: boolean }): void;
  (e: 'deleteViewWithOptions', options: { force: boolean }): void;
}>();

const isDialogActive = ref(false);

function confirm() {
  if (props.type === 'namespace') {
    emit('deleteWithOptions', optionsNamespace);
  } else if (props.type === 'table') {
    emit('deleteTableWithOptions', optionsTable);
  } else if (props.type === 'view') {
    emit('deleteViewWithOptions', optionsView);
  }
}
function reject() {
  isDialogActive.value = false;
}
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>
