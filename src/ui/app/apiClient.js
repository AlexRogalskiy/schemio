import axios from 'axios';

function unwrapAxios(response) {
    return response.data;
}

export function createApiClient(path) {
    return {
        _getSchemeUrl(schemeId) {
            let url = '/v1/fs/scheme?id=' + encodeURIComponent(schemeId);
            if (path) {
                url = url + '&path=' + encodeURIComponent(path);
            }
            return url;
        },

        listEntries(path) {
            let url = '/v1/fs/list';
            if (path) {
                url = url + '?path=' + encodeURIComponent(path);
            }
            return axios.get(url).then(unwrapAxios);
        },

        createDirectory(name) {
            return axios.post('/v1/fs/dir', { name, path }).then(unwrapAxios);
        },

        getScheme(schemeId) {
            return axios.get(this._getSchemeUrl(schemeId)).then(unwrapAxios);
        },


        createArt(art) {
            return Promise.resolve(null);
        },

        getAllArt() {
            return Promise.resolve(null);
        },

        getGlobalArt() {
            return axios.get('/v1/art').then(unwrapAxios);
        },

        saveArt(artId, art) {
            return Promise.resolve(null);
        },

        deleteArt(artId) {
            return Promise.resolve(null);
        },

        createNewScheme(scheme) {
            return axios.post( `/v1/fs/scheme?path=${encodeURIComponent(path)}&id=${encodeURIComponent(scheme.id)}`, scheme).then(unwrapAxios);
        },

        saveScheme(scheme) {
            return axios.put(this._getSchemeUrl(scheme.id), scheme).then(unwrapAxios);
        },

        deleteScheme(schemeId) {
        },

        findSchemes(filters) {
        },

        getTags() {
            return Promise.resolve([]);
        },

        createCategory(categoryName, parentCategoryId) {
        },

        deleteCategory(categoryId) {
        },

        updateCategory(categoryId, category) {
        },

        moveCategory(categoryId, newParentCategoryId) {
        },

        getCategoryTree() {
        },

        ensureCategoryStructure(categories) {
        },

        uploadSchemeSvgPreview(schemeId, svgCode) {
        },

        uploadFile(file) {
        },

        saveStyle(fill, strokeColor, textColor) {
        },

        getStyles() {
        },

        deleteStyle(styleId) {
        },

        /**
         * Returns static resources (html, css, js) for scheme exporting
         */
        getExportHTMLResources() {
        },

        getSchemeEmbeddingLink() {
        }
    };
}