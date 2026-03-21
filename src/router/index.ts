// @ts-expect-error - vue-router/auto is provided by unplugin-vue-router
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router/auto';
import { routes } from 'vue-router/auto-routes';
import DefaultLayout from '@/layouts/default.vue';
import { useUserStore, useFunctions, useNavigationStore } from '@lakekeeper/console-components';
import * as env from '../app.config';

import NotFound from '@/pages/notfound.vue';

const baseUrlPrefix = `${env.baseUrlPrefix}/ui/`;

const router = createRouter({
  history: createWebHistory(baseUrlPrefix),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        ...routes,
        {
          path: '/:catchAll(.*)*',
          component: NotFound,
        },
      ],
    },
  ],
});

router.afterEach((to: RouteLocationNormalized) => {
  // Don't store these paths as the last visited location to prevent unwanted restoration after login
  const excludedPaths = ['/server-offline', '/login', '/callback', '/logout'];
  if (excludedPaths.includes(to.path)) {
    return;
  }

  const navigationStore = useNavigationStore();
  navigationStore.updateCurrentLocation({
    path: to.fullPath,
    params: to.params,
    query: to.query,
  });
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err: any, to: any) => {
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

router.beforeEach(async (to: any, from: any, next: any) => {
  const userStorage = useUserStore();
  const functions = useFunctions({
    icebergCatalogUrl: env.icebergCatalogUrl,
    idpAuthority: env.idpAuthority,
    idpClientId: env.idpClientId,
    idpRedirectPath: env.idpRedirectPath,
    idpScope: env.idpScope,
    idpResource: env.idpResource,
    idpTokenType: env.idpTokenType,
    idpLogoutRedirectPath: env.idpLogoutRedirectPath,
    enabledAuthentication: env.enabledAuthentication,
    enabledPermissions: env.enabledPermissions,
    baseUrlPrefix: env.baseUrlPrefix,
  });

  // If authentication is disabled, redirect auth-related paths to home
  if (!env.enabledAuthentication) {
    if (to.path === '/login' || to.path === '/callback' || to.path === '/logout') {
      return next('/');
    }
  }

  // Allow these paths without any server checks (only when auth is enabled)
  if (
    to.path === '/server-offline' ||
    (env.enabledAuthentication &&
      (to.path === '/logout' || to.path === '/login' || to.path === '/callback'))
  ) {
    // Special case: if navigating TO /server-offline FROM /callback, this might be
    // console-components restoring a previous location during the auth race condition
    // Run server check with retries instead of allowing it through
    if (to.path === '/server-offline' && from.path === '/callback' && env.enabledAuthentication) {
      // Fall through to server check below
    } else {
      return next();
    }
  }

  let serverInfo;
  try {
    serverInfo = await functions.getServerInfo();

    // Check if serverInfo is empty or null (server offline)
    // If coming from /callback, retry before giving up (race condition with auth token setup)
    if (!serverInfo && from.path === '/callback' && env.enabledAuthentication) {
      const delays = [100, 300, 500]; // Progressive delays in ms

      for (const delay of delays) {
        try {
          await new Promise((resolve) => setTimeout(resolve, delay));
          serverInfo = await functions.getServerInfo();
          if (serverInfo) {
            break; // Success, exit retry loop
          }
        } catch (retryError: any) {
          // If it's a 401, no point in retrying
          const retryCode =
            retryError?.error?.code ||
            retryError?.status ||
            retryError?.response?.status ||
            retryError?.code ||
            0;
          if (
            retryCode === 401 ||
            retryError?.statusCode === 401 ||
            retryError?.message?.includes('401') ||
            retryError?.message?.includes('Unauthorized')
          ) {
            userStorage.unsetUser();
            return next('/login');
          }
          // For other errors, continue to next retry
        }
      }
    }

    // After retries (if any), check if serverInfo is still not available
    if (!serverInfo) {
      return next('/server-offline');
    }

    // If we were heading to /server-offline but server is actually online, redirect to home
    if (to.path === '/server-offline' && from.path === '/callback') {
      return next('/');
    }
  } catch (error: any) {
    // Check if it's a 401 Unauthorized error
    const errorCode =
      error?.error?.code || error?.status || error?.response?.status || error?.code || 0;
    if (
      errorCode === 401 ||
      error?.statusCode === 401 ||
      error?.message?.includes('401') ||
      error?.message?.includes('Unauthorized')
    ) {
      userStorage.unsetUser();
      return next('/login');
    }

    // If the server responded with a 4xx (e.g. 403 from Cedar policy), it IS online.
    // Proceed with navigation — individual pages will handle permission errors.
    if (errorCode >= 400 && errorCode < 500) {
      return next();
    }

    // If navigating from /callback and getServerInfo fails, retry with backoff
    // This handles race condition where auth token isn't fully configured yet
    if (from.path === '/callback' && env.enabledAuthentication) {
      const delays = [100, 300, 500]; // Progressive delays in ms

      for (const delay of delays) {
        try {
          await new Promise((resolve) => setTimeout(resolve, delay));
          serverInfo = await functions.getServerInfo();
          if (serverInfo) {
            break; // Success, exit retry loop
          }
        } catch (retryError: any) {
          // If it's a 401, no point in retrying
          const retryCode =
            retryError?.error?.code ||
            retryError?.status ||
            retryError?.response?.status ||
            retryError?.code ||
            0;
          if (
            retryCode === 401 ||
            retryError?.statusCode === 401 ||
            retryError?.message?.includes('401') ||
            retryError?.message?.includes('Unauthorized')
          ) {
            userStorage.unsetUser();
            return next('/login');
          }
          // For other errors, continue to next retry or fall through
        }
      }

      // If all retries failed and serverInfo is still not set
      if (!serverInfo) {
        return next('/server-offline');
      }

      // If we were heading to /server-offline but server is actually online, redirect to home
      if (to.path === '/server-offline') {
        return next('/');
      }
    } else {
      // For other errors (network, timeout, etc), redirect to server-offline
      return next('/server-offline');
    }
  }

  if (to.name === '/notfound') {
    return next();
  }

  if (env.enabledAuthentication) {
    // Check if the user is authenticated and project bootstrap is not done
    if (userStorage.isAuthenticated && !serverInfo.bootstrapped && to.path !== '/bootstrap') {
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
