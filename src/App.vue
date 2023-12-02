<template>
  <v-app>
    <search-chat />
  </v-app>
</template>

<script setup lang="ts">
import SearchChat from "@/components/SearchChat.vue";
</script>

<style>
body, select {
  font-family: "JetBrains Mono", 'monospace';
}

.v-main {
  display: flex;
}
</style>
