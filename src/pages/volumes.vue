<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card class="text-center pa-6" variant="flat">
          <div class="mb-4">
            <v-icon size="80" color="primary" class="opacity-80">mdi-bucket-outline</v-icon>
          </div>

          <v-card-title class="text-h5 font-weight-bold mb-2">Volumes</v-card-title>

          <v-chip color="warning" variant="tonal" size="small" class="mb-4">On the Roadmap</v-chip>

          <v-card-text class="text-body-1 text-medium-emphasis">
            <p class="mb-4">
              Volumes support is coming to Lakekeeper. We're actively planning this feature and
              would love your input!
            </p>
            <p>Join the conversation and help shape the direction of Volumes in Lakekeeper.</p>
          </v-card-text>

          <v-card-actions class="justify-center pt-4">
            <v-btn
              color="primary"
              href="https://github.com/lakekeeper/lakekeeper/discussions/409"
              prepend-icon="mdi-github"
              target="_blank"
              variant="elevated">
              Join the Discussion
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
