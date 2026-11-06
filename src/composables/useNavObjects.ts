import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFunctions, useVisualStore } from '@lakekeeper/console-components';

export type NavObjectType = 'warehouse' | 'namespace' | 'table' | 'view' | 'generic-table';

/** A catalog object the nav menus can link to, pinned or recently opened. */
export interface NavObject {
  type: NavObjectType;
  warehouseId: string;
  /** Dotted namespace path; for a namespace, its own full path. Empty for a warehouse. */
  namespaceId: string;
  /** Warehouse name, a namespace's last level, or the table/view name. */
  name: string;
  /** Pins carry the name the warehouse had when pinned; recents carry none. */
  warehouseName?: string;
}

// The pin store's identity, so a pin made here is the same pin in the trees.
export const navKey = (o: NavObject) => `${o.type}:${o.warehouseId}:${o.namespaceId}:${o.name}`;

export const NAV_ICONS: Record<NavObjectType, string> = {
  warehouse: 'mdi-database-outline',
  namespace: 'mdi-folder-outline',
  table: 'mdi-table',
  view: 'mdi-eye-outline',
  'generic-table': 'mdi-table-large',
};

// Same routes the warehouse tree navigates to; namespace levels are joined with
// the unit separator, as the namespace route expects.
export function navRoute(o: NavObject): string {
  const base = `/warehouse/${o.warehouseId}`;
  if (o.type === 'warehouse') return base;
  const ns = `${base}/namespace/${o.namespaceId.split('.').join('\x1F')}`;
  return o.type === 'namespace' ? ns : `${ns}/${o.type}/${o.name}`;
}

const RECENT_KEEP = 10;
const NAMES_TTL_MS = 60_000;
// LoQEExplorer's key for its own SQL tabs in the visual store.
const LOQE_TAB_KEY = '__loqe__';

/**
 * Pins, recently opened objects and live warehouse names for the nav menus.
 *
 * Recents are a per-browser convenience, so they live in localStorage and
 * quietly start empty wherever storage is unavailable.
 */
export function useNavObjects() {
  const visual = useVisualStore();
  const functions = useFunctions();
  const route = useRoute();
  const router = useRouter();

  const projectId = computed(() => visual.projectSelected['project-id'] || '');

  // ── The object the current page shows ───────────────────────────────
  const currentObject = computed<NavObject | null>(() => {
    const p = route.params as Record<string, string | undefined>;
    if (!route.path.startsWith('/warehouse/') || !p.id) return null;
    if (!p.nsid) return { type: 'warehouse', warehouseId: p.id, namespaceId: '', name: '' };
    const namespaceId = p.nsid.split('\x1F').join('.');
    const leaf = p.tid || p.vid;
    const type = route.path.match(/\/(table|view|generic-table)\/[^/]+$/)?.[1] as
      NavObjectType | undefined;
    if (leaf && type) return { type, warehouseId: p.id, namespaceId, name: leaf };
    return {
      type: 'namespace',
      warehouseId: p.id,
      namespaceId,
      name: namespaceId.split('.').pop() ?? '',
    };
  });

  // ── Live warehouse names ─────────────────────────────────────────────
  // One listing answers both "what is it called now" and "does it still exist".
  // Null until a listing has succeeded: without one, nothing is claimed gone.
  const warehouseNames = ref<Map<string, string> | null>(null);
  let namesLoadedAt = 0;
  let namesLoading = false;
  async function loadWarehouseNames() {
    if (!projectId.value || namesLoading || Date.now() - namesLoadedAt < NAMES_TTL_MS) return;
    namesLoading = true;
    try {
      const res = await functions.listWarehousesByProject(projectId.value);
      warehouseNames.value = new Map(
        (res.warehouses ?? []).map((w: { id: string; name: string }) => [w.id, w.name]),
      );
      namesLoadedAt = Date.now();
    } catch {
      // Refused or offline: keep the names the pins were saved with.
    } finally {
      namesLoading = false;
    }
  }

  const warehouseName = (o: NavObject) =>
    warehouseNames.value?.get(o.warehouseId) ?? o.warehouseName ?? '';
  const isGone = (o: NavObject) =>
    !!warehouseNames.value && !warehouseNames.value.has(o.warehouseId);

  // A warehouse is labelled by its live name; its stored `name` is only the
  // pin's identity and goes stale on rename.
  const titleOf = (o: NavObject) =>
    o.type === 'warehouse'
      ? warehouseName(o) || o.name || o.warehouseId
      : o.type === 'namespace'
        ? o.namespaceId
        : o.name;
  const subtitleOf = (o: NavObject) => {
    if (isGone(o)) return 'No longer available';
    if (o.type === 'warehouse') return undefined;
    const wh = warehouseName(o) || o.warehouseId;
    return o.type === 'namespace' ? wh : `${wh} · ${o.namespaceId}`;
  };

  // ── Pins ─────────────────────────────────────────────────────────────
  const pins = computed<NavObject[]>(() =>
    (visual.pinnedObjects ?? []).filter((p) => p.projectId === projectId.value),
  );
  const pinnedKeys = computed(() => new Set(pins.value.map(navKey)));

  // A warehouse pin is keyed by the warehouse's name, as the tree keys it, so
  // the current warehouse can only be matched once that name is known.
  const currentPinTarget = computed<NavObject | null>(() => {
    const o = currentObject.value;
    if (!o || o.type !== 'warehouse') return o;
    const name = warehouseNames.value?.get(o.warehouseId);
    return name ? { ...o, name } : null;
  });
  const currentPinned = computed(() =>
    currentPinTarget.value ? pinnedKeys.value.has(navKey(currentPinTarget.value)) : false,
  );

  function unpin(o: NavObject) {
    const key = navKey(o);
    visual.pinnedObjects = (visual.pinnedObjects ?? []).filter(
      (p) => !(p.projectId === projectId.value && navKey(p) === key),
    );
  }

  function toggleCurrentPin() {
    const o = currentPinTarget.value;
    if (!o) return;
    if (currentPinned.value) return unpin(o);
    visual.pinnedObjects = [
      ...(visual.pinnedObjects ?? []),
      { ...o, projectId: projectId.value, warehouseName: warehouseName(o) },
    ];
  }

  // ── Recently opened ──────────────────────────────────────────────────
  const storageKey = computed(() => `lakekeeper.nav.recent.${projectId.value}`);
  const recentAll = ref<NavObject[]>([]);

  function readRecent() {
    try {
      const raw = localStorage.getItem(storageKey.value);
      recentAll.value = raw ? JSON.parse(raw) : [];
    } catch {
      recentAll.value = [];
    }
  }
  function writeRecent() {
    try {
      localStorage.setItem(storageKey.value, JSON.stringify(recentAll.value));
    } catch {
      // Storage full or blocked: recents just won't outlive this page.
    }
  }

  watch(storageKey, readRecent, { immediate: true });
  watch(
    currentObject,
    (o) => {
      if (!o || !projectId.value) return;
      const key = navKey(o);
      recentAll.value = [o, ...recentAll.value.filter((r) => navKey(r) !== key)].slice(
        0,
        RECENT_KEEP,
      );
      writeRecent();
    },
    { immediate: true },
  );

  // A warehouse's recent entry has no name of its own, so it is matched to a
  // pin by id. The page you are on is not a shortcut to anywhere.
  const recent = computed(() => {
    const here = currentObject.value && navKey(currentObject.value);
    const pinnedWarehouses = new Set(
      pins.value.filter((p) => p.type === 'warehouse').map((p) => p.warehouseId),
    );
    return recentAll.value.filter((r) => {
      if (navKey(r) === here) return false;
      if (r.type === 'warehouse') return !pinnedWarehouses.has(r.warehouseId);
      return !pinnedKeys.value.has(navKey(r));
    });
  });

  // ── LoQE ─────────────────────────────────────────────────────────────
  // LoQE has no generic tables.
  const queryablePins = computed(() =>
    pins.value.filter((p) => p.type === 'table' || p.type === 'view'),
  );

  /** Open LoQE on a new tab holding a SELECT over the object. Not run: the user does that. */
  function queryInLoqe(o: NavObject) {
    const sql = `SELECT * FROM "${warehouseName(o)}"."${o.namespaceId}"."${o.name}" LIMIT 100;`;
    const tab = visual.addSqlTab(LOQE_TAB_KEY);
    visual.updateSqlTabContent(LOQE_TAB_KEY, tab.id, sql);
    router.push('/loqe');
  }

  watch(projectId, () => {
    warehouseNames.value = null;
    namesLoadedAt = 0;
  });

  return {
    currentObject,
    currentPinTarget,
    currentPinned,
    toggleCurrentPin,
    pins,
    recent,
    unpin,
    isGone,
    titleOf,
    subtitleOf,
    loadWarehouseNames,
    queryablePins,
    queryInLoqe,
  };
}
