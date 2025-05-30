import { App, ref } from 'vue';
import { UserManager, UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';
import { useUserStore } from '@/stores/user';
import { User } from '@/common/interfaces';
import * as env from '../app.config';

// OIDC Configuration

const oidcSettings: UserManagerSettings = {
  authority: env.idpAuthority,
  client_id: env.idpClientId,
  redirect_uri: `${window.location.origin}${env.baseUrlPrefix}/ui${env.idpRedirectPath}`,
  response_type: 'code',
  scope: env.idpScope,
  resource: env.idpResource !== '' ? env.idpResource : undefined,
  post_logout_redirect_uri: `${window.location.origin}${env.baseUrlPrefix}/ui${env.idpLogoutRedirectPath}`,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};
// silent_redirect_uri: `${window.location.origin}/silent-callback`,

// Initialize UserManager
const userManager = new UserManager(oidcSettings);

// Define reactive state
const accessToken = ref('');
const isAuthenticated = ref(false);

// Helper functions
const initUser = async () => {
  try {
    await signIn(); // Ensure signIn is called as part of initialization
    const user = await userManager.getUser();
    if (user) {
      accessToken.value = env.idpTokenType == 'id_token' ? user.id_token || '' : user.access_token;
      isAuthenticated.value = true;
    }
  } catch (error) {
    console.error('Failed to initialize OIDC user', error);
  }
};

const signIn = async () => {
  try {
    await userManager.signinRedirect();
  } catch (error) {
    console.error('OIDC sign-in failed', error);
  }
};

const signOut = async () => {
  try {
    await userManager.signoutRedirect();

    accessToken.value = '';
    isAuthenticated.value = false;
  } catch (error) {
    console.error('OIDC sign-out failed', error);
  }
};

async function refreshToken(): Promise<User | undefined> {
  try {
    const user = await userManager.signinSilent();

    const newUser: User = {
      access_token:
        env.idpTokenType == 'id_token' ? user?.id_token || '' : user?.access_token || '',
      id_token: user?.id_token || '',
      refresh_token: user?.refresh_token || '',
      token_expires_at: user?.profile.exp || 0,
      email: user?.profile.email || '',
      preferred_username: user?.profile.preferred_username || '',
      family_name: user?.profile.family_name || '',
      given_name: user?.profile.given_name || '',
    };
    useUserStore().setUser(newUser);
    return newUser;
  } catch (error: any) {
    console.error('Token refresh failed', error);
    await userManager.signinRedirect(); // Redirect on true failure
  }
}

// let tokenCheckInterval: number | undefined;

const checkTokenExpiry = async () => {
  try {
    if (useUserStore().isAuthenticated && env.enabledAuthentication) {
      const user = useUserStore().getUser();
      const now = Math.floor(Date.now() / 1000); // Convert to seconds
      const timeLeft = user.token_expires_at - now;

      if (timeLeft <= 60) {
        await refreshToken();
      }
    }
  } catch (error) {
    console.error(error);
  }
};
// const startTokenExpiryCheck = () => {
//   if (tokenCheckInterval) {
//     clearInterval(tokenCheckInterval);
//   }
//   tokenCheckInterval = setInterval(checkTokenExpiry, 10000);
// };

// // In a component setup or init function:
// startTokenExpiryCheck();

setInterval(checkTokenExpiry, 60000);

// Vue Composition API hook to use authentication state and functions
export function useAuth() {
  return {
    oidcSettings,
    userManager,
    access_token: accessToken,
    isAuthenticated,
    refreshToken,
    checkTokenExpiry,
    signIn,
    signOut,
    initUser, // Expose initUser for calling in components
  };
}

// Vue Plugin Installation Function
export default {
  install: (app: App) => {
    if (env.enabledAuthentication) {
      const auth = useAuth();
      app.provide('auth', auth);
      app.config.globalProperties.$auth = auth;
    }
  },
};
