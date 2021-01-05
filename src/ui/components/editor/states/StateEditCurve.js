/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import State from './State.js';
import utils from '../../../utils';
import myMath from '../../../myMath.js';
import Shape from '../items/shapes/Shape.js';
import {enrichItemWithDefaults} from '../../../scheme/Item';
import { Keys } from '../../../events.js';
import StoreUtils from '../../../store/StoreUtils.js';
import forEach from 'lodash/forEach';
import EventBus from '../EventBus';

const IS_NOT_SOFT = false;
const IS_SOFT = true;

const ITEM_MODIFICATION_CONTEXT_DEFAULT = {
    id: '',
    moved: true,
    rotated: false,
    resized: false
};


function isEventRightClick(event) {
    return event.button === 2;
}

/**
 * Checkes whether keys like shift, meta (mac), ctrl were pressed during the mouse event
 * @param {MouseEvent} event 
 */
function isMultiSelectKey(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey;
}

export default class StateEditCurve extends State {
    constructor(eventBus, store) {
        super(eventBus, store);
        this.name = 'edit-curve';
        this.item = null;
        this.addedToScheme = false;
        this.creatingNewPoints = true;
        this.originalClickPoint = {x: 0, y: 0, mx: 0, my: 0};
        this.candidatePointSubmited = false;
        this.shouldJoinClosedPoints = false;
        this.multiSelectBox = null;

        // used in order to drag screen when user holds spacebar
        this.shouldDragScreen = false;
        this.startedDraggingScreen = false;
        this.originalScreenOffset = {x: 0, y: 0};

        this.draggedObject = null;
        this.draggedObjectOriginalPoint = null;
        this.shadowSvgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    }

    reset() {
        this.eventBus.emitItemsHighlighted([]);
        this.item = null;
        this.addedToScheme = false;
        this.creatingNewPoints = true;
        this.softReset();
    }

    softReset() {
        this.shouldDragScreen = false;
        this.multiSelectBox = null;
        this.startedDraggingScreen = false;
        this.candidatePointSubmited = false;
        this.shouldJoinClosedPoints = false;
        this.draggedObject = null;
        this.draggedObjectOriginalPoint = null;
    }

    cancel() {
        this.eventBus.emitItemsHighlighted([]);
        if (this.creatingNewPoints) {
            // deleting last point
            this.item.shapeProps.points.splice(this.item.shapeProps.points.length - 1 , 1);

            if (this.item.shapeProps.points.length > 0) {
                this.submitItem();
            }
        } else {
            this.schemeContainer.readjustItem(this.item.id, false, ITEM_MODIFICATION_CONTEXT_DEFAULT);
            this.schemeContainer.updateAllMultiItemEditBoxes();
        }
        super.cancel();
    }

    setItem(item) {
        this.item = item;
        if (this.schemeContainer.findItemById(item.id)) {
            this.addedToScheme = true;
            this.creatingNewPoints = false;
        } else {
            this.updateCursor('crosshair');
        }
    }

    initConnectingFromSourceItem(sourceItem, localPoint) {
        if (!localPoint) {
            localPoint = {
                x: sourceItem.area.w / 2,
                y: sourceItem.area.h / 2
            };
        }
        
        const worldPoint = this.schemeContainer.worldPointOnItem(localPoint.x, localPoint.y, sourceItem);

        let curveItem = {
            shape: 'curve',
            name: `${sourceItem.name} :: `,
            area: {x: 0, y: 0, w: 200, h: 200, r: 0, type: sourceItem.area.type},
            shapeProps: {
                connector: true
            }
        };
        enrichItemWithDefaults(curveItem);
        curveItem = this.schemeContainer.addItem(curveItem);
        curveItem.shapeProps.sourceItem = `#${sourceItem.id}`;

        const closestPoint = this.findClosestPointToItem(sourceItem, localPoint);
        curveItem.shapeProps.sourceItemPosition = closestPoint.distanceOnPath;
        curveItem.shapeProps.points = [{
            t: 'L', x: closestPoint.x, y: closestPoint.y
        }, {
            t: 'L', x: worldPoint.x, y: worldPoint.y
        }];

        this.item = curveItem;
        this.addedToScheme = true;
        this.creatingNewPoints = true;
        this.updateCursor('crosshair');
        return this.item;
    }

    findClosestPointToItem(item, localPoint) {
        const shape = Shape.find(item.shape);
        if (shape) {
            const path = shape.computeOutline(item);
            if (path) {
                const worldPoint = this.schemeContainer.worldPointOnItem(localPoint.x, localPoint.y, item);
                return this.schemeContainer.closestPointToSvgPath(item, path, worldPoint);
            }
        }
        return {
            x: item.area.w / 2,
            y: item.area.h / 2
        };
    }

    initFirstClick(x, y) {
        this.item.shapeProps.points = [{
            x, y, t: 'L'
        }, {
            x, y, t: 'L'
        }];

        this.schemeContainer.addItem(this.item);

        // snapping can only be performed once the item is added to the scheme
        // that is why we have to re-adjust curve points afterwords so that they are snapped
        const snappedCurvePoint = this.snapCurvePoint(x, y);

        this.item.shapeProps.points[0].x = snappedCurvePoint.x;
        this.item.shapeProps.points[0].y = snappedCurvePoint.y;
        this.item.shapeProps.points[1].x = snappedCurvePoint.x;
        this.item.shapeProps.points[1].y = snappedCurvePoint.y;

        // in case user tried to attach source to another item
        this.handleEdgeCurvePointDrag(this.item.shapeProps.points[0], true);
        this.addedToScheme = true;
    }

    initScreenDrag(mx, my) {
        this.startedDraggingScreen = true;
        this.originalClickPoint.x = mx;
        this.originalClickPoint.y = my;
        this.originalClickPoint.mx = mx;
        this.originalClickPoint.my = my;
        this.originalScreenOffset = {x: this.schemeContainer.screenTransform.x, y: this.schemeContainer.screenTransform.y};
    }

    initMulitSelectBox(x, y, mx, my) {
        this.originalClickPoint.x = x;
        this.originalClickPoint.y = y;
        this.originalClickPoint.mx = mx;
        this.originalClickPoint.my = my;
        this.multiSelectBox = {x, y, w: 0, h: 0};
    }

    keyPressed(key, keyOptions) {
        if (key === Keys.SPACE && !this.startedDraggingScreen) {
            this.shouldDragScreen = true;
            this.updateCursor('grabbing');
        }
    }

    keyUp(key, keyOptions) {
        if (key === Keys.SPACE) {
            this.shouldDragScreen = false;
            this.updateCursor('default');
        }
    }


    mouseDoubleClick(x, y, mx, my, object, event) {
        if (this.item.area.type === 'viewport') {
            x = mx;
            y = my;
        }

        if (this.creatingNewPoints) {
            return;
        }
        if (object && (object.type === 'curve-point' || object.type === 'curve-control-point')) {
            return;
        }
        this.insertPointAtCoords(x, y);
    }

    mouseDown(x, y, mx, my, object, event) {
        if (this.item.area.type === 'viewport') {
            x = mx;
            y = my;
        }

        this.originalClickPoint.x = x;
        this.originalClickPoint.y = y;
        this.originalClickPoint.mx = mx;
        this.originalClickPoint.my = my;

        if (this.shouldDragScreen) {
            this.updateCursor('grabbing');
            this.initScreenDrag(mx, my);
            return;
        }

        if (!this.addedToScheme) {
            this.initFirstClick(x, y);
        } else if (this.creatingNewPoints) {
            const snappedCurvePoint = this.snapCurvePoint(x, y);

            // checking if the curve was attached to another item
            if (this.item.shapeProps.destinationItem) {
                if (this.item.shapeProps.sourceItem) {
                    this.item.name = this.createNameFromAttachedItems(this.item.shapeProps.sourceItem, this.item.shapeProps.destinationItem);
                }
                this.submitItem();
                return;
            }

            const point = this.item.shapeProps.points[this.item.shapeProps.points.length - 1];
            point.x = snappedCurvePoint.x;
            point.y = snappedCurvePoint.y;

            //checking whether curve got closed
            if (this.item.shapeProps.points.length > 2) {
                if (this.shouldJoinClosedPoints) {
                    //closing the curve
                    this.item.shapeProps.closed = true;
                    // deleting last point
                    this.item.shapeProps.points.splice(this.item.shapeProps.points.length - 1 , 1);
                    this.submitItem();
                }
            }
            StoreUtils.updateAllCurveEditPoints(this.store, this.item);
            this.candidatePointSubmited = true;
        } else {
            // editing existing curve
            if (isEventRightClick(event)) {
                this.handleRightClick(x, y, mx, my, object);
            } else if (object && (object.type === 'curve-point' || object.type === 'curve-control-point')) {
                this.draggedObjectOriginalPoint = utils.clone(this.item.shapeProps.points[object.pointIndex]);
                this.draggedObject = object;

                StoreUtils.toggleCurveEditPointSelection(this.store, object.pointIndex, isMultiSelectKey(event));
            } else {
                this.initMulitSelectBox(x, y, mx, my);
            }
        }
    }
    
    createNameFromAttachedItems(sourceSelector, destinationSelector) {
        const sourceItem = this.schemeContainer.findFirstElementBySelector(sourceSelector);
        const destinationItem = this.schemeContainer.findFirstElementBySelector(destinationSelector);
        if (sourceItem && destinationItem) {
            return `${sourceItem.name} -> ${destinationItem.name}`;
        }
        
        return 'Curve';
    }

    mouseMove(x, y, mx, my, object, event) {
        if (this.item.area.type === 'viewport') {
            x = mx;
            y = my;
        }

        if (this.shouldDragScreen && this.startedDraggingScreen) {
            this.dragScreen(mx, my);
            return;
        }

        if (this.addedToScheme && this.creatingNewPoints) {
            const pointIndex = this.item.shapeProps.points.length - 1;
            const point = this.item.shapeProps.points[pointIndex];

            if (this.candidatePointSubmited && !this.item.shapeProps.connector) {
                // convert last point to Beizer and drag its control points
                // but only in case this is a regular curve and not a connector
                point.t = 'B';
                point.x2 = x - point.x;
                point.y2 = y - point.y;

                point.x1 = -point.x2;
                point.y1 = -point.y2;
            } else {
                // drag last point
                const snappedLocalCurvePoint = this.snapCurvePoint(x, y);
                point.x = snappedLocalCurvePoint.x;
                point.y = snappedLocalCurvePoint.y;

                this.shouldJoinClosedPoints = false;

                if (this.item.shapeProps.points.length > 2) {
                    // checking if the curve point was moved too close to first point,
                    // so that the placement of new points can be stopped and curve will become closed
                    // This needs to be checked in viewport (not in world transform)
                    const p0 = this.item.shapeProps.points[0];
                    const dx = point.x - p0.x;
                    const dy = point.y - p0.y;
                    
                    if (Math.sqrt(dx * dx + dy * dy) * this.schemeContainer.screenTransform.scale <= 5) {
                        point.x = p0.x;
                        point.y = p0.y;
                        if (!this.item.shapeProps.sourceItem) {
                            this.shouldJoinClosedPoints = true;
                        }
                    }
                }
            }
            if (!this.shouldJoinClosedPoints) {
                // what if we want to attach this point to another item
                this.handleEdgeCurvePointDrag(pointIndex, point, false);
            }
            this.eventBus.emitItemChanged(this.item.id);
            StoreUtils.updateCurveEditPoint(this.store, pointIndex, point);
        } else if (this.draggedObject && this.draggedObject.type === 'curve-point') {
            this.handleCurvePointDrag(x, y, this.draggedObject.pointIndex);
        } else if (this.draggedObject && this.draggedObject.type === 'curve-control-point') {
            this.handleCurveControlPointDrag(x, y, event);
        } else if (this.multiSelectBox) {
            this.wasMouseMoved = true;
            if (x > this.originalClickPoint.x) {
                this.multiSelectBox.x = this.originalClickPoint.x;
                this.multiSelectBox.w = x - this.originalClickPoint.x;
            } else {
                this.multiSelectBox.x = x;
                this.multiSelectBox.w = this.originalClickPoint.x - x;
            }
            if (y > this.originalClickPoint.y) {
                this.multiSelectBox.y = this.originalClickPoint.y;
                this.multiSelectBox.h = y - this.originalClickPoint.y;
            } else {
                this.multiSelectBox.y = y;
                this.multiSelectBox.h = this.originalClickPoint.y - y;
            }
            this.eventBus.$emit(EventBus.MULTI_SELECT_BOX_APPEARED, this.multiSelectBox);
        }
    }

    mouseUp(x, y, mx, my, object, event) {
        if (this.item.area.type === 'viewport') {
            x = mx;
            y = my;
        }

        this.eventBus.emitItemsHighlighted([]);

        if (this.multiSelectBox) {
            const inclusive = isMultiSelectKey(event);
            this.selectByBoundaryBox(this.multiSelectBox, inclusive, mx, my);
            this.eventBus.$emit(EventBus.MULTI_SELECT_BOX_DISAPPEARED);

        } else if (this.addedToScheme && this.creatingNewPoints) {
            if (this.candidatePointSubmited) {
                this.candidatePointSubmited = false;

                const snappedLocalCurvePoint = this.snapCurvePoint(x, y);
                this.item.shapeProps.points.push({
                    x: snappedLocalCurvePoint.x,
                    y: snappedLocalCurvePoint.y,
                    t: 'L'
                });
                this.eventBus.emitItemChanged(this.item.id);
            }
        }

        // if something was dragged - the scheme change should be commited
        if (this.draggedObject) {
            this.eventBus.emitSchemeChangeCommited();
        }

        this.draggedObject = null;
        this.draggedObjectOriginalPoint = null;

        this.softReset();
    }

    handleRightClick(x, y, mx, my, object) {
        if (object && object.type === 'curve-point') {
            const point = this.item.shapeProps.points[object.pointIndex];
            if (!point) {
                return;
            }
            let nextPoint = null;
            if (object.pointIndex < this.item.shapeProps.points.length - 1) {
                nextPoint = this.item.shapeProps.points[object.pointIndex + 1];
            }

            const menuOptions = [{
                name: 'Delete point',
                clicked: () => this.deletePoint(object.pointIndex)
            }];

            if (point.break || (nextPoint && nextPoint.break)) {
                menuOptions.push({
                    name: 'Remove break',
                    clicked: () => this.repairBreak(object.pointIndex)
                });
            } else if (object.pointIndex > 0 && object.pointIndex < this.item.shapeProps.points.length - 2){
                menuOptions.push({
                    name: 'Break curve',
                    clicked: () => this.breakCurve(object.pointIndex + 1)
                });
            }

            if (point.t === 'L') {
                menuOptions.push({
                    name: 'Convert to beizer point',
                    clicked: () => this.convertPointToBeizer(object.pointIndex)
                });
            }
            else {
                menuOptions.push({
                    name: 'Convert to simple point',
                    clicked: () => this.convertPointToSimple(object.pointIndex)
                });
            }
            if (object.pointIndex === 0 && this.item.shapeProps.sourceItem) {
                menuOptions.push({
                    name: 'Detach',
                    clicked: () => this.detachSource()
                });
            }
            if (object.pointIndex === this.item.shapeProps.points.length - 1 && this.item.shapeProps.destinationItem) {
                menuOptions.push({
                    name: 'Detach',
                    clicked: () => this.detachDestination()
                });
            }
            this.eventBus.emitCustomContextMenuRequested(mx, my, menuOptions);
        }
    }

    breakCurve(pointIndex) {
        this.item.shapeProps.points[pointIndex].break = true;
        this.eventBus.emitItemChanged(this.item.id);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        this.eventBus.emitSchemeChangeCommited();
    }

    repairBreak(pointIndex) {
        if (this.item.shapeProps.points[pointIndex].break) {
            this.item.shapeProps.points[pointIndex].break = false;
        } else if (pointIndex < this.item.shapeProps.points.length - 1 && this.item.shapeProps.points[pointIndex + 1].break) {
            this.item.shapeProps.points[pointIndex + 1].break = false;
        } else {
            return;
        }
        this.eventBus.emitItemChanged(this.item.id);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        this.eventBus.emitSchemeChangeCommited();
    }

    deletePoint(pointIndex) {
        this.item.shapeProps.points.splice(pointIndex, 1);
        this.eventBus.emitItemChanged(this.item.id);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        StoreUtils.updateAllCurveEditPoints(this.store, this.item);
        this.eventBus.emitSchemeChangeCommited();
    }

    deleteSelectedPoints() {
        const points = StoreUtils.getCurveEditPoints(this.store);
        
        const selectedIds = [];
        forEach(points, p => {
            if (p.selected) {
                selectedIds.push(p.id);
            }
        });

        forEach(selectedIds.sort().reverse(), pointIndex => {
            this.item.shapeProps.points.splice(pointIndex, 1);
        });

        this.eventBus.emitItemChanged(this.item.id);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        StoreUtils.updateAllCurveEditPoints(this.store, this.item);
        this.eventBus.emitSchemeChangeCommited();
    }

    insertPointAtCoords(x, y) {
        const shape = Shape.find(this.item.shape);
        if (!shape) {
            return;
        }
        this.shadowSvgPath.setAttribute('d', shape.computePath(this.item));
        const localPoint = this.schemeContainer.localPointOnItem(x, y, this.item);
        const closestPoint = myMath.closestPointOnPath(localPoint.x, localPoint.y, this.shadowSvgPath);

        // checking how far away from the curve stroke has the user clicked
        const dx = localPoint.x - closestPoint.x;
        const dy = localPoint.y - closestPoint.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d <= parseInt(this.item.shapeProps.strokeSize) + 1) {
            const index = this.findClosestLineSegment(closestPoint.distance, this.item.shapeProps.points, this.shadowSvgPath);
            this.item.shapeProps.points.splice(index + 1, 0, {
                x: closestPoint.x,
                y: closestPoint.y,
                t: 'L'
            });
            if (this.item.shapeProps.points[index].t === 'B') {
                this.convertPointToBeizer(index + 1);
            }
            this.eventBus.emitItemChanged(this.item.id);
            this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
            StoreUtils.updateAllCurveEditPoints(this.store, this.item);
            this.eventBus.emitSchemeChangeCommited();
        }
    }

    findClosestLineSegment(distanceOnPath, points, svgPath) {
        let i = points.length - 1;
        while(i > 0) {
            const closestPoint = myMath.closestPointOnPath(points[i].x, points[i].y, svgPath);
            if (closestPoint.distance < distanceOnPath) {
                return i;
            }
            i--;
        }
        return 0;
    }

    convertPointToSimple(pointIndex) {
        const point = this.item.shapeProps.points[pointIndex];
        if (!point) {
            return;
        }
        point.t = 'L';
        if (point.hasOwnProperty('x1')) {
            delete point.x1;
            delete point.y1;
        }
        if (point.hasOwnProperty('x2')) {
            delete point.x2;
            delete point.y2;
        }
        this.eventBus.emitItemChanged(this.item.id);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        StoreUtils.updateCurveEditPoint(this.store, pointIndex, this.item.shapeProps.points[pointIndex]);
        this.eventBus.emitSchemeChangeCommited();
    }

    convertPointToBeizer(pointIndex) {
        const point = this.item.shapeProps.points[pointIndex];
        if (!point) {
            return;
        }
        
        let dx = 10, dy = 0;
        if (this.item.shapeProps.points.length > 2) {
            // calculating dx and dy via previous and next points
            let prevPointId = pointIndex - 1;
            if (prevPointId < 0) {
                prevPointId = this.item.shapeProps.points.length + prevPointId;
            }
            let nextPointId = pointIndex + 1;
            if (nextPointId >= this.item.shapeProps.points.length - 1) {
                nextPointId -= this.item.shapeProps.points.length - 1;
            }

            dx = (this.item.shapeProps.points[nextPointId].x - this.item.shapeProps.points[prevPointId].x) / 4;
            dy = (this.item.shapeProps.points[nextPointId].y - this.item.shapeProps.points[prevPointId].y) / 4;
        }

        point.x1 = - dx;
        point.y1 = - dy;
        point.x2 = dx;
        point.y2 = dy;
        point.t = 'B';
        this.eventBus.emitItemChanged(this.item.id);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        StoreUtils.updateCurveEditPoint(this.store, pointIndex, this.item.shapeProps.points[pointIndex]);
        this.eventBus.emitSchemeChangeCommited();
    }

    handleCurvePointDrag(x, y, pointIndex) {
        const localOriginalPoint = this.schemeContainer.localPointOnItem(this.originalClickPoint.x, this.originalClickPoint.y, this.item);
        const localPoint = this.schemeContainer.localPointOnItem(x, y, this.item);
        const curvePoint = this.item.shapeProps.points[pointIndex];

        const snappedLocalCurvePoint = this.snapCurvePoint(
            this.draggedObjectOriginalPoint.x + localPoint.x - localOriginalPoint.x,
            this.draggedObjectOriginalPoint.y + localPoint.y - localOriginalPoint.y
        );

        curvePoint.x = snappedLocalCurvePoint.x;
        curvePoint.y = snappedLocalCurvePoint.y;
        
        if (pointIndex === 0 || pointIndex === this.item.shapeProps.points.length - 1) {
            this.handleEdgeCurvePointDrag(pointIndex, curvePoint, pointIndex === 0);
        }

        this.eventBus.emitItemChanged(this.item.id);
        StoreUtils.updateCurveEditPoint(this.store, pointIndex, curvePoint);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
    }

    snapCurvePoint(localX, localY) {
        const worldCurvePoint = this.schemeContainer.worldPointOnItem(localX, localY, this.item);
        const snappedWorldX = this.snapX(worldCurvePoint.x);
        const snappedWorldY = this.snapY(worldCurvePoint.y);

        return this.schemeContainer.localPointOnItem(snappedWorldX, snappedWorldY, this.item);
    }

    /**
     * Handles dragging of edge point and checks whether it should stick to other item
     * This is the most time consuming function as it needs to look through all items in schemes
     * @param {Point} curvePoint 
     * @param {Boolean} isSource 
     */
    handleEdgeCurvePointDrag(pointIndex, curvePoint, isSource) {
        if (!this.item.shapeProps.connector) {
            // should not do anything since this is not a connecytor but a regular curve
            // regular curves should not be allowed to attach to other items
            return;
        }

        const worldCurvePoint = this.schemeContainer.worldPointOnItem(curvePoint.x, curvePoint.y, this.item);

        let distanceThreshold = 0;
        if (this.schemeContainer.screenTransform.scale > 0) {
            distanceThreshold = 20 / this.schemeContainer.screenTransform.scale;
        }

        const includeOnlyVisibleItems = true;
        const closestPointToItem = this.schemeContainer.findClosestPointToItems(worldCurvePoint.x, worldCurvePoint.y, distanceThreshold, this.item.id, includeOnlyVisibleItems, this.item.area.type);

        if (closestPointToItem) {
            const localCurvePoint = this.schemeContainer.localPointOnItem(closestPointToItem.x, closestPointToItem.y, this.item);
            curvePoint.x = localCurvePoint.x;
            curvePoint.y = localCurvePoint.y;
            this.eventBus.emitItemsHighlighted([closestPointToItem.itemId]);
            if (isSource) {
                this.item.shapeProps.sourceItem = '#' + closestPointToItem.itemId;
                this.item.shapeProps.sourceItemPosition = closestPointToItem.distanceOnPath;
            } else {
                this.item.shapeProps.destinationItem = '#' + closestPointToItem.itemId;
                this.item.shapeProps.destinationItemPosition = closestPointToItem.distanceOnPath;
            }
        } else {
            // nothing to attach to so reseting highlights in case it was set previously
            this.eventBus.emitItemsHighlighted([]);
            if (isSource) {
                this.item.shapeProps.sourceItem = null;
                this.item.shapeProps.sourceItemPosition = 0;
            } else {
                this.item.shapeProps.destinationItem = null;
                this.item.shapeProps.destinationItemPosition = 0;
            }
        }
        StoreUtils.updateCurveEditPoint(this.store, pointIndex, curvePoint);
    }

    handleCurveControlPointDrag(x, y, event) {
        const localOriginalPoint = this.schemeContainer.localPointOnItem(this.originalClickPoint.x, this.originalClickPoint.y, this.item);
        const localPoint = this.schemeContainer.localPointOnItem(x, y, this.item);
        const curvePoint = this.item.shapeProps.points[this.draggedObject.pointIndex];
        const index = this.draggedObject.controlPointIndex;
        const oppositeIndex = index === 1 ? 2: 1;

        // Since control points are relative to their base curve points, we need to calculate their absolute world position
        // This way we can snap them to the grid and then recalculate the relative to base curve point in its local coords
        const worldAbsoluteControlPoint = this.schemeContainer.worldPointOnItem(
            curvePoint.x + this.draggedObjectOriginalPoint[`x${index}`] + localPoint.x - localOriginalPoint.x,
            curvePoint.y + this.draggedObjectOriginalPoint[`y${index}`] + localPoint.y - localOriginalPoint.y,
            this.item
        );
        const snappedWorldAbsoluteCurvePoint = {
            x: this.snapX(worldAbsoluteControlPoint.x),
            y: this.snapY(worldAbsoluteControlPoint.y)
        };
        const snappedLocalAbsoluteCurvePoint = this.schemeContainer.localPointOnItem(snappedWorldAbsoluteCurvePoint.x, snappedWorldAbsoluteCurvePoint.y, this.item);
        
        curvePoint[`x${index}`] = snappedLocalAbsoluteCurvePoint.x - curvePoint.x;
        curvePoint[`y${index}`] = snappedLocalAbsoluteCurvePoint.y - curvePoint.y;
        
        if (!(event.metaKey || event.ctrlKey || event.shiftKey)) {
            curvePoint[`x${oppositeIndex}`] = -curvePoint[`x${index}`];
            curvePoint[`y${oppositeIndex}`] = -curvePoint[`y${index}`];
        }
        this.eventBus.emitItemChanged(this.item.id);
        StoreUtils.updateCurveEditPoint(this.store, this.draggedObject.pointIndex, curvePoint);
        this.schemeContainer.readjustItem(this.item.id, IS_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
    }

    submitItem() {
        if (this.item.shapeProps.points.length < 2) {
            this.schemeContainer.deleteItem(this.item);
            this.schemeContainer.reindexItems();
            this.reset();
            return;
        }

        this.schemeContainer.readjustItem(this.item.id, IS_NOT_SOFT, ITEM_MODIFICATION_CONTEXT_DEFAULT);
        this.eventBus.$emit(this.eventBus.SWITCH_MODE_TO_EDIT);
        this.eventBus.emitItemChanged(this.item.id);
        this.eventBus.emitSchemeChangeCommited();
        this.schemeContainer.reindexItems();
        this.schemeContainer.selectItem(this.item);
        this.reset();
    }

    detachSource() {
        this.item.shapeProps.sourceItem = null;
        this.schemeContainer.reindexItems();
    }

    detachDestination() {
        this.item.shapeProps.destinationItem = null;
        this.schemeContainer.reindexItems();
    }

    dragScreen(x, y) {
        this.schemeContainer.screenTransform.x = Math.floor(this.originalScreenOffset.x + x - this.originalClickPoint.x);
        this.schemeContainer.screenTransform.y = Math.floor(this.originalScreenOffset.y + y - this.originalClickPoint.y);
    }

    selectByBoundaryBox(box, inclusive, mx, my) {
        const viewportBox = {
            x: this.originalClickPoint.mx,
            y: this.originalClickPoint.my,
            w: mx - this.originalClickPoint.mx,
            h: my - this.originalClickPoint.my
        };

        // normalizing box
        if (viewportBox.w < 0) {
            viewportBox.x += viewportBox.w;
            viewportBox.w = Math.abs(viewportBox.w);
        }
        if (viewportBox.h < 0) {
            viewportBox.y += viewportBox.h;
            viewportBox.h = Math.abs(viewportBox.h);
        }

        if (!inclusive) {
            StoreUtils.resetCurveEditPointSelection(this.store);
        }

        forEach(this.item.shapeProps.points, (point, pointId) => {
            const wolrdPoint = this.schemeContainer.worldPointOnItem(point.x, point.y, this.item);
            
            let isInArea = false;
            if (this.item.area.type === 'viewport') {
                isInArea = myMath.isPointInArea(wolrdPoint.x, wolrdPoint.y, viewportBox);
            } else {
                isInArea = myMath.isPointInArea(wolrdPoint.x, wolrdPoint.y, box);
            }

            if (isInArea) {
                StoreUtils.selectCurveEditPoint(this.store, pointId, true);
            }
        });
    }
}
