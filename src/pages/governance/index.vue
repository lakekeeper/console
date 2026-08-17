<template>
  <div class="pa-4">
    <h1 class="text-h6 mb-4 d-flex align-center ga-2">
      <v-icon>mdi-shield-check-outline</v-icon>
      Governance
    </h1>
    <v-tabs v-model="tab">
      <v-tab value="tags">Tags</v-tab>
      <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
      <!-- Grants sit beside Permissions rather than replacing them: the two are
           different models over the same intent. -->
      <v-tab v-if="showGrantsTab" value="grants">Grants</v-tab>
      <!-- Policies stay a Lakekeeper+ capability, so this tab always renders and
           always markets: Cedar policies are what the open-source console has no
           equivalent for, unlike grants. -->
      <v-tab value="policies">
        Policies
        <v-chip size="x-small" color="primary" variant="tonal" class="ml-2">PLUS</v-chip>
      </v-tab>
    </v-tabs>
    <v-tabs-window
      v-model="tab"
      crossfade
      style="max-height: calc(100vh - 140px); overflow-y: auto">
      <v-tabs-window-item value="tags">
        <TagDefinitionManager v-if="tab === 'tags'" />
      </v-tabs-window-item>
      <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
        <PermissionExplorer v-if="tab === 'permissions'" />
      </v-tabs-window-item>
      <v-tabs-window-item v-if="showGrantsTab" value="grants">
        <GrantsExplorer v-if="tab === 'grants'" />
      </v-tabs-window-item>
      <v-tabs-window-item value="policies">
        <PlusTeaser
          v-if="tab === 'policies'"
          compact
          title="Permissions as code"
          :description="[
            'Define access with Cedar policies.',
            'Version them, review them, ship them like code.',
          ]"
          :features="policyFeatures"
          source="governance-policies"
          subject="Lakekeeper+ — Permissions as code">
          <template #oss-note>
            Open source gives you
            <strong>Permissions</strong>
            and
            <strong>Grants</strong>
            — one assignment at a time. Lakekeeper+ adds Cedar policies that decide them by rule.
          </template>
        </PlusTeaser>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVisualStore, useGrantsSupported } from '@lakekeeper/console-components';
import PlusTeaser from '@/components/PlusTeaser.vue';

const route = useRoute();
const router = useRouter();
const visual = useVisualStore();

const tab = ref('tags');
// A bookmarked ?tab= can name a tab whose <v-tab> does not exist yet — the
// gating flags resolve asynchronously, and child tabs only register during
// mount. Vuetify reverts v-model to the first visible tab in both cases, so the
// goal is remembered here and re-applied once it is reachable.
const desiredTab = ref<string | null>(null);

// Permission assignments are an OpenFGA concept — show the tab whenever the
// backend is OpenFGA (per-scope visibility is handled inside the explorer).
// Cedar surfaces policies instead; allow-all has no permission management.
const showPermissionsTab = computed(() => visual.getServerInfo()['authz-backend'] === 'openfga');

// Grants are authorizer-agnostic, so this asks the server what it can grant
// rather than keying off the backend name: empty vocabularies (allow-all) and
// servers predating the grants API both resolve to false. Null while unanswered.
const showGrantsTab = useGrantsSupported();

// Policies always render — the teaser is the point, so it needs no check.
const tabAvailable = (t: string) => {
  if (t === 'permissions') return showPermissionsTab.value;
  if (t === 'grants') return showGrantsTab.value === true;
  return true;
};

const policyFeatures = [
  {
    icon: 'mdi-file-document-outline',
    title: 'Permission as Code',
    text: 'Access rules live in Git. Reviewed like any other change.',
  },
  {
    icon: 'mdi-robot-outline',
    title: 'Automate governance',
    text: 'Ship access changes through your pipeline, not by hand.',
  },
  {
    icon: 'mdi-target',
    // Grants themselves ship here, so the pitch is what a policy adds over one:
    // a rule that covers what has not been granted one by one.
    title: 'Rules, not row-by-row',
    text: 'One policy covers every table that matches it, today and tomorrow.',
  },
  {
    icon: 'mdi-flask-outline',
    // Named for the PolicyBuilder's "Evaluate" action, so the pitch matches what
    // a prospect finds in the product.
    title: 'Evaluate before you ship',
    text: 'See exactly what a policy allows before it goes live.',
  },
];

// nextTick() is essential: setting tab during setup races the child v-tab
// registration and Vuetify reverts it.
async function applyDesiredTab() {
  if (!desiredTab.value || !tabAvailable(desiredTab.value)) return;
  await nextTick();
  if (desiredTab.value && tab.value !== desiredTab.value) {
    tab.value = desiredTab.value;
  }
}

function requestTab(t: string) {
  desiredTab.value = t;
  applyDesiredTab();
}

// Re-apply once a gated tab's flag resolves.
watch([showPermissionsTab, showGrantsTab], applyDesiredTab);

onMounted(() => {
  if (route.query.tab) requestTab(route.query.tab as string);
});

watch(tab, (newTab) => {
  // Vuetify can revert the model to the first visible tab while the target is
  // still mounting. Re-assert rather than persisting the revert.
  if (desiredTab.value && newTab !== desiredTab.value && tabAvailable(desiredTab.value)) {
    applyDesiredTab();
    return;
  }
  if (newTab === desiredTab.value) desiredTab.value = null;
  router.replace({ query: { ...route.query, tab: newTab } });
});
</script>
