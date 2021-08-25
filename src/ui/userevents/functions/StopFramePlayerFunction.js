export default {
    name: 'Stop Frame Player',
    
    description: 'Stops currently running animation in specified frame player',

    supportedShapes: ['frame_player'],

    execute(item, args, schemeContainer, userEventBus, resultCallback) {
        if (!item) {
            resultCallback();
            return;
        }
        const frameAnimation = schemeContainer.getFrameAnimation(item.id);
        if (!frameAnimation) {
            resultCallback();
            return;
        }

        frameAnimation.enabled = false;
        resultCallback();
    }
}
