<template>
  <v-dialog v-model="isDialogActive" max-width="900" min-height="60vh">
    <template #activator="{ props: activatorProps }">
      <span class="text-subtitle-2" v-bind="activatorProps">Connect Compute</span>
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

        <v-stepper-vertical-item
          v-if="compute != ''"
          :title="`Connect Catalog  for ${compute}`"
          value="2"
          @click:next="onClickFinish">
          <v-tabs v-model="tab">
            <v-tab value="human">human flow</v-tab>
            <v-tab value="machine">machine flow</v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="human">
              <v-card>
                <v-card-text>
                  <span class="text-h5">Token expires at {{ formatExpiresAt(expiresAt) }}</span>
                  <div style="display: flex; justify-content: flex-end">
                    <v-btn
                      icon="mdi-content-copy"
                      size="small"
                      variant="flat"
                      @click="functions.copyToClipboard(connectionStringHumanFlow)"></v-btn>
                  </div>
                  <pre style="white-space: pre-wrap; word-break: break-all">
                    <code class="language-sql" v-html="connectionStringHumanFlow"></code>
                    
                   </pre>
                </v-card-text>
              </v-card>
            </v-tabs-window-item>
            <v-tabs-window-item value="machine">
              <v-card>
                <v-card-text>
                  <span class="text-h5">
                    Ask your Administrotor for Client Id and Client Secret
                  </span>
                  <div style="display: flex; justify-content: flex-end">
                    <v-btn
                      icon="mdi-content-copy"
                      size="small"
                      variant="flat"
                      @click="functions.copyToClipboard(connectionStringMachineFlow)"></v-btn>
                  </div>
                  <pre style="white-space: pre-wrap; word-break: break-all">
                    <code class="language-sql" v-html="connectionStringMachineFlow"></code>
                    
                   </pre>
                </v-card-text>
              </v-card>
            </v-tabs-window-item>
          </v-tabs-window>

          <!-- @vue-skip -->
          <template #next="{ next }">
            <v-btn color="primary" text="Finish" @click="next"></v-btn>
          </template>
          <!-- @vue-skip -->
          <template #prev="{ prev }">
            <v-btn variant="plain" @click="prev"></v-btn>
          </template>
        </v-stepper-vertical-item>
      </template>
    </v-stepper-vertical>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { useAuth } from '@/plugins/auth';
import * as env from '@/app.config';
import { GetWarehouseResponse } from '@/gen/management';
import { User } from '@/common/interfaces';

const visuals = useVisualStore();
const functions = useFunctions();
const tab = ref('human');

const isDialogActive = ref(false);
const userFunctions = useAuth();
const accessToken = ref('');
const expiresAt = ref(0);

const props = defineProps<{
  warehouse: GetWarehouseResponse;
}>();

const compute = ref('');

const connectionStringHumanFlow = ref('');
const connectionStringMachineFlow = ref('');

function onClickFinish() {
  isDialogActive.value = false;
  compute.value = '';
}

function formatExpiresAt(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  let timeLeft = '';
  if (diff > 0) {
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      timeLeft = `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      timeLeft = `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
      timeLeft = `${minutes} minute${minutes > 1 ? 's' : ''} left`;
    }
  } else {
    timeLeft = 'expired';
  }

  return `${date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })} (${timeLeft})`;
}

watch(
  () => compute.value,
  async (newValue) => {
    const user = (await userFunctions.refreshToken()) as User;

    accessToken.value = user.access_token;
    expiresAt.value = user.token_expires_at;
    if (newValue === 'spark') {
      connectionStringHumanFlow.value = `
config = {
    "spark.sql.defaultCatalog": "${props.warehouse.name}",
    "spark.sql.catalog.${props.warehouse.name}": "org.apache.iceberg.spark.SparkCatalog",
    "spark.sql.catalog.${props.warehouse.name}.type": "rest",
    "spark.sql.catalog.${props.warehouse.name}.uri": CATALOG_URL,
    "spark.sql.catalog.${props.warehouse.name}.warehouse": DEMO_WAREHOUSE,
    "spark.sql.catalog.${props.warehouse.name}.token": access_token,
    "spark.sql.extensions": "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions",
    "spark.jars.packages": f"""org.apache.iceberg:iceberg-spark-runtime-{SPARK_MINOR_VERSION}_2.12:{ICEBERG_VERSION},org.apache.iceberg:iceberg-azure-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-aws-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-gcp-bundle:{ICEBERG_VERSION}"""
}
    
spark_config = SparkConf().setMaster('local').setAppName("Iceberg-REST")
for k, v in conf.items():
    spark_config = spark_config.set(k, v)

spark = SparkSession.builder.config(conf=spark_config).getOrCreate()

spark.sql("USE ${props.warehouse.name}")
      `;
      connectionStringMachineFlow.value = `
conf = {
    "spark.jars.packages": f"org.apache.iceberg:iceberg-azure-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-aws-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-gcp-bundle:{ICEBERG_VERSION}",
    "spark.sql.extensions": "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions",
    "spark.sql.catalog.${props.warehouse.name}": "org.apache.iceberg.spark.SparkCatalog",
    "spark.sql.catalog.${props.warehouse.name}.type": "rest",
    "spark.sql.catalog.${props.warehouse.name}.uri": CATALOG_URL,
    "spark.sql.catalog.${props.warehouse.name}.credential": f"{CLIENT_ID}:{CLIENT_SECRET}",
    "spark.sql.catalog.${props.warehouse.name}.warehouse": WAREHOUSE,
    "spark.sql.catalog.${props.warehouse.name}.scope": "lakekeeper",
    "spark.sql.catalog.${props.warehouse.name}.oauth2-server-uri": KEYCLOAK_TOKEN_ENDPOINT,
}
    
spark_config = SparkConf().setMaster('local').setAppName("Iceberg-REST")
for k, v in conf.items():
    spark_config = spark_config.set(k, v)

spark = SparkSession.builder.config(conf=spark_config).getOrCreate()

spark.sql("USE ${props.warehouse.name}")
      `;
    } else if (newValue === 'python') {
      connectionStringHumanFlow.value = `
catalog = RestCatalog(
    name="my_catalog",
    warehouse=DEMO_WAREHOUSE,
    uri=CATALOG_URL,
    token="dummy",
)`;
      connectionStringMachineFlow.value = `
catalog = RestCatalog(
    name="my_catalog",
    warehouse=DEMO_WAREHOUSE,
    uri=CATALOG_URL,
    token="dummy",
)`;
    } else if (newValue === 'trino') {
      connectionStringHumanFlow.value = `
CREATE CATALOG ${props.warehouse.name} USING iceberg 
WITH (
"iceberg.catalog.type" = 'rest',
"iceberg.rest-catalog.uri" = '${env.icebergCatalogUrl}',
"iceberg.rest-catalog.warehouse" = '${visuals.projectSelected['project-id']}/${props.warehouse.name}',
"iceberg.rest-catalog.security" = 'OAUTH2',
"iceberg.rest-catalog.oauth2.token" = '${accessToken.value}'
, "s3.regio" = 'dummy'
, "s3.path-style-access" = 'true'
, "s3.endpoint" = '{settings.s3_endpoint}'
, "fs.native-s3.enabled" = 'true'
)`;

      connectionStringMachineFlow.value = `
CREATE CATALOG ${props.warehouse.name} USING iceberg
WITH (
"iceberg.catalog.type" = 'rest',
"iceberg.rest-catalog.uri" = '${env.icebergCatalogUrl}',
"iceberg.rest-catalog.warehouse" = '${visuals.projectSelected['project-id']}/${props.warehouse.name}',
"iceberg.rest-catalog.security" = 'OAUTH2',
"iceberg.rest-catalog.oauth2.credential" = '{CLIENT_ID}:{CLIENT_SECRET}',
"iceberg.rest-catalog.vended-credentials-enabled" = 'true',
"iceberg.rest-catalog.oauth2.scope" = 'lakekeeper',
"iceberg.rest-catalog.oauth2.server-uri" = '${env.idpAuthority}',
"s3.region"= 'dummy',
"s3.path-style-access" = 'true',
"s3.endpoint" = 'http://minio:9000',
"fs.native-s3.enabled" = 'true'
)`;
    }
  },
);
</script>
