<template>
  <v-app>
    <v-main>
      <router-view />
      <snackbar-message></snackbar-message>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { enabledAuthentication } from '@/app.config';
import router from '@/router';
import { useVisualStore } from '@/stores/visual';
import { useFunctions } from '@/plugins/functions';
const functions = useFunctions();

const visual = useVisualStore();

onMounted(async () => {
  try {
    if (!enabledAuthentication) {
      const serverInfo = await functions.getServerInfo();

      if (!serverInfo.bootstrapped) router.push('/bootstrap');
      visual.showAppOrNavBar = true;
    }
  } catch (error) {
    console.error('Error during App processing:', error);
  }

  // Prevent macOS trackpad back/forward gestures
  let startX = 0;
  let startY = 0;

  document.addEventListener(
    'wheel',
    (e) => {
      const target = e.target as HTMLElement;

      // Check if the target is within a horizontally scrollable container
      let scrollableParent = target;
      while (scrollableParent && scrollableParent !== document.body) {
        const styles = window.getComputedStyle(scrollableParent);
        const hasHorizontalScroll =
          styles.overflowX === 'scroll' ||
          styles.overflowX === 'auto' ||
          scrollableParent.scrollWidth > scrollableParent.clientWidth;

        if (hasHorizontalScroll) {
          // Allow horizontal scrolling within scrollable containers
          return;
        }
        scrollableParent = scrollableParent.parentElement as HTMLElement;
      }

      // Only prevent horizontal wheel events at document level (for back/forward navigation)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    },
    { passive: false },
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;

        const target = e.target as HTMLElement;

        // Check if the target is within a horizontally scrollable container
        let scrollableParent = target;
        while (scrollableParent && scrollableParent !== document.body) {
          const styles = window.getComputedStyle(scrollableParent);
          const hasHorizontalScroll =
            styles.overflowX === 'scroll' ||
            styles.overflowX === 'auto' ||
            scrollableParent.scrollWidth > scrollableParent.clientWidth;

          if (hasHorizontalScroll) {
            // Allow horizontal touch within scrollable containers
            return;
          }
          scrollableParent = scrollableParent.parentElement as HTMLElement;
        }

        // Only prevent horizontal swipes at document level and only if they're at the edge
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          // Only prevent if starting from the edge of the screen
          if (startX < 50 || startX > window.innerWidth - 50) {
            e.preventDefault();
          }
        }
      }
    },
    { passive: false },
  );

  // Additional prevention for Safari-specific gestures
  document.addEventListener(
    'gesturestart',
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    'gesturechange',
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    'gestureend',
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );
});
</script>

<style>
/* Global styles - Prevent horizontal overscroll that triggers browser back/forward navigation */
body {
  overscroll-behavior-x: none;
  overscroll-behavior: none;
}

html {
  overscroll-behavior-x: none;
  overscroll-behavior: none;
}

* {
  overscroll-behavior-x: none;
}

/* Prevent Safari bounce effect */
body {
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

#app {
  overflow: auto;
  height: 100vh;
  width: 100vw;
}
</style>
