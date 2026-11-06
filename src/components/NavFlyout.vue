<template>
  <!-- A nav item that opens a menu beside the drawer: the page's tabs, or
       shortcuts for pages without any. It stands in for the rail tooltip, as the
       menu header already names the page. Attributes (to, active, @click…) go to
       the nav item itself.

       Delays: a pointer travelling diagonally from an item into its open menu
       crosses the items below. The open delay is longer than that crossing, so
       they never open, and the close delay is longer still, so the menu it is
       heading for is still there when it arrives. -->
  <v-menu
    location="end"
    :open-on-hover="canHover"
    :open-on-click="!canHover"
    open-on-focus
    :open-delay="200"
    :close-delay="250"
    offset="12"
    @update:model-value="(open: boolean) => open && emit('open')">
    <template #activator="{ props: menuProps }">
      <v-list-item v-bind="{ ...itemAttrs, ...menuProps }" link :title="title" rounded="lg">
        <template #prepend>
          <v-icon :size="iconSize" :icon="icon"></v-icon>
        </template>
        <template v-if="$slots.append" #append>
          <slot name="append"></slot>
        </template>
      </v-list-item>
    </template>
    <v-list nav density="compact" color="primary" class="pa-2" min-width="240">
      <v-list-subheader class="text-uppercase font-weight-bold">{{ title }}</v-list-subheader>
      <!-- Without hover the first tap opens this menu instead of navigating, so
           the page itself has to be reachable from inside it. -->
      <v-list-item
        v-if="!canHover"
        v-bind="$attrs"
        :title="`Open ${title}`"
        :prepend-icon="icon"
        rounded="lg"></v-list-item>
      <slot></slot>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

defineProps<{
  title: string;
  icon: string;
  iconSize: string;
}>();

// Lets a menu that lists live data fetch it when shown rather than on mount.
const emit = defineEmits<{ open: [] }>();

const attrs = useAttrs();

// Touch screens report no hover. There, the item opens the menu and the page
// link moves inside it; elsewhere the item navigates as any nav link does.
const canHover = (() => {
  try {
    return window.matchMedia('(hover: hover)').matches;
  } catch {
    return true;
  }
})();

const itemAttrs = computed(() => {
  if (canHover) return attrs;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { to, onClick, ...rest } = attrs;
  return rest;
});
</script>
