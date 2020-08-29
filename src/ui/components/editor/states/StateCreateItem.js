/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import State from './State.js';
import Shape from '../items/shapes/Shape';
import forEach from 'lodash/forEach';
import EventBus from '../EventBus.js';

export default class StateCreateItem extends State {
    constructor(eventBus) {
        super(eventBus);
        this.name = 'create-item';
        this.item = null;
        this.addedToScheme = false;
        this.originalPoint = null;
    }

    reset() {
        this.item = null;
        this.addedToScheme = false;
        this.updateCursor('default');
    }

    setItem(item) {
        this.item = item;
        this.updateCursor('crosshair');
    }

    mouseDown(x, y, mx, my, object, event) {
        this.originalPoint = {x: this.snapX(x), y: this.snapY(y)};
        this.item.name = this.schemeContainer.generateUniqueName(this.item.name);
        this.schemeContainer.addItem(this.item);
        this.refreshControlPoints(this.item);
        this.addedToScheme = true;
        this.schemeContainer.setActiveBoundaryBox(this.item.area);
    }

    mouseMove(x, y, mx, my, object, event) {
        if (this.addedToScheme) {
            if (event.buttons === 0) {
                // no buttons are pressed so it should cancel the dragging state
                this.submitItemAndFinishCreating();
                return;
            }

            this.updateItemArea(this.snapX(x), this.snapY(y));
        }
    }

    mouseUp(x, y, mx, my, object, event) {
        if (this.addedToScheme) {
            this.updateItemArea(this.snapX(x), this.snapY(y));
            this.submitItemAndFinishCreating();
        } else {
            this.cancel();
        }
    }

    submitItemAndFinishCreating() {
        this.schemeContainer.setActiveBoundaryBox(null);
        
        const parentItem = this.findItemSuitableForParent(this.schemeContainer.selectedItems, this.item.area);
        this.schemeContainer.deselectAllItems();
        if (parentItem) {
            this.schemeContainer.remountItemInsideOtherItem(this.item.id, parentItem.id);
        }
        this.schemeContainer.selectItem(this.item);
        this.eventBus.$emit(this.eventBus.SWITCH_MODE_TO_EDIT);
        this.eventBus.emitItemChanged(this.item.id);
        this.eventBus.emitSchemeChangeCommited();
        this.reset();
    }

    /**
     * Searches for item that is able to fit item inside it and that has the min area out of all specified items
     * @param {*} items 
     * @param {*} area 
     * @returns {Item}
     */
    findItemSuitableForParent(items, area) {
        let maxArea = -1;
        let itemFound = null;

        forEach(items, item => {
            const points = [
                { x: area.x,  y: area.y },
                { x: area.x + area.w,  y: area.y },
                { x: area.x + area.w,  y: area.y + area.h},
                { x: area.x,  y: area.y + area.h},
            ];

            let fitsInside = true;
            for (let i = 0; i < points.length && fitsInside; i++) {
                const localPoint = this.schemeContainer.localPointOnItem(points[i].x, points[i].y, item);
                fitsInside = localPoint.x >= 0 && localPoint.y >= 0 && localPoint.x <= item.area.w && localPoint.y <= item.area.h;
            }

            if (fitsInside) {
                if (maxArea < 0 || maxArea > item.area.w*item.area.h) {
                    itemFound = item;
                    maxArea = item.area.w * item.area.h;
                }
            }
        });

        return itemFound;
    }

    updateItemArea(x, y) {
        if (x > this.originalPoint.x) {
            this.item.area.w = x - this.originalPoint.x;
            this.item.area.x = this.originalPoint.x;
        } else {
            this.item.area.w = this.originalPoint.x - x;
            this.item.area.x = x;
        }

        if (y > this.originalPoint.y) {
            this.item.area.h = y - this.originalPoint.y;
            this.item.area.y = this.originalPoint.y;
        } else {
            this.item.area.h = this.originalPoint.y - y;
            this.item.area.y = y;
        }
        this.refreshControlPoints(this.item);
        EventBus.emitItemChanged(this.item.id);
    }

    refreshControlPoints(item) {
        const shape = Shape.find(item.shape);
        if (shape && shape.controlPoints) {
            item.meta.controlPoints = shape.controlPoints.make(item);
        }
    }
}
