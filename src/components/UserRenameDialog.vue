<template>
  <v-dialog max-width="500" v-model="isDialogActive">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="warning"
        text="Rename"
        variant="outlined"
        size="small"
      ></v-btn>
    </template>

    <v-card title="New user name">
      <v-card-text>
        <v-text-field
          v-model="newName"
          label="New user name"
          placeholder="user name"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          @click="emmitNewUserName"
          color="success"
          :disabled="props.name === newName || newName === ''"
          >submit</v-btn
        >
        <v-btn text="Cancel" @click="cancelRoleInput" color="error"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { StatusIntent } from "@/common/enums";

const isDialogActive = ref(false);
const newName = ref("");
const emit = defineEmits<{
  (e: "renameUserName", user: { name: string; id: string }): void;
}>();

const props = defineProps<{
  name: string;
  id: string;
  status: StatusIntent;
}>();

function emmitNewUserName() {
  emit("renameUserName", { name: newName.value, id: props.id });
}
function cancelRoleInput() {
  isDialogActive.value = false;
}

onMounted(() => {
  console.log(props.name);
  newName.value = props.name;
});

watch(
  () => props.status,
  (newVal) => {
    if (newVal === StatusIntent.SUCCESS) {
      isDialogActive.value = false;
    }
  }
);
</script>
