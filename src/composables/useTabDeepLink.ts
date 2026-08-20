import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Reads `?tab=` and holds the request until that tab can actually be shown.
 *
 * Several tabs only render once an async flag resolves — a permission composable
 * answering, or `useGrantsSupported()` moving off `null`. Assigning the tab model
 * before the matching `<v-tab>` exists makes Vuetify revert to the first visible
 * tab, and because every page mirrors the model back into the URL, the revert is
 * what gets persisted: the deep link silently becomes a link to the default tab.
 *
 * So the request is remembered rather than applied, and re-applied whenever a
 * gate resolves. A tab that is gated `false` (no permission) simply stays pending
 * and never applies, which is the correct outcome.
 *
 * @param tab      The page's tab model.
 * @param tabs     Every tab value the page can show. A `?tab=` outside this list
 *                 is ignored — without that check an unknown value would be
 *                 treated as available, and the watcher below would fight
 *                 Vuetify's revert forever.
 * @param gates    Per-tab availability getters, for the gated tabs only. Omitted
 *                 tabs are always available. Only `true` counts as available:
 *                 `useGrantsSupported()` reports `null` while unanswered.
 * @param syncUrl  Writes the settled tab back to the URL. Pages differ here —
 *                 some use `router.replace`, the warehouse detail pages use
 *                 `history.replaceState` to avoid running navigation guards on
 *                 every tab click — so the caller owns it.
 */
export function useTabDeepLink(options: {
  tab: { value: string };
  tabs: string[];
  gates?: Record<string, () => boolean | null | undefined>;
  syncUrl: (tab: string) => void;
}) {
  const { tab, tabs, gates = {}, syncUrl } = options;
  const route = useRoute();
  const desiredTab = ref<string | null>(null);

  const tabAvailable = (t: string) => {
    if (!tabs.includes(t)) return false;
    const gate = gates[t];
    return gate ? gate() === true : true;
  };

  // nextTick() is essential: setting the model during setup races the child
  // <v-tab> registration, and Vuetify reverts it.
  async function applyDesiredTab() {
    if (!desiredTab.value || !tabAvailable(desiredTab.value)) return;
    await nextTick();
    if (desiredTab.value && tab.value !== desiredTab.value) {
      tab.value = desiredTab.value;
    }
  }

  function requestTab(t: string) {
    if (!tabs.includes(t)) return;
    desiredTab.value = t;
    applyDesiredTab();
  }

  const gateGetters = Object.values(gates);
  if (gateGetters.length) watch(gateGetters, applyDesiredTab);

  watch(
    () => tab.value,
    (newTab) => {
      // Vuetify can revert the model to the first visible tab while the target is
      // still mounting. Re-assert rather than persisting the revert.
      if (desiredTab.value && newTab !== desiredTab.value && tabAvailable(desiredTab.value)) {
        applyDesiredTab();
        return;
      }
      if (newTab === desiredTab.value) desiredTab.value = null;
      syncUrl(newTab);
    },
  );

  onMounted(() => {
    if (route.query.tab) requestTab(route.query.tab as string);
  });

  return { requestTab };
}
