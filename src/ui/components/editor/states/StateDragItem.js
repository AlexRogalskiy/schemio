import State from './State.js';
import EventBus from '../EventBus.js';
import _ from 'lodash';

export default class StateDragItem extends State {
    constructor(editor) {
        super(editor);
        this.name = 'drag-item';
        this.schemeContainer = editor.schemeContainer;
        this.originalPoint = {x: 0, y: 0};
        this.startedDragging = true;
        this.selectedConnector = null;
        this.selectedRerouteId = -1;
        this.sourceItem = null; // source item for a connector
        this.multiSelectBox = null;
    }

    reset() {
        this.startedDragging = false;
        this.selectedConnector = null;
        this.selectedRerouteId = -1;
        this.dragger = null;
        this.sourceItem = null;
        this.multiSelectBox = null;
    }

    initDraggingForItem(item, x, y) {
        this.originalPoint.x = x;
        this.originalPoint.y = y;
        item.meta.itemOriginalArea = {
            x: item.area.x,
            y: item.area.y,
            w: item.area.w,
            h: item.area.h
        };
        this.startedDragging = true;
    }

    initDraggingForReroute(sourceItem, connector, rerouteId, x, y) {
        this.originalPoint.x = x;
        this.originalPoint.y = y;
        this.startedDragging = true;
        this.selectedConnector = connector;
        this.selectedRerouteId = rerouteId;
        this.sourceItem = sourceItem;
    }

    mouseDown(x, y, mx, my, object, event) {
        if (object.dragger) {
            this.dragger = object.dragger;
            this.initDraggingForItem(object.dragger.item, x, y);
            return;
        } else if (object.connector) {
            if (event.metaKey || event.ctrlKey) {
                if (object.rerouteId >= 0) {
                    object.connector.reroutes.splice(object.rerouteId, 1);
                    this.schemeContainer.buildConnector(object.sourceItem, object.connector);
                    EventBus.$emit(EventBus.REDRAW_CONNECTOR, object.connector);
                } else {
                    var rerouteId = this.schemeContainer.addReroute(x, y, object.sourceItem, object.connector);
                    this.initDraggingForReroute(object.sourceItem, object.connector, rerouteId, x, y);
                    EventBus.$emit(EventBus.REDRAW_CONNECTOR, object.connector);
                }
            } else {
                this.schemeContainer.selectConnector(object.sourceItem, object.connectorIndex, false);
                this.schemeContainer.deselectAllItems();
                EventBus.$emit(EventBus.ALL_ITEMS_DESELECTED, object.connector);
                EventBus.$emit(EventBus.CONNECTOR_SELECTED, object.connector);
                EventBus.$emit(EventBus.REDRAW);
                EventBus.$emit(EventBus.REDRAW_CONNECTOR);
                if (object.rerouteId >= 0) {
                    this.initDraggingForReroute(object.sourceItem, object.connector, object.rerouteId, x, y);
                }
            }
        } else if (object.item) {
            this.initDraggingForItem(object.item, x, y);

            if (!object.item.meta.selected) {
                this.schemeContainer.selectItem(object.item, event.metaKey || event.ctrlKey);
                this.schemeContainer.deselectAllConnectors();
                EventBus.$emit(EventBus.ITEM_SELECTED, object.item);
                EventBus.$emit(EventBus.ALL_CONNECTORS_DESELECTED, object.item);
            }
        } else {
            this.initMulitSelectBox(x, y);
        }
    }

    mouseMove(x, y, mx, my, object, event) {
        if (this.startedDragging) {
            if (event.buttons === 0) {
                // this means that no buttons are actually pressed, so probably user accidentally moved mouse out of view and released it, or simply clicked right button
                this.reset();
            } else {
                if (this.dragger && !this.dragger.item.locked) {
                    this.dragByDragger(this.dragger.item, this.dragger.dragger, x, y);
                } else if (this.schemeContainer.selectedItems.length > 0) {
                    var dx = x - this.originalPoint.x,
                        dy = y - this.originalPoint.y;
                    _.forEach(this.schemeContainer.selectedItems, item => {
                        this.dragItem(item, dx, dy);
                    });
                    EventBus.$emit(EventBus.REDRAW);
                } else if (this.selectedConnector && this.selectedRerouteId >= 0) {
                    this.dragReroute(x, y);
                }
            }
        } else if (this.multiSelectBox) {
            if (x > this.originalPoint.x) {
                this.multiSelectBox.x = this.originalPoint.x;
                this.multiSelectBox.w = x - this.originalPoint.x;
            } else {
                this.multiSelectBox.x = x;
                this.multiSelectBox.w = this.originalPoint.x - x;
            }
            if (y > this.originalPoint.y) {
                this.multiSelectBox.y = this.originalPoint.y;
                this.multiSelectBox.h = y - this.originalPoint.y;
            } else {
                this.multiSelectBox.y = y;
                this.multiSelectBox.h = this.originalPoint.y - y;
            }
            EventBus.$emit(EventBus.MULTI_SELECT_BOX_APPEARED, this.multiSelectBox);
        }
    }

    mouseUp(x, y, mx, my, object, event) {
        if (this.multiSelectBox) {
            this.schemeContainer.selectByBoundaryBox(this.multiSelectBox, event.metaKey || event.ctrlKey);
        }
        if (event.doubleClick && object.connector) {
            if (object.rerouteId >= 0) {
                object.connector.reroutes.splice(object.rerouteId, 1);
                this.schemeContainer.buildConnector(object.sourceItem, object.connector);
                EventBus.$emit(EventBus.REDRAW_CONNECTOR, object.connector);
            } else {
                var rerouteId = this.schemeContainer.addReroute(x, y, object.sourceItem, object.connector);
                EventBus.$emit(EventBus.REDRAW_CONNECTOR, object.connector);
            }
        }
        this.reset();
    }

    initMulitSelectBox(x, y) {
        this.originalPoint.x = x;
        this.originalPoint.y = y;
        this.multiSelectBox = {x, y, w: 0, h: 0};
    }

    dragItem(item, dx, dy) {
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            item.area.x = item.meta.itemOriginalArea.x + dx;
            item.area.y = item.meta.itemOriginalArea.y + dy;

            this.rebuildItemConnectors(item);
        }
    }

    dragReroute(x, y) {
        var dx = x - this.originalPoint.x;
        var dy = y - this.originalPoint.y;

        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            this.selectedConnector.reroutes[this.selectedRerouteId].x = x;
            this.selectedConnector.reroutes[this.selectedRerouteId].y = y;
            if (this.sourceItem) {
                this.schemeContainer.buildConnector(this.sourceItem, this.selectedConnector);
            }
            EventBus.$emit(EventBus.REDRAW_CONNECTOR, this.selectedConnector);
        }
    }

    dragByDragger(item, dragger, x, y) {
        var nx = item.area.x;
        var ny = item.area.y;
        var nw = item.area.w;
        var nh = item.area.h;

        var change = 0;

        _.forEach(dragger.edges, edge => {
            if (edge === 'top') {
                var dy = y - dragger.y;
                change += Math.abs(dy);
                ny = item.meta.itemOriginalArea.y + dy;
                nh = item.meta.itemOriginalArea.h - dy;
            } else if (edge === 'bottom') {
                var dy = y - dragger.y;
                change += Math.abs(dy);
                nh = item.meta.itemOriginalArea.h + dy;
            } else if (edge === 'left') {
                var dx = x - dragger.x;
                change += Math.abs(dx);
                nx = item.meta.itemOriginalArea.x + dx;
                nw = item.meta.itemOriginalArea.w - dx;
            } else if (edge === 'right') {
                var dx = x - dragger.x;
                change += Math.abs(dx);
                nw = item.meta.itemOriginalArea.w + dx;
            }
        });
        if (change > 0) {
            this.rebuildItemConnectors(item);
        }
        if (nw > 0 && nh > 0) {
            item.area.x = nx;
            item.area.y = ny;
            item.area.w = nw;
            item.area.h = nh;
        }
    }

    //TODO optimize it to not search for all connectors every time. This could be done on init drag
    rebuildItemConnectors(item) {
        _.forEach(item.connectors, connector => {
            this.schemeContainer.buildConnector(item, connector);
            EventBus.$emit(EventBus.REDRAW_CONNECTOR, connector);
        });
        _.forEach(this.schemeContainer.getConnectingSourceItemIds(item.id), sourceId => {
            var sourceItem = this.schemeContainer.findItemById(sourceId);
            if (sourceItem) {
                _.forEach(sourceItem.connectors, connector => {
                    this.schemeContainer.buildConnector(sourceItem, connector);
                    EventBus.$emit(EventBus.REDRAW_CONNECTOR, connector);
                });
            }
        });
    }
}
