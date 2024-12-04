<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <v-btn color="primary" @click="$router.push('/')">Go to Home</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "NotFound",
};
</script>

<style scoped>
h1 {
  margin-top: 20px;
}
</style>
