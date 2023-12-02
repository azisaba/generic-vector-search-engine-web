<template>
  <div class="chevron-pair">
    <v-btn
      icon
      :disabled="leftDisabled"
      @click="$emit('left')"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-btn
      icon
      :disabled="rightDisabled"
      @click="$emit('right')"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  leftDisabled: boolean
  rightDisabled: boolean
}>()

defineEmits<{
  (event: 'left'): void
  (event: 'right'): void
}>()
</script>

<style scoped>
.chevron-pair {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
