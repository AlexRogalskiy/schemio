/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// This is an entry point for schemio bundle that is used for FS based Schemio app

import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './app/App.vue';
import HomeView from './app/view/HomeView.vue';
import store from './store/Store.js';
import SchemeEditorView from './app/view/SchemeEditorView.vue';
import NotFoundView from './app/view/NotFoundView.vue';

Vue.use(VueRouter);

function zeroPad(n) {
    if (n >=0 && n < 10) {
        return '0' + n;
    } else {
        return '' + n;
    }
}

Vue.filter('formatDateTime', encodedDate => {
    const d = new Date(encodedDate);
    const z = zeroPad;
    return `${d.getFullYear()}.${z(d.getMonth())}.${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
});

function route(name, path, component, props) {
    return {
        name,
        path,
        component,
        props
    };
}


const routes = [
    route('SchemeEditorView',   '/scheme/*', SchemeEditorView),
    route('NotFoundView',       '/not-found', NotFoundView),
    route('HomeView',           '/', HomeView),
    route('FolderView',         '/f/*', HomeView),
    { path: '*', redirect: '/not-found'}
];


const router = new VueRouter({
    mode: 'history',
    routes: routes,
});


new Vue(Vue.util.extend({
    router,
    store,
}, App)).$mount('#app');
