import State from './State.js';
import EventBus from '../EventBus.js';

export default class StateConnecting extends State {
    constructor(editor) {
        super(editor);
        this.name = 'connecting';
        this.component = null;
        this.schemeContainer = editor.schemeContainer;
        this.sourceItem = null;
        this.hoveredItem = null;
    }

    reset() {
        this.sourceItem = null;
        this.hoveredItem = null;
    }

    mouseMove(x, y, mx, my, item, event) {
        if (item && (item.type === 'component' || item.type === 'overlay')) {
            this.hoveredItem = item;
        } else {
            this.hoveredItem = null;
        }
    }

    mouseDown(x, y, mx, my, item, event) {
        if (item && (item.type === 'component' || item.type === 'overlay')) {
            if (this.sourceItem && this.sourceItem !== item) {
                this.schemeContainer.connectItems(this.sourceItem, item);
                this.reset();
                EventBus.$emit(EventBus.SWITCH_MODE_TO_EDIT);
            } else {
                this.sourceItem = item;
            }
        }
    }

    setSourceItem(item) {
        this.sourceItem = item;
    }
}
