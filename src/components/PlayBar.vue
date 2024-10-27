<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { PlayerState, PlayMode, usePlayerStore } from '../stores/player';

const audioRef = ref<HTMLAudioElement | null>(null);
const position = ref(0);
const positionText = ref('0:00');
const duration = ref(0);
const durationText = ref('0:00');
const volume = ref(100);
const modeText = ref('顺序播放');

const playerStore = usePlayerStore();

const playingAudioUrl = computed(() => playerStore.playingAudio?.url);
const playingAudioTitle = computed(() => {
    if (playerStore.playingAudio?.title) {
        return playerStore.playingAudio?.title;
    } else {
        return '未播放';
    }
});
const playingAudioAuthor = computed(() => {
    if (playerStore.playingAudio?.author) {
        return playerStore.playingAudio?.author;
    } else {
        return '未播放';
    }
});
const playingAudioCover = computed(() => playerStore.playingAudio?.cover);

watch(() => playerStore.playingAudioReset, (newValue, _oldValue) => {
    if (newValue) {
        console.log('Resetting audio player...');
        playerStore.playingAudioReset = false;
        console.log(playingAudioUrl.value);
        
        if (audioRef.value && playingAudioUrl.value) {
            audioRef.value.src = playingAudioUrl.value!;
            audioRef.value.play();
        }
    }
});

watch(() => playerStore.playMode, () => {
    setModeText();
});

onMounted(() => {
    if (audioRef.value) {
        // 监听播放结束
        audioRef.value.addEventListener('ended', () => {
            if (playerStore.playMode == PlayMode.Single) {
                audioRef.value?.play();
            } else if (playerStore.playMode == PlayMode.Sequence) {
                if (!playerStore.listEnd) {
                    playerStore.playNext(false);
                }
            } else if (playerStore.playMode == PlayMode.Shuffle) {
                playerStore.playNext(true);
            } else {
                playerStore.playNext(false);
            }
        });
        // 监听播放进度
        audioRef.value.addEventListener('timeupdate', () => {
            position.value = audioRef.value?.currentTime || 0;
            positionText.value = formatTime(position.value);
        });
        // 监听音频时长
        audioRef.value.addEventListener('loadedmetadata', () => {
            duration.value = audioRef.value?.duration || 0;
            durationText.value = formatTime(duration.value);
        });
    }
    setModeText();
});

function formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setModeText() {
    switch (playerStore.playMode) {
        case PlayMode.Single:
            modeText.value = '单曲循环';
            break;
        case PlayMode.Sequence:
            modeText.value = '顺序播放';
            break;
        case PlayMode.Shuffle:
            modeText.value = '随机播放';
            break;
        default:
            modeText.value = '列表循环';
            break;
    }
}

function onPlayButtonClick() {
    if (audioRef.value) {
        audioRef.value.play();
    }
    playerStore.resume();
}

function onPauseButtonClick() {
    if (audioRef.value) {
        audioRef.value.pause();
    }
    playerStore.pause();
}

function onProgressBarChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (audioRef.value) {
        audioRef.value.currentTime = parseFloat(target.value);
    }
}

function onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (audioRef.value) {
        audioRef.value.volume = parseFloat(target.value) / 100;
    }
}

function onModeChangeClick() {
    playerStore.changePlayMode();
}
</script>

<template>
    <div class="play-bar">
        <div class="left-section">
            <div class="album-cover" v-if="playingAudioCover">
                <img :src="playingAudioCover" alt="album-cover" style="width: 40px; height: 40px;">
            </div>
            <div class="album-cover" v-else>🎵</div>
            
            <div class="music-info">
                <span class="title">{{ playingAudioTitle }}</span>
                <span class="author">{{ playingAudioAuthor }}</span>
            </div>
        </div>
        <div class="center-section">
            <button class="material-icons">skip_previous</button>
            <button class="material-icons" v-if="playerStore.playerState !== PlayerState.Playing"
                @click="onPlayButtonClick">play_arrow</button>
            <button class="material-icons" v-else @click="onPauseButtonClick">pause</button>
            <button class="material-icons">skip_next</button>
        </div>
        <div class="right-section">
            <button class="mode-btn" @click="onModeChangeClick">{{ modeText }}</button>
            <i class="material-icons">volume_up</i>
            <input type="range" min="0" max="100" :value="volume" class="volume-control" @input="onVolumeChange" />
            <span class="volume-percentage">50%</span>
            <span>{{ positionText }}</span>
            <input type="range" min="0" :max="duration" :value="position" class="progress-bar"
                @input="onProgressBarChange" />
            <span>{{ durationText }}</span>
        </div>
    </div>
    <audio ref="audioRef"></audio>
</template>

<style scoped>
.play-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--playbar-bg);
    color: var(--playbar-text-color);
    padding: 0 10px;
    position: fixed;
    bottom: 0;
    left: var(--sidebar-width);
    right: 0;
    height: var(--playbar-height);
}

.left-section {
    display: flex;
    align-items: center;
}

.left-section .material-icons {
    font-size: 36px;
    margin-right: 10px;
}

.music-info {
    display: flex;
    flex-direction: column;
}

.music-info .title {
    font-weight: bold;
}

.music-info .author {
    font-size: 0.9em;
    color: var(--playbar-text-secondary-color);
}

.center-section {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
}

.center-section .material-icons {
    font-size: 36px;
    margin: 0 10px;
}

.right-section {
    display: flex;
    align-items: center;
}

.right-section .material-icons {
    font-size: 24px;
    margin-right: 5px;
}

.right-section span {
    margin: 0 5px;
}

.volume-control {
    width: 80px;
    margin-right: 5px;
}

.volume-percentage {
    padding-right: 20px;
}

.progress-bar {
    margin-left: 1px;
}

.mode-btn {
    background-color: var(--playbar-bg);
    color: var(--playbar-text-color);
    border: 1px solid var(--playbar-text-color);
    border-radius: 5px;
    padding: 5px 10px;
    margin-right: 10px;
}

.mode-btn:hover {
    cursor: pointer;
}

.mode-btn:active {
    background-color: var(--playbar-text-color);
    color: var(--playbar-bg);
}

.album-cover {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    margin-right: 10px;
}
</style>