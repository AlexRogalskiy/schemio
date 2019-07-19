/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import _ from 'lodash';
import utils from './utils.js';


function unwrapAxios(response) {
    return response.data;
}

export default {
    getCurrentUser() {
        return axios.get('/v1/user').then(unwrapAxios).catch(err => {
            return null;
        });
    },

    createProject(project) {
        return axios.post('/v1/projects', project).then(unwrapAxios);
    },

    findProjects(filters) {
        let encodedQuery = encodeURIComponent(filters.query || '');
        let url = `/v1/projects?offset=${filters.offset || 0}&q=${encodedQuery}`;
        return axios.get(url).then(unwrapAxios);
    },

    getProject(projectId) {
        return axios.get(`/v1/projects/${projectId}`).then(unwrapAxios);
    },

    login(login, password) {
        return axios.post('/v1/login', {login, password}).then(unwrapAxios);
    },

    createArt(projectId, art) {
        return axios.post(`/v1/projects/${projectId}/art`, art).then(unwrapAxios);
    },

    getAllArt(projectId) {
        return axios.get(`/v1/projects/${projectId}/art`).then(unwrapAxios);
    },

    loadScheme(projectId, schemeId) {
        return axios.get(`/v1/projects/${projectId}/schemes/${schemeId}`).then(unwrapAxios);
    },

    createNewScheme(projectId, scheme) {
        return axios.post(`/v1/projects/${projectId}/schemes`, scheme).then(unwrapAxios);
    },

    saveScheme(projectId, schemeId, scheme) {
        if (schemeId && schemeId.trim().length > 0) {
            return axios.put(`/v1/projects/${projectId}/schemes/${schemeId}`, utils.sanitizeScheme(scheme)).then(response => {
                return 'saved';
            });
        } else {
            return Promise.resolve(null);
        }
    },

    deleteScheme(projectId, schemeId) {
        if (schemeId && schemeId.trim().length > 0) {
            return axios.delete(`/v1/projects/${projectId}/schemes/${schemeId}`).then(unwrapAxios);
        } else {
            return Promise.resolve(null);
        }
    },

    findSchemes(projectId, filters) {
        let encodedQuery = encodeURIComponent(filters.query || '');
        let url = `/v1/projects/${projectId}/schemes?offset=${filters.offset || 0}&q=${encodedQuery}`;
        if (filters.categoryId) {
            url = `${url}&category=${encodeURIComponent(filters.categoryId)}`;
        }
        if (filters.includeSubcategories) {
            url = `${url}&includeSubcategories=true`;
        }

        return axios.get(url).then(unwrapAxios);
    },

    getTags(projectId) {
        return axios.get(`/v1/projects/${projectId}/tags`).then(unwrapAxios);
    },

    getCategory(projectId, parentCategoryId) {
        var id = parentCategoryId ? parentCategoryId : '';
        return axios.get(`/v1/projects/${projectId}/categories/${id}`).then(unwrapAxios);
    },

    getCategoryTree(projectId) {
        return axios.get(`/v1/projects/${projectId}/category-tree`).then(unwrapAxios);
    },

    ensureCategoryStructure(projectId, categories) {
        if (categories && categories.length > 0) {
            return axios.put(`/v1/projects/${projectId}/category-structure`, categories).then(unwrapAxios);
        } else {
            return Promise.resolve(null);
        }
    },

    uploadSchemeThumbnail(projectId, schemeId, data) {
        return axios.post(`/v1/projects/${projectId}/scheme-thumnbails/${schemeId}`, {image: data}).then(unwrapAxios);
    }
}
