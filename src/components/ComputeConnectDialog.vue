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
                :color="
                  warehouse['storage-profile'].type !== 's3'
                    ? 'grey-lighten-1'
                    : compute == 'trino'
                      ? 'grey-lighten-1'
                      : 'white'
                "
                :hover="warehouse['storage-profile'].type === 's3'"
                max-width="344"
                subtitle="Connect Trino to Lakekeeper "
                title="Trino"
                @click="unsupportedWarehouseForTrino">
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
                  <VCodeBlock
                    :code="connectionStringHumanFlow"
                    highlightjs
                    lang="python"
                    :copy-button="false" />
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
                  <VCodeBlock
                    :code="connectionStringMachineFlow"
                    highlightjs
                    lang="python"
                    :copy-button="false" />
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
import * as env from '@/app.config';
import { icebergCatalogUrlSuffixed, idpAuthority } from '@/app.config';
import { Type, User } from '@/common/interfaces';
import { GetWarehouseResponse, S3Profile } from '@/gen/management';
import { useAuth } from '@/plugins/auth';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { VCodeBlock } from '@wdns/vue-code-block';
import { ref, watch } from 'vue';

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

function unsupportedWarehouseForTrino() {
  console.log('unsupportedWarehouseForTrino');
  if (props.warehouse['storage-profile'].type === 's3') {
    compute.value = 'trino';
  } else {
    visuals.setSnackbarMsg({
      text: `The warehouse storage profile (${props.warehouse['storage-profile'].type}) is not supported by Trino`,
      ttl: 5000,
      type: Type.WARNING,
      ts: Date.now(),
    });
  }
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
    let tokenEndpoint = '';
    try {
      const response = await fetch(userFunctions.userManager.settings.metadataUrl);
      const metadata = await response.json();
      tokenEndpoint = metadata['token_endpoint'];
    } catch (error) {
      console.error('Error fetching the token endpoint:', error);
      tokenEndpoint = '<ADD TOKEN ENDPOINT HERE>';
    }

    accessToken.value = user.access_token;
    expiresAt.value = user.token_expires_at;
    if (newValue === 'spark') {
      const prefix = `
import pyspark
from pyspark.conf import SparkConf
from pyspark.sql import SparkSession

SPARK_VERSION = pyspark.__version__
SPARK_MINOR_VERSION = '.'.join(SPARK_VERSION.split('.')[:2])
ICEBERG_VERSION = "1.7.0"`;
      const suffix = `
spark_config = SparkConf().setMaster('local').setAppName("Iceberg-REST")
for k, v in config.items():
    spark_config = spark_config.set(k, v)

spark = SparkSession.builder.config(conf=spark_config).getOrCreate()

spark.sql("USE ${props.warehouse.name}")`;
      connectionStringHumanFlow.value = `
${prefix}

config = {
    "spark.sql.defaultCatalog": "${props.warehouse.name}",
    "spark.sql.catalog.${props.warehouse.name}": "org.apache.iceberg.spark.SparkCatalog",
    "spark.sql.catalog.${props.warehouse.name}.type": "rest",
    "spark.sql.catalog.${props.warehouse.name}.uri": "${icebergCatalogUrlSuffixed}",
    "spark.sql.catalog.${props.warehouse.name}.warehouse": "${props.warehouse.name}",
    "spark.sql.catalog.${props.warehouse.name}.token": "${user.access_token}",
    "spark.sql.extensions": "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions",
    "spark.jars.packages": f"""org.apache.iceberg:iceberg-spark-runtime-{SPARK_MINOR_VERSION}_2.12:{ICEBERG_VERSION},org.apache.iceberg:iceberg-azure-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-aws-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-gcp-bundle:{ICEBERG_VERSION}"""
}

${suffix}`;
      connectionStringMachineFlow.value = `
${prefix}

CLIENT_ID = "<ENTER YOUR CLIENT_ID HERE>"
CLIENT_SECRET = "<ENTER YOUR CLIENT_SECRET HERE>"

conf = {
    "spark.jars.packages": f"org.apache.iceberg:iceberg-azure-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-aws-bundle:{ICEBERG_VERSION},org.apache.iceberg:iceberg-gcp-bundle:{ICEBERG_VERSION}",
    "spark.sql.extensions": "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions",
    "spark.sql.catalog.${props.warehouse.name}": "org.apache.iceberg.spark.SparkCatalog",
    "spark.sql.catalog.${props.warehouse.name}.type": "rest",
    "spark.sql.catalog.${props.warehouse.name}.uri": "${icebergCatalogUrlSuffixed}",
    "spark.sql.catalog.${props.warehouse.name}.credential": f"{CLIENT_ID}:{CLIENT_SECRET}",
    "spark.sql.catalog.${props.warehouse.name}.warehouse": "${props.warehouse.name}",
    "spark.sql.catalog.${props.warehouse.name}.scope": "lakekeeper",
    "spark.sql.catalog.${props.warehouse.name}.oauth2-server-uri": "${idpAuthority}",
}

${suffix}
`;
    } else if (newValue === 'python') {
      connectionStringHumanFlow.value = `
from pyiceberg.catalog.rest import RestCatalog

catalog = RestCatalog(
    name="${props.warehouse.name}",
    warehouse="${props.warehouse.name}",
    uri="${icebergCatalogUrlSuffixed}",
    token="${user.access_token}",
)`;
      connectionStringMachineFlow.value = `
from pyiceberg.catalog.rest import RestCatalog

CLIENT_ID = "<ENTER YOUR CLIENT_ID HERE>"
CLIENT_SECRET = "<ENTER YOUR CLIENT_SECRET HERE>"

catalog = RestCatalog(
    name="${props.warehouse.name}",
    warehouse="${props.warehouse.name}",
    uri="${icebergCatalogUrlSuffixed}",
    credential=f"{CLIENT_ID}:{CLIENT_SECRET}",
    **{"rest.authorization-url": "${tokenEndpoint}", "scope": "lakekeeper"},
)`;
    } else if (newValue === 'trino') {
      const storageDetails = props.warehouse['storage-profile'];
      let extraOpts = '';
      if (storageDetails.type === 's3') {
        let s3Details = storageDetails as S3Profile;
        extraOpts = `,
"fs.native-s3.enabled" = 'true',
"s3.region" = '${s3Details.region || 'dummy'}'`;
        if (s3Details['path-style-access']) {
          extraOpts += `,
"s3.path-style-access" = '${s3Details['path-style-access']}',
"s3.bucket"`;
        }
        if (s3Details['path-style-access']) {
          extraOpts += `,
"s3.endpoint" = '${s3Details.endpoint}',
`;
        }
      } else if (storageDetails.type === 'adls') {
        extraOpts = `,
"fs.native-azure.enabled" = 'true'`;
        visuals.setSnackbarMsg({
          text: "Adls will probably not work with Trino. We're on it.",
          ttl: 5000,
          type: Type.WARNING,
          ts: Date.now(),
        });
      } else if (storageDetails.type === 'gcs') {
        extraOpts = `,
fs.native-gcs.enabled = 'true'
`;
        visuals.setSnackbarMsg({
          text: "GCS will probably not work with Trino. We're on it.",
          ttl: 5000,
          type: Type.WARNING,
          ts: Date.now(),
        });
      }

      connectionStringHumanFlow.value = `
from trino.dbapi import connect

TRINO_URI = "<ENTER YOUR TRINO URI HERE>"
TRINO_USER = "<ENTER YOUR TRINO USER HERE>"

conn = connect(
    host=TRINO_URI,
    user="trino",
)
cursor = conn.cursor();

cursor.execute(f"""CREATE CATALOG ${props.warehouse.name} USING iceberg
WITH (
"iceberg.catalog.type" = 'rest',
"iceberg.rest-catalog.uri" = '${env.icebergCatalogUrlSuffixed}',
"iceberg.rest-catalog.warehouse" = '${visuals.projectSelected['project-id']}/${props.warehouse.name}',
"iceberg.rest-catalog.security" = 'OAUTH2',
"iceberg.rest-catalog.vended-credentials-enabled" = 'true',
"iceberg.rest-catalog.oauth2.token" = '${accessToken.value}'${extraOpts})
""")

conn = connect(
    host=TRINO_URI,
    user="trino",
    catalog="${props.warehouse.name}",
)`;

      connectionStringMachineFlow.value = `
from trino.dbapi import connect

TRINO_URI = "<ENTER YOUR TRINO URI HERE>"
TRINO_USER = "<ENTER YOUR TRINO USER HERE>"
CLIENT_ID = "<ENTER YOUR CLIENT_ID HERE>"
CLIENT_SECRET = "<ENTER YOUR CLIENT_SECRET HERE>"

conn = connect(
    host=TRINO_URI,
    user=TRINO_USER,
)

cursor = conn.cursor();

cursor.execute(f"""CREATE CATALOG ${props.warehouse.name} USING iceberg
WITH (
"iceberg.catalog.type" = 'rest',
"iceberg.rest-catalog.uri" = '${env.icebergCatalogUrlSuffixed}',
"iceberg.rest-catalog.warehouse" = '${visuals.projectSelected['project-id']}/${props.warehouse.name}',
"iceberg.rest-catalog.security" = 'OAUTH2',
"iceberg.rest-catalog.oauth2.credential" = '{CLIENT_ID}:{CLIENT_SECRET}',
"iceberg.rest-catalog.vended-credentials-enabled" = 'true',
"iceberg.rest-catalog.oauth2.scope" = 'lakekeeper',
"iceberg.rest-catalog.oauth2.server-uri" = '${tokenEndpoint}'${extraOpts})
""")

conn = connect(
    host=TRINO_URI,
    user="trino",
    catalog="${props.warehouse.name}",
)
`;
    }
  },
);
</script>
