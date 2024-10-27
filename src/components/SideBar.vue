<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { usePlayerStore, PlayListsType } from '../stores/player';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';

const playerStore = usePlayerStore();
// const addPlaylistDialogVisible = ref(false);
// const newPlaylistTitle = ref('');

onBeforeMount(async () => {
    const ret = await playerStore.updatePlaylists();
    if (ret != null) {
        console.error('Failed to update playlists:', ret);
    }
    const ret2 = await playerStore.updateSelectedPlaylist({ type: PlayListsType.All });
    if (ret2 != null) {
        console.error('Failed to update selected playlist:', ret2);
    }
});

// const selectedPlaylist = playerStore.selectedPlaylist;

function onPlaylistsItemClick(type: PlayListsType, id?: string) {
    switch (type) {
        case PlayListsType.All:
            playerStore.updateSelectedPlaylist({ type: PlayListsType.All });
            break;
        case PlayListsType.Favorite:
            playerStore.updateSelectedPlaylist({ type: PlayListsType.Favorite });
            break;
        case PlayListsType.User:
            playerStore.updateSelectedPlaylist({ type: PlayListsType.User, id });
            break;
    }
}

function onAddPlaylistBtnClick() {
    // addPlaylistDialogVisible.value = true;
    // newPlaylistTitle.value = '';
    ElMessageBox.prompt('请输入歌单名称', '新建歌单', {
        confirmButtonText: '新建',
        cancelButtonText: '取消',
        inputPattern: /\S/,
        inputErrorMessage: '歌单名称不能为空',
    }).then(async ({ value }) => {
        const ret = await playerStore.addPlaylist(value);
        if (ret != null) {
            ElNotification({
                title: '新建歌单失败',
                message: ret,
                type: 'error',
            });
        } else {
            ElMessage.success('新建歌单成功');
        }
    }).catch(() => {});
}

// async function onAddPlaylist() {
//     if (newPlaylistTitle.value.trim() === '') {
//         return;
//     }
//     const ret = await playerStore.addPlaylist(newPlaylistTitle.value.trim());
//     if (ret != null) {
//         ElNotification({
//             title: '新建歌单失败',
//             message: ret,
//             type: 'error',
//         });
//     } else {
//         addPlaylistDialogVisible.value = false;
//     }
// }

</script>

<template>
    <div class="sidebar">
        <div class="sidebar-content">
            <div class="default-playlists">
                <div class="playlists-item"
                    :class="{ selected: playerStore.selectedPlaylist.type == PlayListsType.All }"
                    @click="onPlaylistsItemClick(PlayListsType.All)">
                    <span class="material-icons">
                        queue_music
                    </span>
                    全部音乐
                </div>
                <!-- <div class="playlists-item"
                    :class="{ selected: playerStore.selectedPlaylist.type == PlayListsType.Favorite }"
                    @click="onPlaylistsItemClick(PlayListsType.Favorite)">
                    <span class="material-icons">
                        favorite
                    </span>
                    我的收藏
                </div> -->
            </div>
            <div class="divider-container">
                <div class="divider"></div>
                <span class="material-icons add-icon" @click="onAddPlaylistBtnClick">add</span>
            </div>
            <div class="user-playlists">
                <div class="playlists-item"
                    :class="{ selected: playerStore.selectedPlaylist.type == item.type && playerStore.selectedPlaylist.id == item.id }"
                    v-for="item in playerStore.playlists" :key="item.id"
                    @click="onPlaylistsItemClick(PlayListsType.User, item.id)">
                    <span class="material-icons">
                        queue_music
                    </span>
                    {{ item.title }}
                </div>

            </div>
        </div>
    </div>
    <!-- <el-dialog v-model="addPlaylistDialogVisible" style="width: 400px;">
        <template #header>
            <span>新建歌单</span>
        </template>
        <el-form>
            <el-form-item label="歌单名称">
                <el-input v-model="newPlaylistTitle"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onAddPlaylist">新建</el-button>
            </el-form-item>
        </el-form>
    </el-dialog> -->
</template>

<style scoped>
.sidebar {
    background-color: var(--sidebar-bg);
    color: var(--sidebar-text-color);
    width: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    position: fixed;
    top: 50px;
    left: 0;
    bottom: 0;
    transition: 0.5s;
}

.sidebar-content {
    padding: 20px;
    width: 100%;
    height: 100%;
    overflow-y: auto;
}

.default-playlists {
    display: flex;
    flex-direction: column;
    gap: 20px;
    /* 设置按钮之间的间隔 */
}

.playlists-item {
    padding: 10px 20px;
    border-radius: 5px;
    /* 设置圆角矩形 */
    /* text-align: center; */
    cursor: pointer;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
}

.playlists-item:hover {
    background-color: var(--sidebar-item-hover-bg);
}

.playlists-item.selected {
    background-color: var(--sidebar-item-selected-bg);
}

.user-playlists {
    /* margin-top: 10px; */
    display: flex;
    flex-direction: column;
    gap: 20px;
    /* 设置按钮之间的间隔 */
}

.playlists-item .material-icons {
    margin-right: 10px;
}

.divider-container {
    display: flex;
    align-items: center;
    width: 100%;
    margin: 20px 0 0;
}

.divider {
    flex-grow: 1;
    border: none;
    border-top: 1px solid var(--sidebar-text-color);
}

.add-icon {
    margin-left: 8px;
    cursor: pointer;
    color: var(--sidebar-text-color);
}
</style>