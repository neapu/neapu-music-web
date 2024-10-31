<template>
    <el-dialog v-model="visible" title="上传文件" :before-close="closeHandler">
        <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
            <p>拖动文件到此处或点击选择文件上传</p>
            <input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" multiple accept="audio/*" />
        </div>
        <div v-if="files.length > 0" class="file-list">
            <div class="options">
                <el-button type="primary" @click="uploadFiles" :disabled="uploading">上传</el-button>
                <el-checkbox v-if="isUserPlaylist" v-model="isUploadPlaylist">添加到<em>{{ currentPlaylistTitle }}</em></el-checkbox>
            </div>

            <el-table :data="files" style="width: 100%">
                <el-table-column prop="name" label="文件名"></el-table-column>
                <el-table-column prop="status" label="状态" width="180">
                    <template #default="scope">
                        <el-tag :type="getTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-button type="danger" @click="removeFile(scope.$index)" class="material-icons" circle
                            size="small">close</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, watch, computed } from 'vue';
import { PlayListsType, usePlayerStore } from '../stores/player';
import axios from 'axios';
import { ElMessage, ElNotification } from 'element-plus';


const playerStore = usePlayerStore();

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const visible = ref(props.modelValue);

watch(() => props.modelValue, (value) => {
    visible.value = value;
    if (value == true) {
        files.value = [];
    } else {
        playerStore.updateCurrentAudioList();
    }
});

watch(() => visible.value, (value) => {
    emit('update:modelValue', value);
});

enum UploadStatus {
    Pending = '待上传',
    Uploading = '上传中',
    Success = '上传成功',
    Failed = '上传失败',
}

interface UploadFile {
    name: string;
    status: UploadStatus;
    file: File;
}

const files = ref<UploadFile[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isUserPlaylist = computed(() => playerStore.selectedPlaylist.type == PlayListsType.User);
const currentPlaylistTitle = computed(() => playerStore.selectedPlaylist.title);
const isUploadPlaylist = ref(false);
const uploading = ref(false);

const closeHandler = (done: () => void) => {
    if (uploading.value) {
        ElMessage('文件正在上传中，请等待上传完成');
    } else {
        done();
    }
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        files.value = Array.from(target.files).map(file => ({
            name: file.name,
            status: UploadStatus.Pending,
            file,
        }));
    }
};

const handleDrop = (event: DragEvent) => {
    if (event.dataTransfer?.files) {
        files.value = Array.from(event.dataTransfer.files).map(file => ({
            name: file.name,
            status: UploadStatus.Pending,
            file,
        }));
    }
};

const removeFile = (index: number) => {
    files.value.splice(index, 1);
};

const getTagType = (status: UploadStatus) => {
    switch (status) {
        case UploadStatus.Pending:
            return 'info';
        case UploadStatus.Uploading:
            return 'primary';
        case UploadStatus.Success:
            return 'success';
        case UploadStatus.Failed:
            return 'danger';
    }
}

const uploadUrl = "/api/music/add_audio";
const uploadFiles = async () => {
    uploading.value = true;
    for (const file of files.value) {
        if (file.status !== UploadStatus.Pending) {
            continue;
        }
        // 判断是不是音乐文件
        if (!file.file.type.startsWith('audio/')) {
            file.status = UploadStatus.Failed;
            ElNotification({
                title: '上传失败',
                message: '不支持的文件类型',
                type: 'error'
            });
            continue;
        }
        const formData = new FormData();
        formData.append('file', file.file);
        if (isUploadPlaylist.value && playerStore.selectedPlaylist.id) {
            formData.append('playlist', playerStore.selectedPlaylist.id!);
        }
        try {
            file.status = UploadStatus.Uploading;
            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const {code, msg} = response.data;
            if (code !== 0) {
                console.error(msg);
                file.status = UploadStatus.Failed;
                ElNotification({
                    title: '上传失败',
                    message: msg,
                    type: 'error'
                });
            } else {
                file.status = UploadStatus.Success;
            }
        } catch (error) {
            file.status = UploadStatus.Failed;
        }
    }
    uploading.value = false;
};
</script>

<style scoped>
.upload-area {
    border: 2px dashed #d9d9d9;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    max-height: 600px;
}

.file-list {
    margin-top: 20px;
    width: 100%;
}

.options {
    display: flex;
    justify-content: start;
    margin-bottom: 10px;
    gap: 10px;
}

.options em {
    font-style: normal;
    color: #1890ff;
}
</style>