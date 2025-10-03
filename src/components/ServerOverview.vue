<template>
  <v-card class="ml-2">
    <v-list-item class="mb-12" two-line>
      <div class="text-overline mb-4">Server Information</div>
      <v-list-item-title class="text-h7 mb-1">
        Server ID: {{ projectInfo['server-id'] }}
      </v-list-item-title>
      <v-list-item-subtitle>
        <div>Server Version: {{ projectInfo.version }}</div>
        <div>Bootstraped: {{ projectInfo.bootstrapped }}</div>
        <div>Authenticated by: {{ projectInfo['authz-backend'] }}</div>
        <div v-if="projectInfo['aws-system-identities-enabled']">
          AWS system identities:
          {{ projectInfo['aws-system-identities-enabled'] ? 'enabled' : 'disabled' }}
        </div>

        <div v-if="projectInfo['azure-system-identities-enabled']">
          Azure system identities:
          {{ projectInfo['azure-system-identities-enabled'] ? 'enabled' : 'disabled' }}
        </div>
        <div v-if="projectInfo['gcp-system-identities-enabled']">
          GCP system identities:
          {{ projectInfo['gcp-system-identities-enabled'] ? 'enabled' : 'disabled' }}
        </div>
        <div
          v-if="
            !projectInfo['aws-system-identities-enabled'] &&
            !projectInfo['azure-system-identities-enabled'] &&
            !projectInfo['gcp-system-identities-enabled']
          ">
          No system identities are used
        </div>
      </v-list-item-subtitle>
    </v-list-item>
  </v-card>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useFunctions } from '@/plugins/functions';

const functions = useFunctions();
const projectInfo = ref<any>({});

onMounted(async () => {
  projectInfo.value = await functions.getServerInfo();
});
</script>
