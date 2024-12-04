// Utilities
import { User } from "@/common/interfaces";
import { defineStore } from "pinia";

export const useUserStore = defineStore(
  "user",
  () => {
    const isAuthenticated = ref(false);

    const user: User = reactive({
      access_token: "",
      id_token: "",
      refresh_token: "",
      token_expires_at: 0,
      email: "anonymous@unknown.com",
      preferred_username: "anonymous",
      family_name: "Ymous",
      given_name: "Anon",
    });

    function setUser(newUser: User) {
      isAuthenticated.value = true;
      Object.assign(user, newUser);
    }

    function getUser(): User {
      return user;
    }

    function unsetUser() {
      isAuthenticated.value = false;
      user.access_token = "";
      user.id_token = "";
      user.refresh_token = "";
      user.token_expires_at = 0;
      user.email = "anonymous@unknown.com";
      user.preferred_username = "anonymous";
      user.family_name = "Ymous";
      user.given_name = "Anon";
    }

    function renewAT(access_token: string) {
      user.access_token = access_token;
    }

    return { isAuthenticated, user, unsetUser, setUser, getUser, renewAT };
  },
  {
    persistedState: {
      key: "user",
      persist: true,
    },
  }
);
