<template>
  <v-dialog max-width="500" v-model="isDialogActive">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :color="actionType == 'add' ? 'info' : 'warning'"
        :text="`${props.actionType} Role`"
        :variant="actionType == 'add' ? 'flat' : 'outlined'"
        size="small"
      ></v-btn>
    </template>

    <v-card :title="$props.actionType == 'add' ? 'New Role' : 'Edit Role'">
      <v-card-text>
        <v-text-field
          v-model="role.name"
          label="Role Name"
          placeholder="my-role"
          :rules="[roleRule]"
        ></v-text-field>
        <v-textarea
          v-model="role.description"
          label="Role description"
          placeholder="my role description"
          :rules="[roleRule]"
          maxlength="500"
        ></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          @click="createRole"
          color="success"
          :disabled="role.name == '' || role.name.length < 3"
          >save role</v-btn
        >
        <v-btn text="Cancel" @click="cancelRoleInput" color="error"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { reactive, defineEmits, defineProps } from "vue";

const isDialogActive = ref(false);
const emit = defineEmits<{
  (e: "roleInput", role: { name: string; description: string }): void;
}>();

const props = defineProps<{
  actionType: "add" | "edit";
  role?: {
    name: { type: string; default: "" };
    description: { type: string; default: "" };
  };
}>();

const role = reactive({
  name: "",
  description: "",
});

const roleRule = (value: string) =>
  value.length >= 3 || "Namespace must be at least 3 characters long";

function createRole() {
  emit("roleInput", { name: role.name, description: role.description });
  cancelRoleInput();
}

function cancelRoleInput() {
  if (props.actionType == "add") initRoleInput();
  isDialogActive.value = false;
}

function initRoleInput() {
  role.name = "";
  role.description = "";
}

onMounted(() => {
  Object.assign(role, props.role);
});
</script>
