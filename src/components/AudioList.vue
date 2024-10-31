<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePlayerStore, PlayListsType, AudioItem } from '../stores/player';
import { ElNotification, ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import AudioListItem from './AudioListItem.vue';

const playerStore = usePlayerStore();
const batchOption = ref(false);

const selectedItem = computed(() => {
    if (playerStore.selectedAudioList.length === 0 || playerStore.playingAudioIndex < 0 || playerStore.playingAudioIndex >= playerStore.selectedAudioList.length) {
        return null;
    }
    if (playerStore.playingPlaylist.type != playerStore.selectedPlaylist.type || playerStore.playingPlaylist.id != playerStore.selectedPlaylist.id) {
        return null;
    }
    return playerStore.selectedAudioList[playerStore.playingAudioIndex].id;
});
const showDeleteDialog = ref(false);
const isUserList = computed(() => playerStore.selectedPlaylist.type == PlayListsType.User);
const deleteFromAll = ref(false);
const selectedIdList: string[] = [];

const showAddToPlaylistDialog = ref(false);
const addToPlaylistIds = ref<string[]>([]);

function onItemDoubleClick(id: string) {
    playerStore.playAudio(id);
}

// function onItemFavoriteClick(id: string) {
//     console.log('Favorite clicked:', id);
// }

function onItemAddToPlaylistClick(id: string) {
    console.log('Add to playlist clicked:', id);
    addToPlaylistIds.value = [];
    selectedIdList.length = 0;
    selectedIdList.push(id);
    showAddToPlaylistDialog.value = true;
}

async function onAddToPlaylistDialogConfirm() {
    console.log('Add to playlist confirm:', addToPlaylistIds);
    let ret: any;
    let hasError = false;
    for (const playlist of addToPlaylistIds.value) {
        ret = await playerStore.addAudiosToPlaylist(selectedIdList, playlist);
        if (ret != null) {
            console.error('Failed to add audio to playlist:', ret);
            ElNotification({
                title: '添加音乐到歌单失败',
                message: ret,
                type: 'error',
            });
            hasError = true;
        }
    }
    if (!hasError) {
        ElMessage({
            message: '添加音乐到歌单成功',
            type: 'success',
        });
    }
    showAddToPlaylistDialog.value = false;
    batchOption.value = false;
}

function onItemDeleteClick(id: string) {
    console.log('Delete clicked:', id);
    deleteFromAll.value = false;
    showDeleteDialog.value = true;
    selectedIdList.length = 0;
    selectedIdList.push(id);
}

async function onDeleteDialogConfirm() {
    let ret: any;
    if (deleteFromAll.value || playerStore.selectedPlaylist.type != PlayListsType.User) {
        ret = await playerStore.deleteAudios(selectedIdList);
    } else {
        ret = await playerStore.deleteAudios(selectedIdList, playerStore.selectedPlaylist.id);
    }
    if (ret != null) {
        console.error('Failed to delete audio:', ret);
        ElNotification({
            title: '删除音乐失败',
            message: ret,
            type: 'error',
        });
    } else {
        ElMessage({
            message: '删除音乐成功',
            type: 'success',
        });
    }
    showDeleteDialog.value = false;
    batchOption.value = false;
}

function startBatchOption() {
    batchOption.value = true;
    for (const audio of playerStore.selectedAudioList) {
        audio.selected = false;
    }
}

function selectAll() {
    for (const audio of playerStore.selectedAudioList) {
        audio.selected = true;
    }
}

function batchDelete() {
    selectedIdList.length = 0;
    for (const audio of playerStore.selectedAudioList) {
        if (audio.selected) {
            selectedIdList.push(audio.id);
        }
    }
    if (selectedIdList.length > 0) {
        showDeleteDialog.value = true;
    }
}

function batchAddToPlaylist() {
    selectedIdList.length = 0;
    for (const audio of playerStore.selectedAudioList) {
        if (audio.selected) {
            selectedIdList.push(audio.id);
        }
    }
    if (selectedIdList.length > 0) {
        showAddToPlaylistDialog.value = true;
    }
}

async function deletePlaylist() {
    console.log('Delete playlist clicked');
    try {
        await ElMessageBox.confirm('确定要删除歌单吗？', '删除歌单', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        })
        const loading = ElLoading.service({
            lock: true,
            text: '正在删除歌单...',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)',
        });
        const ret = await playerStore.deletePlaylist(playerStore.selectedPlaylist.id as string);
        if (ret != null) {
            console.error('Failed to delete playlist:', ret);
            ElNotification({
                title: '删除歌单失败',
                message: ret,
                type: 'error',
            });
        }
        loading.close();
    } catch (error) {
        return;
    }

}

const rearranging = ref(false);
const tempAudioList = ref<AudioItem[]>([]);
function startRearrange() {
    console.log('Start rearrange');
    rearranging.value = true;
    tempAudioList.value = playerStore.selectedAudioList.slice();
}

async function completeRearrange() {
    console.log('Complete rearrange');
    const loading = ElLoading.service({
        lock: true,
        text: '正在调整歌单顺序...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)',
    });
    const ret = await playerStore.rearrangeSelectedPlaylist(tempAudioList.value);
    if (ret != null) {
        console.error('Failed to rearrange playlist:', ret);
        ElNotification({
            title: '调整歌单顺序失败',
            message: ret,
            type: 'error',
        });
    }
    rearranging.value = false;
    loading.close();
}

function cancelRearrange() {
    console.log('Cancel rearrange');
    rearranging.value = false;
}

function onItemMove(id: string, up: boolean) {
    const index = tempAudioList.value.findIndex(audio => audio.id === id);
    if (index < 0) {
        return;
    }
    if (up && index > 0) {
        const temp = tempAudioList.value[index];
        tempAudioList.value[index] = tempAudioList.value[index - 1];
        tempAudioList.value[index - 1] = temp;
    } else if (!up && index < tempAudioList.value.length - 1) {
        const temp = tempAudioList.value[index];
        tempAudioList.value[index] = tempAudioList.value[index + 1];
        tempAudioList.value[index + 1] = temp;
    }
}
</script>

<template>
    <div class="audio-list">
        <div class="audio-header">
            <!-- <div class="details">
                <div class="title">标题/作者</div>
            </div>
            <div class="album">专辑</div>
            <div class="duration">时长</div> -->
            <div class="playlist-title">
                {{ playerStore.selectedPlaylist.title }}
            </div>
            <div class="header-options" v-if="!batchOption && !rearranging">
                <el-button size="small" @click="startRearrange"
                    v-if="playerStore.selectedPlaylist.type == PlayListsType.User">调整顺序</el-button>
                <el-button size="small" @click="deletePlaylist"
                    v-if="playerStore.selectedPlaylist.type == PlayListsType.User">删除歌单</el-button>
                <el-button size="small" @click="startBatchOption">批量操作</el-button>
            </div>
            <div class="header-options" v-if="rearranging">
                <el-button size="small" @click="cancelRearrange">取消</el-button>
                <el-button size="small" @click="completeRearrange">完成</el-button>
            </div>
            <div class="options" v-if="batchOption">
                <el-dropdown trigger="click" style="cursor: pointer;">
                    <span class="material-icons">more_vert</span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <!-- <el-dropdown-item>收藏</el-dropdown-item> -->
                            <el-dropdown-item @click="batchAddToPlaylist">添加到歌单</el-dropdown-item>
                            <el-dropdown-item @click="batchDelete">删除</el-dropdown-item>
                            <el-dropdown-item @click="selectAll">全选</el-dropdown-item>
                            <el-dropdown-item @click="batchOption = false">退出批量操作</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>

        </div>
        <div class="normal-list" v-if="!rearranging">
            <AudioListItem :audioList="playerStore.selectedAudioList" :selectedItem="selectedItem"
                :batchOption="batchOption" :rearranging="false" @itemDoubleClick="onItemDoubleClick"
                @itemAddToPlaylist="onItemAddToPlaylistClick" @itemDelete="onItemDeleteClick" />
        </div>
        <div class="rearrang-list" v-if="rearranging">
            <AudioListItem :audioList="tempAudioList" :selectedItem="selectedItem" :batchOption="false"
                :rearranging="rearranging" @itemMove="onItemMove" />
        </div>

        <el-dialog v-model="showDeleteDialog" style="width: 400px;">
            <template #header>
                <span>删除歌曲</span>
            </template>
            <template #default>
                <p>确定要删除所选歌曲吗？</p>
                <el-checkbox v-if="isUserList" v-model="deleteFromAll">从所有音乐中删除</el-checkbox>
            </template>
            <template #footer>
                <el-button @click="showDeleteDialog = false">取消</el-button>
                <el-button type="primary" @click="onDeleteDialogConfirm">确定</el-button>
            </template>
        </el-dialog>
        <el-dialog v-model="showAddToPlaylistDialog" style="width: 480px;">
            <template #header>
                <span>添加到歌单</span>
            </template>
            <template #default>
                <p>选择要添加到的歌单：</p>
                <el-checkbox-group v-model="addToPlaylistIds">
                    <el-checkbox v-for="playlist in playerStore.playlists" :key="playlist.id" :label="playlist.title"
                        :value="playlist.id">
                    </el-checkbox>
                </el-checkbox-group>
            </template>
            <template #footer>
                <el-button @click="showAddToPlaylistDialog = false">取消</el-button>
                <el-button type="primary" @click="onAddToPlaylistDialogConfirm">确定</el-button>
            </template>
        </el-dialog>
    </div>

</template>

<style scoped>
.audio-list {
    display: flex;
    flex-direction: column;
    padding: 20px;
    position: fixed;
    top: 50px;
    left: 240px;
    right: 0;
    bottom: var(--playbar-height);
    overflow-y: auto;
}



.audio-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: bold;
    padding: 10px;
    border: 1px solid #ddd;
    margin-bottom: 5px;

}

.details {
    flex: 1;
}

.audio-header .duration {
    width: 100px;
    text-align: center;
}

.audio-header .album {
    width: 100px;
    text-align: center;
}

.options {
    width: 70px;
    text-align: center;
    font-size: 12px;
    font-weight: normal;
}

.header-options {
    display: flex;
    align-items: center;
}
</style>