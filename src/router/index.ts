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

  // Allow these paths without any server checks
  if (
    to.path === '/server-offline' ||
    to.path === '/logout' ||
    to.path === '/login' ||
    to.path === '/callback'
  ) {
    return next();
  }

  let serverInfo;
  try {
    serverInfo = await functions.getServerInfo();
    console.log('Server info received:', JSON.stringify(serverInfo, null, 2));

    // Check if server returned "Failed to authenticate" (401 error)
    if (serverInfo === 'Failed to authenticate' || typeof serverInfo === 'string') {
      console.log('Authentication failed, logging out user');
      userStorage.unsetUser();
      return next('/login');
    }

    // Check if server returned an error status (401 Unauthorized)
    if (serverInfo?.status === 401 || serverInfo?.statusCode === 401) {
      console.log('Unauthorized (401) in response, logging out user');
      userStorage.unsetUser();
      return next('/login');
    }

    // Check if server is actually offline (getServerInfo might return a flag)
    if (serverInfo?.offline || serverInfo?.error) {
      console.log('Server is offline, redirecting to /server-offline');
      return next('/server-offline');
    }
  } catch (error: any) {
    console.error(
      'Failed to get server info - Full error object:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    );
    console.error('Error details:', {
      status: error?.status,
      statusCode: error?.statusCode,
      response: error?.response,
      message: error?.message,
    });

    // Check if it's a 401 Unauthorized error in various formats
    if (
      error?.status === 401 ||
      error?.statusCode === 401 ||
      error?.response?.status === 401 ||
      error?.message?.includes('401') ||
      error?.message?.includes('Unauthorized')
    ) {
      console.log('Unauthorized (401) detected, logging out user');
      // Clear user session and redirect to logout
      userStorage.unsetUser();
      return next('/login');
    }

    // For other errors (network, timeout, etc), redirect to server-offline
    console.log('Non-401 error, redirecting to server-offline');
    return next('/server-offline');
  }

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
