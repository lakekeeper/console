<template>
  <v-dialog max-width="900" v-model="isDialogActive" min-height="60vh">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        text="Connect Compute"
        size="small"
        color="info"
        variant="flat"
      ></v-btn>
    </template>
    <v-stepper-vertical>
      <template v-slot:default="{ step }">
        <v-stepper-vertical-item
          :complete="step as number > 1"
          title="Choose your compute"
          value="1"
        >
          <v-row>
            <v-col>
              <v-card
                :color="compute == 'spark' ? 'grey-lighten-1' : 'white'"
                class="mx-auto"
                max-width="344"
                subtitle="Connect Spark to Lakekeeper "
                title="Apache Spark"
                hover
                @click="compute = 'spark'"
              >
                <template v-slot:prepend>
                  <v-img :width="80" src="@/assets/spark-icon.svg"></v-img>
                </template>
              </v-card>
            </v-col>
            <v-col>
              <v-card
                :color="compute == 'python' ? 'grey-lighten-1' : 'white'"
                class="mx-auto"
                max-width="344"
                subtitle="Connect Python to Lakekeeper "
                title="PyIceberg"
                hover
                @click="compute = 'python'"
              >
                <template v-slot:prepend>
                  <v-img :width="60" src="@/assets/python-icon.svg"></v-img>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-card
                :color="compute == 'trino' ? 'grey-lighten-1' : 'white'"
                class="mx-auto"
                max-width="344"
                subtitle="Connect Trino to Lakekeeper "
                title="Trino"
                hover
                @click="compute = 'trino'"
              >
                <template v-slot:prepend>
                  <v-img :width="60" src="@/assets/trino-icon.svg"></v-img>
                </template>
              </v-card>
            </v-col>
            <v-col> </v-col>
          </v-row>
          <!-- @vue-skip -->
          <template v-slot:next="{ next }">
            <v-btn
              color="primary"
              @click="next"
              :disabled="compute == ''"
            ></v-btn>
          </template>

          <template v-slot:prev></template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          title="Create Catalog"
          value="2"
          @click:next="onClickFinish"
        >
          <v-tabs v-model="tab">
            <v-tab value="human">human flow</v-tab>
            <v-tab value="machine">machine flow </v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="human">
              <v-card>
                <v-card-text>
                  <div style="display: flex; justify-content: flex-end">
                    <v-btn
                      icon="mdi-content-copy"
                      variant="flat"
                      size="small"
                      @click="functions.copyToClipboard(formattedTrinoSQL)"
                    ></v-btn>
                  </div>
                  <pre style="white-space: pre-wrap; word-break: break-all">
                    <code class="language-sql" v-html="formattedTrinoSQL"></code>
                    
                   </pre>
                </v-card-text>
              </v-card>
            </v-tabs-window-item>
            <v-tabs-window-item value="machine"> </v-tabs-window-item>
          </v-tabs-window>

          <!-- @vue-skip -->
          <template v-slot:next="{ next }">
            <v-btn color="primary" text="Finish" @click="next"></v-btn>
          </template>
          <!-- @vue-skip -->
          <template v-slot:prev="{ prev }">
            <v-btn v-if="!finished" variant="plain" @click="prev"></v-btn>
          </template>
        </v-stepper-vertical-item>
      </template>
    </v-stepper-vertical>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useFunctions } from "@/plugins/functions";
import { useVisualStore } from "@/stores/visual";
import { useAuth } from "@/plugins/auth";
import * as env from "@/app.config";

const visuals = useVisualStore();
const functions = useFunctions();
const tab = ref("human");

const isDialogActive = ref(false);
const userFunctions = useAuth();
const accessToken = ref("");

const props = defineProps<{
  warehouseName: string;
}>();

const compute = ref("");
const extraConfigS3 =
  ", \"s3.regio\" = 'dummy', \"s3.path-style-access\" = 'true',  \"s3.endpoint\" = '{settings.s3_endpoint}', \"fs.native-s3.enabled\" = 'true'";
const formattedTrinoSQL = ref("");

onMounted(async () => {
  // Object.assign(role, props.role);
  try {
    const user = await userFunctions.refreshToken();

    accessToken.value = user.access_token;
    console.log("Access token: ", accessToken.value);
    formattedTrinoSQL.value = `
  CREATE CATALOG ${props.warehouseName} USING iceberg 
  WITH (
  "iceberg.catalog.type" = 'rest',
  "iceberg.rest-catalog.uri" = '${env.icebergCatalogUrl}',
  "iceberg.rest-catalog.warehouse" = '${visuals.projectSelected["project-id"]}/${props.warehouseName}',
  "iceberg.rest-catalog.security" = 'OAUTH2',
  "iceberg.rest-catalog.oauth2.token" = '${accessToken.value}'
  ${extraConfigS3} )`;
  } catch (error) {
    console.error(error);
  }
});

function onClickFinish() {
  isDialogActive.value = false;
  compute.value = "";
}
</script>
