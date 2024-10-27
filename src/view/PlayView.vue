<script setup lang="ts">
import SideBar from '../components/SideBar.vue'
import PlayBar from '../components/PlayBar.vue';
import AudioList from '../components/AudioList.vue';
</script>

<template>
    <div class="playview">
        <SideBar />
        <AudioList />
        <PlayBar />
    </div>
</template>

<style scoped>
.playview {
    display: flex;
    height: 100%;
}

</style>