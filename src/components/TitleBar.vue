<script setup lang="ts">
import { ref } from 'vue';
import UploadDialog from './UploadDialog.vue';
import { ElMessage } from 'element-plus'

const showUploadDialog  = ref(false);

function onSettingsClick() {
    ElMessage('暂未实现');
}
</script>

<template>
    <div class="titlebar">
        <div class="upload titlebar-item" @click="showUploadDialog = true">
            <span class="material-icons">cloud_upload</span>
        </div>
        <div class="settings titlebar-item" @click="onSettingsClick">
            <span class="material-icons">settings</span>
        </div>
    </div>
    <UploadDialog v-model="showUploadDialog" />
</template>

<style scoped>
.titlebar {
    width: 100%;
    height: 50px;
    background-color: var(--titalbar-bg);
    color: var(--titalbar-text-color);
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: end;
    align-items: center;
    padding: 0 24px;
}

.titlebar-item {
    font-size: 24px;
    margin-left: 20px;
    cursor: pointer;
}
</style>