import State from './State.js';
import EventBus from '../EventBus.js';

/*
This state works as dragging the screen, zooming, selecting elements
*/
class StateDragging extends State {
    constructor(editor) {
        super(editor);
        this.schemeContainer = editor.schemeContainer;
        this.startedDragging = false;
        this.initialClickPoint = null;
        this.originalOffset = {x:0, y: 0};
        this.originalZoom = 1.0;
    }

    reset() {
        this.startedDragging = false;
    }

    mouseDown(x, y, mx, my, event){
        this.initScreenDrag(mx, my);
    }

    itemMouseDown(item, x, y, event) {
        if (item.type !== 'image') {
            this.schemeContainer.selectItem(item, false);
            EventBus.$emit(EventBus.ITEM_SELECTED, item);
            return false;
        }
        return true;
    }

    initScreenDrag(x, y) {
        this.startedDragging = true;
        this.initialClickPoint = {x, y};
        this.originalOffset = {x: this.editor.vOffsetX, y: this.editor.vOffsetY};
        this.originalZoom = this.editor.vZoom;
    }

    mouseUp(x, y, mx, my, event) {
        if (this.startedDragging && this.initialClickPoint) {
            if (Math.abs(mx - this.initialClickPoint.x) + Math.abs(my - this.initialClickPoint.y) < 3) {
                this.schemeContainer.deselectAllItems();
                this.editor.onDeselectAllItems();
            }
            this.dragScreen(mx, my);
            this.initialClickPoint = null;
            this.startedDragging = false;
        }
    }

    mouseMove(x, y, mx, my, event) {
        if (this.startedDragging && this.initialClickPoint) {
            this.dragScreen(mx, my);
        }
    }


    dragScreen(x, y) {
        this.editor.vOffsetX = Math.floor(this.originalOffset.x + x - this.initialClickPoint.x);
        this.editor.vOffsetY = Math.floor(this.originalOffset.y + y - this.initialClickPoint.y);
        this.editor.$forceUpdate();
    }
}

export default StateDragging;
