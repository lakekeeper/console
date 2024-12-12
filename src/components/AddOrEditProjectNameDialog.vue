<template>
  <v-dialog v-model="isDialogActive" max-width="500">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="info"
        size="small"
        :text="props.actionType == 'add' ? 'Add Project' : 'Rename'"
        :variant="props.actionType == 'add' ? 'flat' : 'outlined'"></v-btn>
    </template>

    <v-card :title="props.actionType == 'add' ? 'Add Project' : 'Rename'">
      <v-card-text>
        <v-text-field
          v-model="project"
          :label="props.actionType == 'add' ? 'Add Project' : 'Rename'"
          placeholder="my-project"></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="success"
          :disabled="project == '' || project == props.name"
          @click="emitProjectName">
          Submit
        </v-btn>
        <v-btn color="error" text="Cancel" @click="isDialogActive = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { RenameProjectRequest } from '../gen/management/types.gen';

const isDialogActive = ref(false);

const project = ref('');

const props = defineProps<{
  actionType: 'add' | 'edit';
  name?: string;
  id: string;
}>();

const emit = defineEmits<{
  (e: 'emitProjectNewName', project: RenameProjectRequest): void;
}>();

function emitProjectName() {
  emit('emitProjectNewName', {
    'new-name': project.value,
    'project-id': props.id,
  });
}
onMounted(() => {
  project.value = props.name || '';
});
</script>
