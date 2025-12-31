<template>
  <v-row>
    <v-col>
      <v-card class="ma-6">
        <v-list-item class="mb-12" three-line>
          <div class="text-overline mb-4">User Profile</div>
          <v-list-item-title class="text-h5 mb-1">
            {{ user.given_name }} {{ user.family_name }}
          </v-list-item-title>
          <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-2">
            {{ userCatalog.id }}

            <v-btn
              :disabled="userCatalog.id == ''"
              icon="mdi-content-copy"
              size="small"
              variant="flat"
              @click="functions.copyToClipboard(userCatalog.id)"></v-btn>
          </v-list-item-subtitle>
        </v-list-item>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
import { VCard } from 'vuetify/components';
import { useUserStore } from '@lakekeeper/console-components';
import { useFunctions } from '@lakekeeper/console-components';

const functions = useFunctions();
const userStore = useUserStore();
const user = userStore.getUser();

const userCatalog = reactive<{ id: string }>({ id: '' });

onMounted(async () => {
  Object.assign(userCatalog, await functions.whoAmI());
});
</script>
