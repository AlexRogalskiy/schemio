
module.exports = {
    details: 'Creating unique indices for categories, text index for schemes for searching',
    up(db) {
        return Promise.resolve(null).then(() =>
            db.collection('migrations').createIndex({id: 1}, {unique: true})
        ).then(() =>
            db.collection('categories').createIndex({projectId: 1, id: 1}, {unique: true})
        ).then(() =>
            db.collection('categories').createIndex({projectId: 1, 'ancestors.id': 1})
        ).then(() =>
            db.collection('schemes').createIndex({projectId: 1, id: 1}, {unique: true})
        ).then(() =>
            db.collection('schemes').createIndex({projectId: 1, categoryId: 1})
        ).then(() =>
            db.collection('schemes').createIndex({name: "text", description: "text", itemsText: "text"})
        ).then(() =>
            db.collection('projects').createIndex({id: 1}, {unique: true})
        ).then(() =>
            db.collection('projects').createIndex({name: "text", description: "text"})
        ).then(() =>
            db.collection('art').createIndex({projectId: 1, id: 1}, {unique: true})
        ).then(() =>
            db.collection('tags').createIndex({projectId: 1, id: 1}, {unique: true})
        ).then(() =>
            db.collection('schemePreviews').createIndex({projectId: 1, id: 1}, {unique: true})
        ).then(() =>
            db.collection('images.files').createIndex({ 'metadata.projectId' : 1 })
        );
    }
}
