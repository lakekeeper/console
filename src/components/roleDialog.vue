<template>
  <v-dialog v-model="isDialogActive" max-width="500">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :color="actionType == 'add' ? 'info' : 'warning'"
        size="small"
        :text="`${props.actionType} Role`"
        :variant="actionType == 'add' ? 'flat' : 'outlined'"
      ></v-btn>
    </template>

    <v-card :title="$props.actionType == 'add' ? 'New Role' : 'Edit Role'">
      <v-card-text>
        <v-text-field
          v-model="roleData.name"
          label="Role Name"
          placeholder="my-role"
          :rules="[roleRule]"
        ></v-text-field>
        <v-textarea
          v-model="roleData.description"
          label="Role description"
          maxlength="500"
          placeholder="my role description"
          :rules="[roleRule]"
        ></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="success"
          :disabled="roleData.name == '' || roleData.name.length < 3"
          @click="createRole"
          >save role</v-btn
        >
        <v-btn color="error" text="Cancel" @click="cancelRoleInput"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, reactive } from 'vue';

const isDialogActive = ref(false);
const emit = defineEmits<{
  (e: 'roleInput', role: { name: string; description: string }): void;
}>();

const props = defineProps<{
  actionType: 'add' | 'edit';
  role?: {
    name: { type: string; default: '' };
    description: { type: string; default: '' };
  };
}>();

const roleData = reactive({
  name: '',
  description: '',
});

const roleRule = (value: string) =>
  value.length >= 3 || 'Namespace must be at least 3 characters long';

function createRole() {
  emit('roleInput', { name: roleData.name, description: roleData.description });
  cancelRoleInput();
}

function cancelRoleInput() {
  if (props.actionType === 'add') initRoleInput();
  isDialogActive.value = false;
}

function initRoleInput() {
  roleData.name = '';
  roleData.description = '';
}

onMounted(() => {
  Object.assign(roleData, props.role);
});
</script>
