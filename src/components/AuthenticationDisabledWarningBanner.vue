<template>
  <v-banner :sticky="true" color="white" icon="mdi-alert-box" lines="one" bg-color="error">
    <template v-slot:text>
      <span class="text-h6">Warning: Authentication is OFF - Not safe for production.</span>
    </template>
  </v-banner>
</template>
