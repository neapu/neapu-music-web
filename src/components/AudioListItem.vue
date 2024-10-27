<script setup lang="ts">
import { AudioItem } from '../stores/player';
import { ref } from 'vue';

const props = defineProps<{
    audioList: Array<AudioItem>,
    selectedItem: String|null,
    batchOption: Boolean,
    rearranging: Boolean,
}>();

const emit = defineEmits(['itemDoubleClick', 'itemAddToPlaylist', 'itemDelete', 'itemMove']);

const hoveredItem = ref<String | null>(null);

function onItemDoubleClick(id: string) {
    emit('itemDoubleClick', id);
}

function onItemAddToPlaylistClick(id: string) {
    emit('itemAddToPlaylist', id);
}

function onItemDeleteClick(id: string) {
    emit('itemDelete', id);
}
</script>

<template>
    <div class="audio-item" v-for="audio in props.audioList" :key="audio.id"
        @mouseover="hoveredItem = audio.id" @mouseleave="hoveredItem = null" @dblclick="onItemDoubleClick(audio.id)"
        :class="{ hovered: hoveredItem === audio.id, selected: selectedItem === audio.id }">
        <div class="album-cover" v-if="audio.cover">
            <img :src="audio.cover" alt="album-cover" style="width: 50px; height: 50px;">
        </div>
        <div class="album-cover" v-else>🎵</div>
        <div class="details">
            <div class="title">{{ audio.title }}</div>
            <div class="author">{{ audio.author }}</div>
        </div>
        <div class="album">{{ audio.album }}</div>
        <div class="duration">{{ audio.duration }}</div>
        <div class="options" v-if="batchOption">
            <el-checkbox v-model="audio.selected"></el-checkbox>
        </div>
        <div class="rearrange" v-if="rearranging">
            <span class="material-icons rearrange-item" @click="emit('itemMove', audio.id, true)">arrow_drop_up</span>
            <span class="material-icons rearrange-item" @click="emit('itemMove', audio.id, false)">arrow_drop_down</span>
        </div>
        <div class="options" v-if="!batchOption && !rearranging">
            <el-dropdown trigger="click" style="cursor: pointer;">
                <span class="material-icons">more_vert</span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <!-- <el-dropdown-item @click="onItemFavoriteClick(audio.id)">收藏</el-dropdown-item> -->
                        <el-dropdown-item @click="onItemAddToPlaylistClick(audio.id)">添加到歌单</el-dropdown-item>
                        <el-dropdown-item @click="onItemDeleteClick(audio.id)">删除</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

        </div>
    </div>
</template>

<style scoped>
.audio-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border: 1px solid #ddd;
    margin-bottom: 5px;
    transition: background-color 0.3s;
}

.audio-item .album-cover {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    margin-right: 10px;
}

.audio-item .details {
    flex: 1;
}

.audio-item .title {
    font-weight: bold;
}

.audio-item .author {
    color: #666;
}

.audio-item .album,
.audio-item .duration {
    width: 100px;
    text-align: center;
}

.audio-item.hovered {
    background-color: #f9f9f9;
}

.audio-item.selected {
    background-color: #e0e0e0;
}

.options {
    width: 70px;
    text-align: center;
    font-size: 12px;
    font-weight: normal;
}

.rearrange {
    width: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.rearrange-item {
    cursor: pointer;
}
</style>