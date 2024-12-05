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
          :complete="step as number > 2"
          title="Create Credantials"
          value="2"
        >
          <v-card>
            <v-card-text>
              {{ userStore.getUser().refresh_token }}
              <br />
              <v-btn
                icon="mdi-content-copy"
                variant="flat"
                size="small"
                @click="
                  functions.copyToClipboard(userStore.getUser().refresh_token)
                "
              ></v-btn>
            </v-card-text>
          </v-card>

          <template v-slot:next="{ next }">
            <v-btn color="primary" @click="next"></v-btn>
          </template>

          <template v-slot:prev="{ prev }">
            <v-btn variant="plain" @click="prev"></v-btn>
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          subtitle="Confirmation"
          title="Step three"
          value="3"
          @click:next="isDialogActive = false"
        >
          <v-card>
            <v-card-text>
              <span
                style="
                  width: 500px;
                  display: block;
                  overflow: auto;
                  text-align: left;
                "
              >
                <pre
                  class="language-sql"
                  style="white-space: pre-wrap; word-wrap: break-word"
                >
          <code ref="codeRef" class="language-sql" style="text-align: left;">{{ formattedTrinoSQL }}</code>
        </pre>
              </span>
            </v-card-text>
          </v-card>

          <template v-slot:next="{ next }">
            <v-btn color="primary" text="Finish" @click="next"></v-btn>
          </template>

          <template v-slot:prev="{ prev }">
            <v-btn v-if="!finished" variant="plain" @click="prev"></v-btn>
          </template>
        </v-stepper-vertical-item>
      </template>
    </v-stepper-vertical>
  </v-dialog>
</template>

<script lang="ts" setup>
import { reactive, defineEmits, defineProps, shallowRef } from "vue";
import { useUserStore } from "@/stores/user";
import { useFunctions } from "@/plugins/functions";
const functions = useFunctions();
const userStore = useUserStore();
const finished = shallowRef(false);
const isDialogActive = ref(false);
const emit = defineEmits<{
  (e: "roleInput", role: { name: string; description: string }): void;
}>();

// const props = defineProps<{
//   actionType: "add" | "edit";
//   role?: {
//     name: { type: string; default: "" };
//     description: { type: string; default: "" };
//   };
// }>();

const compute = ref("");

const formattedTrinoSQL = ref(
  `CREATE CATALOG {warehouse.normalized_catalog_name} USING iceberg  WITH ( "iceberg.catalog.type" = 'rest', "iceberg.rest-catalog.uri" = '{warehouse.server.catalog_url}', "iceberg.rest-catalog.warehouse" = '{warehouse.project_id}/{warehouse.warehouse_name}', "iceberg.rest-catalog.security" = 'OAUTH2',  "iceberg.rest-catalog.oauth2.token" = '{warehouse.access_token}',  "iceberg.rest-catalog.vended-credentials-enabled" = 'true' {extra_config} )`
);

const role = reactive({
  name: "",
  description: "",
});

const roleRule = (value: string) =>
  value.length >= 3 || "Namespace must be at least 3 characters long";

function createRole() {
  emit("roleInput", { name: role.name, description: role.description });
  cancelRoleInput();
}

function cancelRoleInput() {
  // if (props.actionType == "add") initRoleInput();
  isDialogActive.value = false;
}

function initRoleInput() {
  role.name = "";
  role.description = "";
}

onMounted(() => {
  // Object.assign(role, props.role);
});
</script>
