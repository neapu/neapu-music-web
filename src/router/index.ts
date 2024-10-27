import { createRouter, createWebHashHistory } from "vue-router";

import PlayView from "../view/PlayView.vue";

const routes = [
    {
        path: "/",
        component: PlayView,
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;