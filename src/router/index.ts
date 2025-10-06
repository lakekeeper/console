import { createRouter, createWebHistory } from 'vue-router/auto';
import { setupLayouts } from 'virtual:generated-layouts';
import { routes } from 'vue-router/auto-routes';
import { useUserStore, useVisualStore, useFunctions } from '@lakekeeper/console-components';
import * as env from '../app.config';

import NotFound from '@/pages/notfound.vue';

const baseUrlPrefix = `${env.baseUrlPrefix}/ui/`;

const router = createRouter({
  history: createWebHistory(baseUrlPrefix),
  routes: setupLayouts([
    ...routes,
    {
      path: '/:catchAll(.*)*',
      component: NotFound,
    },
  ]),
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      localStorage.setItem('vuetify:dynamic-reload', 'true');
      location.assign(to.fullPath);
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload');
});

router.beforeEach(async (to, from, next) => {
  const userStorage = useUserStore();
  const visual = useVisualStore();
  const functions = useFunctions();

  const serverInfo = await functions.getServerInfo(); // Get from visual store directly

  console.log(
    'Navigating to:',
    to.path,
    serverInfo.bootstrapped,
    await functions.getServerInfo().bootstrapped,
    userStorage.isAuthenticated && !serverInfo.bootstrapped && to.path !== '/bootstrap',
  );

  visual.currentUrl = to.path;
  console.log(
    'Router check - to.path:',
    to.path,
    'isAuthenticated:',
    userStorage.isAuthenticated,
    'bootstrapped:',
    serverInfo.bootstrapped,
  );

  if (to.name === '/notfound') {
    return next();
  }

  if (env.enabledAuthentication) {
    // Check if the user is authenticated and project bootstrap is not done

    if (userStorage.isAuthenticated && !serverInfo.bootstrapped && to.path !== '/bootstrap') {
      console.log('Redirecting to bootstrap');
      return next('/bootstrap');
    }

    // Allow access to login and callback paths
    if (to.path === '/login' || to.path === '/callback') {
      return next();
    }

    // Redirect unauthenticated users to login
    if (!userStorage.isAuthenticated && to.path !== '/login') {
      return next('/login');
    }

    // Allow access if authenticated and not redirected
    next();
  } else {
    // For cases where enabledAuthentication is false

    if (!serverInfo.bootstrapped && to.path !== '/bootstrap') {
      return next('/bootstrap');
    }

    if (to.path === '/login' || to.path === '/callback' || to.path === '/logout') {
      return next('/');
    }

    // Allow access to other paths
    next();
  }
});

export default router;
