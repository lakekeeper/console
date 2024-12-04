<template>
  <v-dialog max-width="500" v-model="isDialogActive">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :text="props.actionType == 'add' ? 'Add Project' : 'Rename'"
        size="small"
        color="info"
        :variant="props.actionType == 'add' ? 'flat' : 'outlined'"
      ></v-btn>
    </template>

    <v-card :title="props.actionType == 'add' ? 'Add Project' : 'Rename'">
      <v-card-text>
        <v-text-field
          v-model="project"
          :label="props.actionType == 'add' ? 'Add Project' : 'Rename'"
          placeholder="my-project"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          @click="emitProjectName"
          color="success"
          :disabled="project == '' || project == props.name"
          >Submit</v-btn
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
import { RenameProjectRequest } from "../gen/management/types.gen";

const isDialogActive = ref(false);

const project = ref("");

const props = defineProps<{
  actionType: "add" | "edit";
  name?: string;
  id: string;
}>();

const emit = defineEmits<{
  (e: "emit-project-newname", project: RenameProjectRequest): void;
}>();

function emitProjectName() {
  emit("emit-project-newname", {
    "new-name": project.value,
    "project-id": props.id,
  });
}
onMounted(() => {
  project.value = props.name || "";
});
</script>
