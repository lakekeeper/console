<template>
  <v-card>
    <v-card-title>Role: {{ role.name }}</v-card-title>

    <v-card-subtitle v-if="role.id">
      <div v-if="role['created-at']">Created At: {{ role['created-at'] }}</div>
      ID: {{ role.id }}
      <v-btn
        icon="mdi-content-copy"
        size="small"
        variant="flat"
        @click="functions.copyToClipboard(role.id)"></v-btn>
    </v-card-subtitle>

    <v-card-text>
      <v-row>
        <v-col>
          <v-textarea
            v-model="role.description"
            label="Role description"
            placeholder="my role description"
            readonly
            style="max-width: 500px"></v-textarea>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn color="info" size="small" to="/roles" variant="outlined">Back</v-btn>
      <RoleDialog
        v-if="role.name"
        :action-type="'edit'"
        :role="role as any"
        @role-input="editRole" />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
import { useFunctions } from '@/plugins/functions';

const props = defineProps<{
  roleId: string;
}>();

const emit = defineEmits<{
  (e: 'roleLoaded', role: any): void;
}>();

const functions = useFunctions();

const role = reactive<any>({
  id: '',
  name: '',
  description: '',
  'created-at': '',
});

onMounted(async () => {
  await loadRole();
});

async function loadRole() {
  Object.assign(role, await functions.getRole(props.roleId));
  emit('roleLoaded', role);
}

async function editRole(roleIn: { name: string; description: string }) {
  await functions.updateRole(role.id, roleIn.name, roleIn.description);
  await loadRole();
}
</script>
