<template>
  <v-dialog v-model="isDialogActive" max-width="500">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="info"
        size="small"
        text="Add Namespace"
        variant="flat"
      ></v-btn>
    </template>

    <v-card
      :subtitle="`${props.parentPath
        .split(String.fromCharCode(0x1f))
        .join('.')}`"
      title="New Namespace"
    >
      <v-card-text>
        <v-text-field
          v-model="namespace"
          label="Namespace Name"
          placeholder="my-namepsace"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn color="success" :disabled="namespace == ''" @click="addNamespace"
          >add namespace</v-btn
        >
        <v-btn
          color="error"
          text="Cancel"
          @click="
            isDialogActive = false;
            namespace = '';
          "
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { StatusIntent } from "@/common/enums";
const isDialogActive = ref(false);

const namespace = ref("");

const props = defineProps<{
  parentPath: string;
  statusIntent: StatusIntent;
}>();

const emit = defineEmits<{
  (e: "addNamespace", namespace: string[]): void;
}>();

function addNamespace() {
  const namespaceURLEncoded = encodeURIComponent(namespace.value);

  const namespaceArray =
    props.parentPath.length > 0
      ? props.parentPath.split(String.fromCharCode(0x1f))
      : [];
  namespaceArray.push(namespaceURLEncoded);

  emit("addNamespace", namespaceArray);
}

watch(
  () => props.statusIntent,
  (oldStatusIntent, newStatusIntent) => {
    if (newStatusIntent === StatusIntent.SUCCESS) {
      isDialogActive.value = false;
      namespace.value = "";
    }
  },
  {
    immediate: true,
  }
);
</script>
