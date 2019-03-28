import Vue from 'vue';
import _ from 'lodash';

const EventBus = new Vue({
    data() {
        return {
            START_CREATING_COMPONENT: 'start-creating-component',
            START_CONNECTING_ITEM: 'start-connecting-item',
            PLACE_ITEM: 'place-item',
            CANCEL_CURRENT_STATE: 'cancel-current-state',
            REDRAW: 'redraw', //TODO get rid of this event. instead listen to item-changed, connector-changed event and redraw properly
            REDRAW_ITEM: 'redraw-item', //TODO get rid of this event.
            REDRAW_CONNECTOR: 'redraw-connector',  //TODO get rid of this event.
            ACTIVE_ITEM_SELECTED: 'active-item-selected',
            ALL_ITEMS_DESELECTED: 'all-items-deselected',
            CONNECTOR_SELECTED: 'connector-selected',
            ALL_CONNECTORS_DESELECTED: 'all-connectors-deselected',
            KEY_PRESS: 'key-press',
            BRING_TO_VIEW: 'bring-to-view',
            SWITCH_MODE_TO_EDIT: 'switch-mode-edit', //TODO rename it to MODE_CHANGED and pass the value of the mode

            MULTI_SELECT_BOX_APPEARED: 'multi-select-box-appeared',
            MULTI_SELECT_BOX_DISAPPEARED: 'multi-select-box-diappeared',

            ITEM_CHANGED: 'item-changed',
            CONNECTOR_CHANGED: 'connector-changed',
            SCHEME_PROPERTY_CHANGED: 'scheme-property-changed',

            KEY: {
                ESCAPE: 'escape',
                DELETE: 'delete',
                CTRL_C: 'ctrl-c',
                CTRL_V: 'ctrl-v',
                CTRL_S: 'ctrl-s',
                UP: 'up',
                DOWN: 'down',
                LEFT: 'left',
                RIGHT: 'right'
            }
        };
    },
    methods: {
        emitRedrawConnector(sourceItemId, destinationId) {
            this.$emit(this._generateRedrawConnectorEventName(sourceItemId, destinationId));
        },
        subscribeForRedrawConnector(sourceItemId, destinationId, callback) {
            this.$on(this._generateRedrawConnectorEventName(sourceItemId, destinationId), callback);
        },
        unsubscribeForRedrawConnector(sourceItemId, destinationId, callback) {
            this.$off(this._generateRedrawConnectorEventName(sourceItemId, destinationId), callback);
        },
        _generateRedrawConnectorEventName(sourceItemId, destinationId) {
            return `${EventBus.REDRAW_CONNECTOR}/${sourceItemId}/${destinationId}`;
        },

        emitRedrawItem(itemId) {
            this.$emit(this._generateRedrawItemEventName(itemId));
        },
        subscribeForRedrawItem(itemId, callback) {
            this.$on(this._generateRedrawItemEventName(itemId), callback);
        },
        unsubscribeForRedrawItem(itemId, callback) {
            this.$off(this._generateRedrawItemEventName(itemId), callback);
        },
        _generateRedrawItemEventName(itemId) {
            return `${EventBus.REDRAW_ITEM}/${itemId}`;
        }
    }
});

const keyMap = {};
keyMap[EventBus.KEY.ESCAPE] = event => event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27;
keyMap[EventBus.KEY.DELETE] = event => event.key === 'Backspace' || event.key === 'Delete' || event.keyCode === 8 || event.keyCode === 127;
keyMap[EventBus.KEY.CTRL_C] = event => event.key === 'c' && (event.metaKey || event.ctrlKey);
keyMap[EventBus.KEY.CTRL_V] = event => event.key === 'v' && (event.metaKey || event.ctrlKey);
keyMap[EventBus.KEY.CTRL_S] = event => event.key === 's' && (event.metaKey || event.ctrlKey);
keyMap[EventBus.KEY.LEFT] = event => event.key === 'ArrowLeft';
keyMap[EventBus.KEY.RIGHT] = event => event.key === 'ArrowRight';
keyMap[EventBus.KEY.UP] = event => event.key === 'ArrowUp';
keyMap[EventBus.KEY.DOWN] = event => event.key === 'ArrowDown';

function identifyKeyPress(event) {
    return _.findKey(keyMap, (check, keyName) => check(event));
}

document.onkeydown = function(event) {
    event = event || window.event;
    if (event.srcElement === document.body) {
        var key = identifyKeyPress(event);
        if (key) {
            EventBus.$emit(EventBus.KEY_PRESS, key, {
                ctrlCmdPressed: event.metaKey || event.ctrlKey
            });
        }
    }
}
export default EventBus;
