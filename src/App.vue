<script setup lang="ts">
import TitleBar from './components/TitleBar.vue'
</script>

<template>
    <TitleBar />
    <div class="content">
      <router-view></router-view>
    </div>
    
</template>

<style scoped>
.content {
    margin-top: 50px;
}
</style>
