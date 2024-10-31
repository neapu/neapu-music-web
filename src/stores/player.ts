import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios';

export enum PlayListsType {
    All = 0,
    Favorite = 1,
    User = 2,
}

export interface PlayList {
    type: number;
    id?: string;
    title?: string;
};

export interface AudioItem {
    id: string;
    title: string;
    author: string;
    album: string;
    duration: number;
    url: string;
    cover?: string;
    selected?: boolean;
}

export enum PlayerState {
    Stopped = 0,
    Playing = 1,
    Paused = 2,
}

export enum PlayMode {
    Single = 0,
    Sequence = 1,
    Shuffle = 2,
    Loop = 3,
}

export const usePlayerStore = defineStore('player', () => {
    const playlists = ref<PlayList[]>([]);
    const selectedPlaylist = ref<PlayList>({type: PlayListsType.All});
    const selectedAudioList = ref<AudioItem[]>([]);
    const playerState = ref<PlayerState>(PlayerState.Stopped);
    const playingAudioList = ref<AudioItem[]>([]);
    const playingPlaylist = ref<PlayList>({type: PlayListsType.All});
    const playingAudioIndex = ref<number>(-1);
    const playingAudioReset = ref<boolean>(false);
    const playMode = ref<PlayMode>(PlayMode.Sequence);

    const playingAudio = computed(() => {
        if (playingAudioList.value.length === 0 || playingAudioIndex.value < 0 || playingAudioIndex.value >= playingAudioList.value.length) {
            return null;
        }
        return playingAudioList.value[playingAudioIndex.value];
    });

    // const currentAudioTitle = computed(() => {
    //     if (playingAudioList.value.length === 0 || playingAudioIndex.value < 0 || playingAudioIndex.value >= playingAudioList.value.length) {
    //         return '未播放';
    //     }
    //     return playingAudioList.value[playingAudioIndex.value].title;
    // });

    // const currentAudioAuthor = computed(() => {
    //     if (playingAudioList.value.length === 0 || playingAudioIndex.value < 0 || playingAudioIndex.value >= playingAudioList.value.length) {
    //         return '未播放';
    //     }
    //     return playingAudioList.value[playingAudioIndex.value].author;
    // });

    // const currentAudioUrl = computed(() => {
    //     if (playingAudioList.value.length === 0 || playingAudioIndex.value < 0 || playingAudioIndex.value >= playingAudioList.value.length) {
    //         return '';
    //     }
    //     return playingAudioList.value[playingAudioIndex.value].url;
    // });

    // const currentAudioCover = computed(() => {
    //     if (playingAudioList.value.length === 0 || playingAudioIndex.value < 0 || playingAudioIndex.value >= playingAudioList.value.length) {
    //         return '';
    //     }
    //     return playingAudioList.value[playingAudioIndex.value].cover;
    // });

    const listEnd = computed(() => {
        return playingAudioIndex.value === playingAudioList.value.length - 1;
    });

    async function updatePlaylists(): Promise<string | null> {
        try {
            /*
             * 接口/api/playlists返回的数据格式如下：
             * {
             *    "code": 0, // 成功返回0，失败返回错误代码(非0)
             *    "msg": "", // 发生错误时返回错误信息，成功时返回空字符串
             *    "data": [{
             *       "id": "0001",
             *       "title": "playlist1",
             *    }]
             * }
             */
            const response = await axios.get('/api/music/playlists');
            const { code, msg, data } = response.data;
            if (code !== 0) {
                console.error(`Failed to fetch playlists: ${msg}`);
                return msg;
            }
            playlists.value = data.map((item: any) => {
                return {
                    type: PlayListsType.User,
                    id: item.id,
                    title: item.title,
                };
            });
            return null;
        } catch (error) {
            console.error(`Failed to fetch playlists: ${error}`);
            return 'Network error';
        }
    }

    async function addPlaylist(title: string): Promise<string | null> {
        try {
            const response = await axios.post('/api/music/add_playlist', { title });
            const { code, msg } = response.data;
            if (code !== 0) {
                console.error(`Failed to add playlist: ${msg}`);
                return msg;
            }
            await updatePlaylists();
            return null;
        } catch (error) {
            console.error(`Failed to add playlist: ${error}`);
            return 'Network error';
        }
    }

    async function updateSelectedAudioList(type: PlayListsType, id?: string): Promise<string | null> {
        console.log(`updateSelectedAudioList: type=${type}, id=${id}`);
        try {
            const url = type === PlayListsType.User ? `/api/music/playlist_audios?id=${id}` : '/api/music/all_audios';
            const response = await axios.get(url);
            const { code, msg, data } = response.data;
            if (code !== 0) {
                console.log(`url: ${url}`);
                console.error(`Failed to fetch playlist: ${response.data}`);
                return msg;
            }
            selectedAudioList.value = data;
            return null;
        } catch (error) {
            console.error(`Failed to fetch playlist: ${error}`);
            return 'Network error';
        }
    }

    async function updateCurrentAudioList() {
        if (selectedPlaylist.value.type === PlayListsType.User) {
            return updateSelectedAudioList(selectedPlaylist.value.type, selectedPlaylist.value.id);
        } else {
            return updateSelectedAudioList(selectedPlaylist.value.type);
        }
    }

    async function updateSelectedPlaylist(playlist: PlayList): Promise<string | null> {
        if (playlist.type === PlayListsType.User) {
            for (const item of playlists.value) {
                if (item.id === playlist.id) {
                    selectedPlaylist.value = item;
                    return updateSelectedAudioList(playlist.type, playlist.id);
                }
            }
            return 'Playlist not found';
        } else {
            selectedPlaylist.value = playlist;
            return updateSelectedAudioList(playlist.type);
        }
    }

    async function rearrangeSelectedPlaylist(audioItems: AudioItem[]): Promise<string | null> {
        const audios = audioItems.map((item) => item.id);
        try {
            const response = await axios.post('/api/music/update_playlist_audios', { id: selectedPlaylist.value.id, audios });
            const { code, msg } = response.data;
            if (code !== 0) {
                console.error(`Failed to rearrange playlist: ${msg}`);
                return msg;
            }
            await updateCurrentAudioList();
            return null;
        } catch (error) {
            console.error(`Failed to rearrange playlist: ${error}`);
            return 'Network error';
        }
    }

    async function deletePlaylist(id: string) : Promise<string | null> {
        try {
            const response = await axios.post('/api/music/delete_playlist', { id });
            const { code, msg } = response.data;
            if (code !== 0) {
                console.error(`Failed to delete playlist: ${msg}`);
                return msg;
            }
            await updatePlaylists();
            await updateSelectedPlaylist({type: PlayListsType.All});
            return null;
        } catch (error) {
            console.error(`Failed to delete playlist: ${error}`);
            return 'Network error';
        }
        
    }

    async function deleteAudio(audio: string, playlist: string|null): Promise<string | null> {
        try {
            const response = await axios.post('/api/music/delete_audio', { audio, playlist });
            const { code, msg } = response.data;
            if (code !== 0) {
                console.error(`Failed to delete audio: ${msg}`);
                return msg;
            }
            await updateCurrentAudioList();
            return null;
        } catch (error) {
            console.error(`Failed to delete audio: ${error}`);
            return 'Network error';
        }
    }

    async function deleteAudios(audios:string[], playlist: string|null = null): Promise<string | null> {
        try {
            const response = await axios.post('/api/music/delete_audios', { audios, playlist });
            const { code, msg } = response.data;
            if (code !== 0) {
                console.error(`Failed to delete audios: ${msg}`);
                return msg;
            }
            await updateCurrentAudioList();
            return null;
        } catch (error) {
            console.error(`Failed to delete audios: ${error}`);
            return 'Network error';
        }
    }

    async function addAudiosToPlaylist(audios: string[], playlist: string): Promise<string | null> {
        try {
            const response = await axios.post('/api/music/add_audios_to_playlist', { audios, playlist });
            const { code, msg } = response.data;
            if (code !== 0) {
                console.error(`Failed to add audio: ${msg}`);
                return msg;
            }
            await updateCurrentAudioList();
            return null;
        } catch (error) {
            console.error(`Failed to add audio: ${error}`);
            return 'Network error';
        }
    }

    function playAudio(id: string): void {
        const index = selectedAudioList.value.findIndex((item) => item.id === id);
        if (index === -1) {
            console.error(`Audio not found: ${id}`);
            return;
        }
        playingAudioList.value = selectedAudioList.value;
        playingAudioIndex.value = index;
        playerState.value = PlayerState.Playing;
        playingPlaylist.value = selectedPlaylist.value;
        playingAudioReset.value = true;
    }

    function playNext(shuffle: boolean): void {
        if (playingAudioList.value.length === 0) {
            return;
        }
        let index = playingAudioIndex.value;
        if (shuffle) {
            index = Math.floor(Math.random() * playingAudioList.value.length);
        } else {
            index = (index + 1) % playingAudioList.value.length;
        }
        playingAudioIndex.value = index;
        playerState.value = PlayerState.Playing;
        playingAudioReset.value = true;
    }

    function playLast(shuffle: boolean): void {
        if (playingAudioList.value.length === 0) {
            return;
        }
        let index = playingAudioIndex.value;
        if (shuffle) {
            index = Math.floor(Math.random() * playingAudioList.value.length);
        } else {
            index = (index - 1 + playingAudioList.value.length) % playingAudioList.value.length;
        }
        playingAudioIndex.value = index;
        playerState.value = PlayerState.Playing;
        playingAudioReset.value = true;
    }

    function pause(): void {
        playerState.value = PlayerState.Paused;
    }

    function resume(): void {
        playerState.value = PlayerState.Playing;
    }

    function changePlayMode(): void {
        playMode.value = (playMode.value + 1) % 4;
    }

    return {
        playlists,
        selectedPlaylist,
        selectedAudioList,
        playerState,
        playingAudioList,
        playingPlaylist,
        playingAudioIndex,
        playingAudioReset,
        playMode,
        // currentAudioTitle,
        // currentAudioAuthor,
        // currentAudioUrl,
        // currentAudioCover,
        playingAudio,
        listEnd,
        updatePlaylists,
        addPlaylist,
        updateCurrentAudioList,
        updateSelectedPlaylist,
        rearrangeSelectedPlaylist,
        deletePlaylist,
        deleteAudio,
        deleteAudios,
        addAudiosToPlaylist,
        playAudio,
        playNext,
        playLast,
        pause,
        resume,
        changePlayMode,
    };
});