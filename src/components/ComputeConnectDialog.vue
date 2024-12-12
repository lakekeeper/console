<template>
  <v-dialog v-model="isDialogActive" max-width="900" min-height="60vh">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="info"
        size="small"
        text="Connect Compute"
        variant="flat"></v-btn>
    </template>
    <v-stepper-vertical>
      <template #default="{ step }">
        <v-stepper-vertical-item
          :complete="(step as number) > 1"
          title="Choose your compute"
          value="1">
          <v-row>
            <v-col>
              <v-card
                class="mx-auto"
                :color="compute == 'spark' ? 'grey-lighten-1' : 'white'"
                hover
                max-width="344"
                subtitle="Connect Spark to Lakekeeper "
                title="Apache Spark"
                @click="compute = 'spark'">
                <template #prepend>
                  <v-img src="@/assets/spark-icon.svg" :width="80"></v-img>
                </template>
              </v-card>
            </v-col>
            <v-col>
              <v-card
                class="mx-auto"
                :color="compute == 'python' ? 'grey-lighten-1' : 'white'"
                hover
                max-width="344"
                subtitle="Connect Python to Lakekeeper "
                title="PyIceberg"
                @click="compute = 'python'">
                <template #prepend>
                  <v-img src="@/assets/python-icon.svg" :width="60"></v-img>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-card
                class="mx-auto"
                :color="compute == 'trino' ? 'grey-lighten-1' : 'white'"
                hover
                max-width="344"
                subtitle="Connect Trino to Lakekeeper "
                title="Trino"
                @click="compute = 'trino'">
                <template #prepend>
                  <v-img src="@/assets/trino-icon.svg" :width="60"></v-img>
                </template>
              </v-card>
            </v-col>
            <v-col></v-col>
          </v-row>
          <!-- @vue-skip -->
          <template #next="{ next }">
            <v-btn color="primary" :disabled="compute == ''" @click="next"></v-btn>
          </template>

          <template #prev></template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item title="Create Catalog" value="2" @click:next="onClickFinish">
          <v-tabs v-model="tab">
            <v-tab value="human">human flow</v-tab>
            <v-tab value="machine">machine flow</v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="human">
              <v-card>
                <v-card-text>
                  <div style="display: flex; justify-content: flex-end">
                    <v-btn
                      icon="mdi-content-copy"
                      size="small"
                      variant="flat"
                      @click="functions.copyToClipboard(formattedTrinoSQL)"></v-btn>
                  </div>
                  <pre style="white-space: pre-wrap; word-break: break-all">
                    <code class="language-sql" v-html="formattedTrinoSQL"></code>
                    
                   </pre>
                </v-card-text>
              </v-card>
            </v-tabs-window-item>
            <v-tabs-window-item value="machine"></v-tabs-window-item>
          </v-tabs-window>

          <!-- @vue-skip -->
          <template #next="{ next }">
            <v-btn color="primary" text="Finish" @click="next"></v-btn>
          </template>
          <!-- @vue-skip -->
          <template #prev="{ prev }">
            <v-btn v-if="!finished" variant="plain" @click="prev"></v-btn>
          </template>
        </v-stepper-vertical-item>
      </template>
    </v-stepper-vertical>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { useAuth } from '@/plugins/auth';
import * as env from '@/app.config';

const visuals = useVisualStore();
const functions = useFunctions();
const tab = ref('human');

const isDialogActive = ref(false);
const userFunctions = useAuth();
const accessToken = ref('');

const props = defineProps<{
  warehouseName: string;
}>();

const compute = ref('');
const extraConfigS3 =
  ', "s3.regio" = \'dummy\', "s3.path-style-access" = \'true\',  "s3.endpoint" = \'{settings.s3_endpoint}\', "fs.native-s3.enabled" = \'true\'';
const formattedTrinoSQL = ref('');

onMounted(async () => {
  // Object.assign(role, props.role);
  try {
    const user = await userFunctions.refreshToken();

    accessToken.value = user.access_token;
    console.log('Access token: ', accessToken.value);
    formattedTrinoSQL.value = `
  CREATE CATALOG ${props.warehouseName} USING iceberg 
  WITH (
  "iceberg.catalog.type" = 'rest',
  "iceberg.rest-catalog.uri" = '${env.icebergCatalogUrl}',
  "iceberg.rest-catalog.warehouse" = '${visuals.projectSelected['project-id']}/${props.warehouseName}',
  "iceberg.rest-catalog.security" = 'OAUTH2',
  "iceberg.rest-catalog.oauth2.token" = '${accessToken.value}'
  ${extraConfigS3} )`;
  } catch (error) {
    console.error(error);
  }
});

function onClickFinish() {
  isDialogActive.value = false;
  compute.value = '';
}
</script>
