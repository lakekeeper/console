<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-8 text-center" elevation="5" max-width="600">
      <v-img
        :src="logo"
        alt="Lakekeeper Logo"
        class="mx-auto mb-4"
        max-width="120"
        style="opacity: 0.3" />
      <v-card-title class="text-h3 font-weight-bold mb-2">404</v-card-title>
      <v-card-subtitle class="text-h6 mb-4">
        Oops! This page went swimming in the lake...
      </v-card-subtitle>
      <v-card-text class="text-body-1 mb-4">
        <p>Even our Lakekeeper couldn't find this one.</p>
        <p class="text-medium-emphasis">
          It might have sunk to the bottom of the data lake, or maybe it never existed at all.
        </p>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn color="primary" size="large" variant="elevated" @click="goHome">
          <v-icon start>mdi-home</v-icon>
          Swim Back Home
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import logo from '@/assets/bear.png';
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>

<style scoped>
.v-card {
  border-radius: 16px !important;
}
</style>
