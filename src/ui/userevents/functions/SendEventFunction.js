
export default {
    name: 'Show',
    args: {
        event: {name: 'Event', type: 'string', value: 'Unknown event...'},
    },

    execute(item, args, schemeContainer, userEventBus, resultCallback) {
        userEventBus.emitItemEvent(item.id, args.event, []);
        resultCallback();
    }
}