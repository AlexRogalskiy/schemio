import Vue from 'vue';
import NoneShape from './NoneShape.js';
import Rect from './Rect.js';
import Overlay from './Overlay.vue';
import Ellipse from './Ellipse.js';
import Link from './Link.vue';
import Curve from './Curve.vue';
import Comment from './Comment.js';
import FramePlayer from './FramePlayer.vue';
import CodeBlock from './CodeBlock.vue';
import Button from './Button.vue';
import NPoly from './NPoly.js';
import Bracket from './Bracket.js';
import Dummy from './Dummy.vue';
import UMLObject from './uml/UMLObject.js';
import UMLModule from './uml/UMLModule.js';
import UMLPackage from './uml/UMLPackage.js';
import UMLNode from './uml/UMLNode.js';
import mapValues from 'lodash/mapValues';
import keys from 'lodash/keys';
import myMath from '../../../../myMath.js';


const _zeroTransform = {x: 0, y: 0, r: 0};

function defaultGetEventsFunc(item) {
    return [];
}

const defaultEditorProps = {
    description: 'rich',
    onlyEditMode: false,
    ignoreEventLayer: false,
    customTextRendering: false
};

const standardShapeProps = {
    fill         : {name: 'Fill', type: 'advanced-color'},
    strokeColor  : {name: 'Stroke', type: 'color'},
    strokeSize   : {name: 'Stroke Size', type: 'number'},
    strokePattern: {name: 'Stroke Pattern', type: 'stroke-pattern'}
};


function defaultGetTextSlots(item) {
    return [{
        name: 'body',
        area: {x: 0, y: 0, w: item.area.w, h: item.area.h}
    }];
}

function worldPointOnItem(x, y, item) {
    return myMath.worldPointInArea(x, y, item.area, (item.meta && item.meta.transform) ? item.meta.transform : _zeroTransform);
}

function defaultGetSnappers(item) {
    const p1 = worldPointOnItem(0, 0, item);
    const p2 = worldPointOnItem(item.area.w, 0, item);
    const p3 = worldPointOnItem(item.area.w, item.area.h, item);
    const p4 = worldPointOnItem(0, item.area.h, item);

    const snappers = [];

    if (item.area.w > 0.0001) {
        if (Math.abs(p1.y - p2.y) < 0.0001) {
            snappers.push({
                item,
                snapperType: 'horizontal',
                value: p1.y
            });
        }
    }
    return snappers;
}

function enrichShape(shapeComponent, shapeName) {
    if (!shapeComponent.shapeType) {
        console.error(`Missing shapeType for shape "${shapeName}"`);
    }
    return {
        shapeType               : shapeComponent.shapeType,
        editorProps             : shapeComponent.editorProps || defaultEditorProps,
        args                    : shapeComponent.args,
        computePath             : shapeComponent.computePath,
        computeOutline          : shapeComponent.computeOutline || shapeComponent.computePath,
        readjustItem            : shapeComponent.readjustItem,
        getTextSlots            : shapeComponent.getTextSlots || defaultGetTextSlots,
        getEvents               : shapeComponent.getEvents || defaultGetEventsFunc,
        controlPoints           : shapeComponent.controlPoints || null,

        // used for generating item snapers which are used for snapping dragged item to other items
        getSnappers             : shapeComponent.getSnappers || defaultGetSnappers,
        vueComponent            : shapeComponent.shapeType === 'vue'? shapeComponent: null,

        argType(argName) {
            if (this.args && this.args[argName]) {
                return this.args[argName].type;
            }
            if (this.shapeType === 'standard') {
                if (standardShapeProps[argName]) {
                    return standardShapeProps[argName].type;
                }
            }
            return null;
        }
    };
}

const shapeRegistry = mapValues({
    none: NoneShape,
    rect: Rect,
    ellipse: Ellipse,
    overlay: Overlay,
    comment: Comment,
    frame_player: FramePlayer,
    curve: Curve,
    link: Link,
    npoly: NPoly,
    bracket: Bracket,
    button: Button,
    dummy: Dummy,
    uml_object: UMLObject,
    uml_module: UMLModule,
    uml_package: UMLPackage,
    uml_node: UMLNode,
    code_block: CodeBlock
}, enrichShape);

/**
 * Generates a component and returns it's name
 * @param {string} encodedShape - an encoded JSON that represents a shape or a name of a in-buit shape: e.g. 'rect', 'ellipse'
 */
function make(encodedShape) {
    if (shapeRegistry[encodedShape]) {
        const shape = shapeRegistry[encodedShape];

        if (!shape.component && !shape.vueComponentName) {
            const componentName = `${encodedShape}-shape-svg-component`;
            Vue.component(componentName, {
                props: ['item'],
                template: shape.template
            })
            shape.vueComponentName = componentName;
        }
        return shape;
    } else {
        throw new Error('Custom shapes are not yet supported');
    }
}

function getShapePropDescriptor(shape, propName) {
    if (shape.shapeType === 'standard') {
        if (standardShapeProps.hasOwnProperty(propName)) {
            return standardShapeProps[propName];
        }
    }
    if (shape.args && shape.args.hasOwnProperty(propName)) {
        return shape.args[propName];
    }

    return null;
}

export default {
    make,
    shapeRegistry,
    getShapeIds() {
        return keys(shapeRegistry);
    },
    find(id) {
        return shapeRegistry[id];
    },
    standardShapeProps,
    getShapePropDescriptor
};
