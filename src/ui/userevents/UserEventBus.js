/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import {forEach} from '../collections';
import shortid from 'shortid';
import { Logger } from '../logger';

const log = new Logger('UserEventBus');

/**
 * This UserEventBus is used in order to track and handle events that emitted in interactive mode
 * when user interacts with elements
 */
export default class UserEventBus {
    constructor(editorId) {
        this.editorId = editorId;
        this.itemEventSubscribers = {};
        this.revision = shortid.generate();
    }

    subscribeItemEvent(itemId, itemName, eventName, callback) {
        if (!this.itemEventSubscribers.hasOwnProperty(itemId)) {
            this.itemEventSubscribers[itemId] = {};
        }

        if (!this.itemEventSubscribers[itemId].hasOwnProperty(eventName)) {
            this.itemEventSubscribers[itemId][eventName] = [];
        }

        this.itemEventSubscribers[itemId][eventName].push({itemName, callback});
    }

    emitItemEvent(itemId, eventName, ...args) {
        log.infoEvent(eventName, [itemId]);

        const itemSubs = this.itemEventSubscribers[itemId];
        if (itemSubs && itemSubs[eventName]) {
            forEach(itemSubs[eventName], subscriber => {
                try {
                    sendMessageToParentWindow({
                        type: 'schemio:item-event',
                        name : subscriber.itemName,
                        event: eventName,
                        args
                    });
                } catch(ex) {
                    console.error(ex);
                }
                subscriber.callback.apply(null, [this, this.revision, itemId, eventName, args]);
            });
        }
    }

    clear() {
        this.itemEventSubscribers = {}
        this.revision = shortid.generate();
    }

    clearEventsForItem(itemId) {
        if (this.itemEventSubscribers.hasOwnProperty(itemId)) {
            delete this.itemEventSubscribers[itemId];
        }
    }


    isActionAllowed(revision) {
        return this.revision === revision;
    }
};

function sendMessageToParentWindow(message) {
    if (window.parent != window) {
        window.parent.postMessage(message, '*');
    }
}