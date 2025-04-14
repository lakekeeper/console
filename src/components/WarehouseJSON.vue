<template>
  <v-form @submit.prevent="handleSubmit">
    <!--Storage Credentials-->
    <span v-if="credentialType === 'service-account-key'">
      <v-switch
        v-model="useFileInput"
        :label="!useFileInput ? 'Enable File Import' : 'Enable Text Input'"></v-switch>

      <v-file-input
        v-if="useFileInput"
        accept="application/json"
        label="warehouse.json"
        :rules="[rules.required]"
        @change="handleFileInput"></v-file-input>
      <v-textarea
        v-else
        v-model="JSONString"
        label='{ "warehouse-name": "aws_docs", "storage-credential": { "type": ...'
        :rules="[rules.required, rules.validJson]"
        @update:model-value="verifyKeyJson"></v-textarea>
    </span>

    <v-divider></v-divider>

    <!--Storage Profile-->

    <div>
      <v-btn :disabled="!JSONStringIsValid" type="submit">Submit</v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { WarehousObject } from '@/common/interfaces';
import { ref, Ref } from 'vue';

const credentialType: Ref<'service-account-key' | 'gcp-system-identity'> =
  ref('service-account-key');

const JSONString = ref('');
const JSONStringIsValid = ref(false);
const useFileInput = ref(true);

const emit = defineEmits<{
  (e: 'submit', warehouseObjectDataEmit: WarehousObject): void;
}>();

const rules = {
  required: (value: any) => !!value || 'Required.',

  validJson: (value: string) => {
    try {
      JSON.parse(value);
      verifyKeyJson();
      return true;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return 'Invalid JSON';
    }
  },
};

const handleSubmit = () => {
  emit('submit', warehouseObjectData);
};

function handleFileInput(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target && e.target.result) {
          const json = JSON.parse(e.target.result as string);

          if (
            warehouseObjectData['storage-credential']['credential-type'] === 'service-account-key'
          ) {
            warehouseObjectData['storage-credential'].key = json;
          }
          JSONStringIsValid.value = true;
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  }
}

function verifyKeyJson() {
  try {
    if (JSONString.value !== '') {
      const JSONStringParsed = JSON.parse(JSONString.value);

      console.log('Parsed JSON:', JSONStringParsed);
      JSONStringIsValid.value = true;
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
}
</script>
