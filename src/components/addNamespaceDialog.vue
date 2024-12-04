<template>
  <v-dialog max-width="500" v-model="isDialogActive">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        text="Add Namespace"
        size="small"
        color="info"
        variant="flat"
      ></v-btn>
    </template>

    <v-card
      title="New Namespace"
      :subtitle="`${props.parentPath
        .split(String.fromCharCode(0x1f))
        .join('.')}`"
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

        <v-btn @click="addNamespace" color="success" :disabled="namespace == ''"
          >add namespace</v-btn
        >
        <v-btn
          text="Cancel"
          @click="
            isDialogActive = false;
            namespace = '';
          "
          color="error"
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
  (e: "add-namespace", namespace: string[]): void;
}>();

function addNamespace() {
  const namespaceURLEncoded = encodeURIComponent(namespace.value);

  const namespaceArray =
    props.parentPath.length > 0
      ? props.parentPath.split(String.fromCharCode(0x1f))
      : [];
  namespaceArray.push(namespaceURLEncoded);

  emit("add-namespace", namespaceArray);
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
