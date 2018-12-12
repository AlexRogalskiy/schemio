import EventBus from '../EventBus.js';

class State {
    constructor(editor) {
        this.editor = editor;
        this.name = '';
    }

    reset() {}

    // invoked when user cancels the state (e.g. press Esc key)
    cancel() {
        this.reset();
        EventBus.$emit(EventBus.CANCEL_CURRENT_STATE);
    }

    mouseDown(localX, localY, originalX, originalY, item, event) {}
    mouseUp(localX, localY, originalX, originalY, item, event) {}
    mouseMove(localX, localY, originalX, originalY, item, event) {}

    shouldHandleItemHover() {return true;}
    shouldHandleItemMouseDown() {return true;}
    shouldHandleItemMouseUp() {return true;}

    itemHovered(item) {}
    itemLostFocus(item) {}
}

export default State;
