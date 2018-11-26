import State from './State.js';

/*
This state works as dragging the screen, zooming, selecting elements and dragging selected elements
*/
const NOTHING = 0;
const DRAG_SCREEN = 1;
const DRAG_ITEM = 2;
class StateDragging extends State {
    constructor(editor) {
        super(editor);
        this.schemeContainer = editor.schemeContainer;
        this.state = NOTHING;
        this.initialClickPoint = null;
        this.originalOffset = {x:0, y: 0};
        this.originalZoom = 1.0;
    }

    mouseDown(x, y, event){
        this.initScreenDrag(x, y);
    }

    itemMouseDown(item, x, y, event) {
        if (item.type !== 'image') {
            this.schemeContainer.selectItem(item, false);
            this.editor.onSelectItem(item);
            this.editor.$forceUpdate();
            return false;
        }
        return true;
    }

    initScreenDrag(x, y) {
        this.state = DRAG_SCREEN;
        this.initialClickPoint = {x, y};
        this.originalOffset = {x: this.editor.vOffsetX, y: this.editor.vOffsetY};
        this.originalZoom = this.editor.vZoom;
    }

    mouseUp(x, y, event) {
        if (this.state === DRAG_SCREEN) {
            if (Math.abs(x - this.initialClickPoint.x) + Math.abs(y - this.initialClickPoint.y) < 3) {
                this.schemeContainer.deselectAllItems();
                this.editor.onDeselectAllItems();
            }
            this.state = NOTHING;
            this.dragScreen(x, y);
            this.initialClickPoint = null;
        }
    }

    mouseMove(x, y, event) {
        if (this.state === DRAG_SCREEN && this.initialClickPoint) {
            this.dragScreen(x, y);
        }
    }


    dragScreen(x, y) {
        this.editor.vOffsetX = Math.floor(this.originalOffset.x + x - this.initialClickPoint.x);
        this.editor.vOffsetY = Math.floor(this.originalOffset.y + y - this.initialClickPoint.y);
        this.editor.$forceUpdate();
    }
}

export default StateDragging;
