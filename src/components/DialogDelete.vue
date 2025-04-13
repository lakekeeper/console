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

        <v-row class="mt-6 mb-2">
          <v-col cols="auto">
            <span>Delete Options:</span>
            <v-icon class="ml-2" color="info" style="cursor: pointer" @click="expanded = !expanded">
              mdi-information-box-outline
            </v-icon>
          </v-col>
          <v-col class="text-left">
            <!-- Ensures text is aligned to the left -->
            <span v-if="expanded" class="mt-2">
              More information
              <a
                href="https://docs.lakekeeper.io/docs/nightly/concepts/#protection-and-deletion-mechanisms-in-lakekeeper"
                target="_blank"
                style="color: inherit">
                here
              </a>
            </span>
          </v-col>
        </v-row>
        <span v-if="props.type === 'namespace'">
          <v-switch v-model="optionsNamespace.force" class="ml-4" color="info" density="compact">
            <template #label>
              <div>
                <span>{{ optionsNamespace.force ? 'Force activated' : 'Force deactivated' }}</span>
                <div v-if="optionsNamespace.force" class="text-caption text-error">
                  Bypass Protection and skip Soft-Deletion
                </div>
              </div>
            </template>
          </v-switch>
          <v-switch
            v-model="optionsNamespace.recursive"
            class="ml-4"
            color="info"
            density="compact">
            <template #label>
              <div>
                <span>
                  {{ optionsNamespace.recursive ? 'Recursive activated' : 'Recursive deactivated' }}
                </span>
                <div v-if="optionsNamespace.recursive" class="text-caption text-error">
                  Recursive deletion of all objects in the namespace
                </div>
              </div>
            </template>
          </v-switch>
          <v-switch v-model="optionsNamespace.purge" class="ml-4" color="info" density="compact">
            <template #label>
              <div>
                <span>
                  {{ optionsNamespace.purge ? 'Purge activated' : 'Purge deactivated' }}
                </span>
                <div v-if="optionsNamespace.purge" class="text-caption text-error">
                  Purge deletes table and view data
                </div>
              </div>
            </template>
          </v-switch>
        </span>
        <span v-else-if="props.type === 'table'">
          <v-switch v-model="optionsTable.force" class="ml-4" color="info" density="compact">
            <template #label>
              <div>
                <span>{{ optionsTable.force ? 'Force activated' : 'Force deactivated' }}</span>
                <div v-if="optionsTable.force" class="text-caption text-error">
                  Bypass Protection and Skip Soft-Deletion
                </div>
              </div>
            </template>
          </v-switch>
          <v-switch
            v-model="optionsTable.purgeRequested"
            class="ml-4"
            color="info"
            density="compact">
            <template #label>
              <div>
                <span>
                  {{ optionsTable.purgeRequested ? 'Purge activated' : 'Purge deactivated' }}
                </span>
                <div v-if="optionsTable.purgeRequested" class="text-caption text-error">
                  Purge the underlying table's data and metadata
                </div>
              </div>
            </template>
          </v-switch>
        </span>
        <span v-else-if="props.type === 'view'">
          <v-switch v-model="optionsView.force" class="ml-4" color="info" density="compact">
            <template #label>
              <div>
                <span>{{ optionsView.force ? 'Force activated' : 'Force deactivated' }}</span>
                <div v-if="optionsView.force" class="text-caption text-error">
                  Bypass Protection and Skip Soft-Deletion
                </div>
              </div>
            </template>
          </v-switch>
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
const expanded = ref(false);
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
