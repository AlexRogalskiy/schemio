import _ from 'lodash';
import myMath from '../myMath.js';
/*
Providing access to scheme elements and provides modifiers for it
*/
class SchemeContainer {
    constructor(scheme) {
        this.scheme = scheme;
        this.selectedItems = [];
        this.sortedItemsIndex = null;
        this.activeBoundaryBox = null;
        this.schemeBoundaryBox = {x: 0, y: 0, w: 100, h: 100};
        this.reindexItems();
    }

    reindexItems() {
        var sortedItems = [].concat(this.scheme.items);
        sortedItems.sort((a,b) => {
            var areaA = a.area.w * a.area.h,
                areaB = b.area.w * b.area.h;
            return areaA - areaB;
        });

        if (sortedItems.length > 0) {
            this.schemeBoundaryBox.x = sortedItems[0].area.x;
            this.schemeBoundaryBox.y = sortedItems[0].area.y;
            this.schemeBoundaryBox.w = sortedItems[0].area.w;
            this.schemeBoundaryBox.h = sortedItems[0].area.h;

            _.forEach(sortedItems, item => {
                if (this.schemeBoundaryBox.x > item.area.x) {
                    this.schemeBoundaryBox.x = item.area.x;
                }
                if (this.schemeBoundaryBox.x + this.schemeBoundaryBox.w < item.area.x + item.area.w) {
                    this.schemeBoundaryBox.w = item.area.x + item.area.w - this.schemeBoundaryBox.x;
                }
                if (this.schemeBoundaryBox.y > item.area.y) {
                    this.schemeBoundaryBox.y = item.area.y;
                }
                if (this.schemeBoundaryBox.y + this.schemeBoundaryBox.h < item.area.y + item.area.h) {
                    this.schemeBoundaryBox.h = item.area.y + item.area.h - this.schemeBoundaryBox.y;
                }
            });
        } else {
            this.schemeBoundaryBox = {x: 0, y: 0, w: 100, h: 100};
        }
        return this.sortedItemsIndex = sortedItems;
    }

    getSelectedItems() {
        return this.selectedItems;
    }

    deleteSelectedItems() {
        if (this.selectedItems && this.selectedItems.length > 0) {
            _.remove(this.scheme.items, item => _.includes(this.selectedItems, item));
            this.reindexItems();
        }
    }

    addItem(item) {
        if (!item.hasOwnProperty('meta')) {
            item.meta = {};
        }
        this.scheme.items.push(item);
        this.reindexItems();
    }

    getItems() {
        return this.scheme.items;
    }

    findHoveredItem(x, y) {
        return _.find(this.sortedItemsIndex, item => myMath.isPointInArea(x, y, item.area));
    }

    setActiveBoundaryBox(area) {
        this.activeBoundaryBox = area;
    }

    selectItem(item, inclusive) {
        if (inclusive) {
            this.selectItemInclusive();
        } else {
            this.deselectAllItems();
            item.meta.selected = true;
            this.selectedItems.push(item);
        }
    }

    selectItemInclusive(item) {
        var isAlreadyIn = false;
        var i = 0;
        for (; i < this.selectedItems.length; i++) {
            if (this.selectedItems[i] === item) {
                isAlreadyIn = true;
                break;
            }
        }

        if (!isAlreadyIn) {
            this.selectedItems.push(item);
            item.meta.selected = true;
        } else {
            item.meta.selected = false;
            this.selectedItems.splice(i, 1);
        }
    }

    deselectAllItems() {
        _.forEach(this.selectedItems, item => {
            item.meta.selected = false;
        });
        this.selectedItems = [];
    }


    provideBoundingBoxDraggers(item) {
        // OPTIMIZE: should not construct entire array of draggers each time, as it is used in mouseMove event
        var s = 5;
        return [{
            x: item.area.x, y: item.area.y, s: s, edges: ['top', 'left']
        },{
            x: item.area.x + item.area.w, y: item.area.y, s: s, edges: ['top', 'right']
        },{
            x: item.area.x + item.area.w, y: item.area.y + item.area.h, s: s, edges: ['bottom', 'right']
        },{
            x: item.area.x, y: item.area.y + item.area.h, s: s, edges: ['bottom', 'left']
        }, {
            x: item.area.x + Math.floor(item.area.w / 2), y: item.area.y, s: s, edges: ['top']
        },{
            x: item.area.x + Math.floor(item.area.w / 2), y: item.area.y + item.area.h, s: s, edges: ['bottom']
        },{
            x: item.area.x + item.area.w, y: item.area.y + Math.floor(item.area.h / 2), s: s, edges: ['right']
        },{
            x: item.area.x, y: item.area.y + Math.floor(item.area.h / 2), s: s, edges: ['left']
        }];
    }
}


export default SchemeContainer;
