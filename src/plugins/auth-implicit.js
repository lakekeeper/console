import { ref, computed, inject } from 'vue';
import { UserManager, WebStorageStateStore, Log } from 'oidc-client';
import { useRouter } from 'vue-router'; // Assuming you're using Vue Router
import * as env from '../app.config'; // Ensure this path is correct

// Configure oidc-client logging (optional)
Log.logger = console;
Log.level = Log.INFO; // Adjust log level as needed

// OIDC Configuration for Implicit Grant
const oidcSettingsImplicit = {
  authority: env.idpAuthority,
  client_id: env.idpClientId,
  redirect_uri: `${window.location.origin}/ui${env.idpRedirectPath}`,
  response_type: 'id_token token', // Changed to 'id_token token' for Implicit Grant
  scope: env.idpScope,
  resource: env.idpResource !== '' ? env.idpResource : undefined,
  post_logout_redirect_uri: `${window.location.origin}/ui${env.idpLogoutRedirectPath}`,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  // silent_redirect_uri: `${window.location.origin}/silent-callback.html`, // Optional silent renew
  // automaticSilentRenew: true, // Enable automatic silent renew (requires silent_redirect_uri)
};

// Initialize UserManager for Implicit Grant
const userManagerImplicit = new UserManager(oidcSettingsImplicit);

// Reactive state for Implicit Grant
const accessTokenImplicit = ref('');
const idTokenImplicit = ref('');
const isAuthenticatedImplicit = ref(false);
const userProfileImplicit = ref(null);
const isAuthenticatingImplicit = ref(false);
const authErrorImplicit = ref(null);

// Computed properties for Implicit Grant
const isAuthenticated = computed(() => isAuthenticatedImplicit.value);
const userProfile = computed(() => userProfileImplicit.value);
const accessToken = computed(() => accessTokenImplicit.value);
const idToken = computed(() => idTokenImplicit.value);
const isAuthenticating = computed(() => isAuthenticatingImplicit.value);
const authError = computed(() => authErrorImplicit.value);

// Helper functions for Implicit Grant
const initUser = async () => {
  isAuthenticatingImplicit.value = true;
  authErrorImplicit.value = null;
  try {
    const user = await userManagerImplicit.getUser();
    if (user) {
      accessTokenImplicit.value = user.access_token;
      idTokenImplicit.value = user.id_token;
      isAuthenticatedImplicit.value = true;
      userProfileImplicit.value = user.profile;
    }
  } catch (error) {
    console.error('Failed to initialize OIDC user (Implicit)', error);
    authErrorImplicit.value = error;
  } finally {
    isAuthenticatingImplicit.value = false;
  }
};

const signIn = async () => {
  try {
    console.log('OIDC Implicit Flow enabled');

    await userManagerImplicit.signinRedirect();
  } catch (error) {
    console.error('OIDC sign-in failed (Implicit)', error);
    authErrorImplicit.value = error;
  }
};

const signOut = async () => {
  try {
    await userManagerImplicit.signoutRedirect();
    clearAuthData();
  } catch (error) {
    console.error('OIDC sign-out failed (Implicit)', error);
    authErrorImplicit.value = error;
  }
};

const processSignInCallback = async () => {
  isAuthenticatingImplicit.value = true;
  authErrorImplicit.value = null;
  try {
    const user = await userManagerImplicit.signinRedirectCallback();
    if (user) {
      accessTokenImplicit.value = user.access_token;
      idTokenImplicit.value = user.id_token;
      isAuthenticatedImplicit.value = true;
      userProfileImplicit.value = user.profile;
      const router = useRouter();
      const redirectPath = sessionStorage.getItem('authRedirectPath') || '/';
      sessionStorage.removeItem('authRedirectPath');
      router.push(redirectPath);
    } else {
      isAuthenticatedImplicit.value = false;
    }
  } catch (error) {
    console.error('OIDC sign-in callback error (Implicit)', error);
    isAuthenticatedImplicit.value = false;
    authErrorImplicit.value = error;
  } finally {
    isAuthenticatingImplicit.value = false;
  }
};

async function refreshToken() {
  try {
    const user = await userManagerImplicit.signinSilent();
    if (user) {
      accessTokenImplicit.value = user.access_token;
      idTokenImplicit.value = user.id_token;
      isAuthenticatedImplicit.value = true;
      userProfileImplicit.value = user.profile;
      return user;
    } else {
      isAuthenticatedImplicit.value = false;
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed (Implicit)', error);
    isAuthenticatedImplicit.value = false;
    authErrorImplicit.value = error;
    // Optionally redirect to sign-in if silent refresh fails
    // await signIn();
    return null;
  }
}

const checkTokenExpiry = async () => {
  if (isAuthenticatedImplicit.value) {
    try {
      const user = await userManagerImplicit.getUser();
      if (user && user.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = user.expires_at - now;
        if (timeLeft <= 60) {
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Error checking token expiry (Implicit)', error);
    }
  }
};

const clearAuthData = () => {
  accessTokenImplicit.value = '';
  idTokenImplicit.value = '';
  isAuthenticatedImplicit.value = false;
  userProfileImplicit.value = null;
};

setInterval(checkTokenExpiry, 60000);

// Vue Composition API hook for Implicit Grant
export function useAuthImplicit() {
  return {
    oidcSettings: oidcSettingsImplicit,
    userManager: userManagerImplicit,
    accessToken: accessToken,
    idToken: idToken,
    isAuthenticated: isAuthenticated,
    userProfile: userProfile,
    isAuthenticating: isAuthenticating,
    authError: authError,
    refreshToken: refreshToken,
    checkTokenExpiry: checkTokenExpiry,
    signIn: signIn,
    signOut: signOut,
    initUser: initUser,
    processSignInCallback: processSignInCallback,
    clearAuthData: clearAuthData,
  };
}

// Vue Plugin Installation Function for Implicit Grant
export default {
  install: (app) => {
    if (env.idpImplicitFlow) {
      if (env.enabledAuthentication) {
        const authImplicit = useAuthImplicit();
        app.provide('authImplicit', authImplicit);
        app.config.globalProperties.$authImplicit = authImplicit;

        authImplicit.initUser();

        const router = useRouter();
        if (router) {
          router.isReady().then(() => {
            if (window.location.pathname.startsWith(`/ui${env.idpRedirectPath}`)) {
              authImplicit.processSignInCallback();
            }
          });
        } else {
          console.warn('Vue Router not detected. Callback processing might need manual handling.');
        }
      }
    }
  },
};
