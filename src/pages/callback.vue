<template><div /></template>

<script lang="ts" setup>
import { UserManager } from 'oidc-client-ts';
import { UserManager as UserManagerImplicitFlow } from 'oidc-client';

import { useUserStore } from '../stores/user';
import { User } from '@/common/interfaces';
import router from '@/router';
import { useAuth } from '../plugins/auth';
import { useFunctions } from '../plugins/functions';
import { onMounted, onUnmounted } from 'vue';
import { useVisualStore } from '../stores/visual';
import * as env from '../app.config';

const visual = useVisualStore();
const functions = useFunctions();
const settings = useAuth().oidcSettings;
const oidcSettingsImplicit = useAuth().oidcSettingsImplicit;
const userStorage = useUserStore();
const userManager = new UserManager(settings);
const userManagerImplicit = new UserManagerImplicitFlow(oidcSettingsImplicit);

async function init() {
  try {
    const user = env.idpImplicitFlow
      ? await userManagerImplicit.signinRedirectCallback()
      : await userManager.signinRedirectCallback();
    console.log('User:', JSON.stringify(user));
    const firsName =
      user.profile.family_name || user.profile.name?.split(' ').splice(1).join(' ') || '';
    const givenName = user.profile.given_name || user.profile.name?.split(' ')[0] || '';

    const newUser: User = {
      access_token: user.access_token,
      id_token: user.id_token || '',
      refresh_token: user.refresh_token || '',
      token_expires_at: user.profile.exp,
      email: user.profile.email || '',
      preferred_username: user.profile.preferred_username || '',
      family_name: firsName,
      given_name: givenName,
    };

    userStorage.setUser(newUser);
    await functions.createUser();

    const data = await functions.getServerInfo();

    if (!data.bootstrapped) {
      router.push('/bootstrap');
    }

    visual.showAppOrNavBar = true;
  } catch (error) {
    console.error('Error during callback processing:', error);
  } finally {
    router.push('/');
  }
}

onMounted(async () => {
  try {
    await init();
    const data = await functions.getServerInfo();

    if (!data.bootstrapped) {
      router.push('/bootstrap');
    } else {
      // router.push("/");
    }
    visual.showAppOrNavBar = true;
  } catch (error) {
    console.error('Error during callback processing:', error);
  }
});

onUnmounted(() => {
  visual.showAppOrNavBar = true;
});
</script>
