import EventBus from "../../components/editor/EventBus";
import Shape from "../../components/editor/items/shapes/Shape";
import myMath from "../../myMath";

export default {
    name: 'Move along path',
    args: {
        item            : {name: 'Item',              type: 'element',value: null},
        path            : {name: 'Path',              type: 'element',value: null},
        rotateItem      : {name: 'Rotate item',       type: 'boolean',value: false, description: 'Adjust rotation of the item to path'},
        rotationOffset  : {name: 'Rotation offset',   type: 'number', value: 0, description: 'Rotation angle offset', depends: {rotateItem: true}},
    },

    // the following fields are going to be used in animation tracks
    inputs: {
        distance: {name: 'Distance (%)', type: 'number', value: 0, endValue: 100},
    },

    // this function is supposed to prepare object that would be passed into execute function
    // if null is returned then the function preparation was not successfull
    create(args, schemeContainer) {
        const item = schemeContainer.findFirstElementBySelector(args.item);
        if (!item) {
            return null;
        }

        const pathItem = schemeContainer.findFirstElementBySelector(args.path);
        if (!pathItem) {
            return null;
        }

        const shape = Shape.find(pathItem.shape);
        if (!shape) {
            return null;
        }

        const path = schemeContainer.getSvgOutlineOfItem(pathItem);
        if (!path) {
            return null;
        }
        return {
            path,
            item,
            pathItem,
            schemeContainer,
            totalLength: path.getTotalLength(),
            rotateItem: args.rotateItem,
            rotationOffset: args.rotationOffset
        };
    },

    getFullName(args, schemeContainer) {
        const nameOfItem = (selector) => {
            const item = schemeContainer.findFirstElementBySelector(selector);
            if (item) {
                return item.name;
            }
            return 'unknown';
        }

        const itemName = nameOfItem(args.item);
        const pathItemName = nameOfItem(args.path);
        return `Move "${itemName}" along the path of "${pathItemName}"`;
    },

    // the first argument is the object returned by the "create" function
    // the second argument is an object containing the inputs
    execute({path, item, pathItem, schemeContainer, totalLength, rotateItem, rotationOffset}, {distance}) {
        const length = distance * totalLength / 100;
        const point = path.getPointAtLength(length);
        let worldPoint = schemeContainer.worldPointOnItem(point.x, point.y, pathItem);

        if (rotateItem) {
            const nextPoint = path.getPointAtLength(length + 2);
            const worldNextPoint = schemeContainer.worldPointOnItem(nextPoint.x, nextPoint.y, pathItem);
            const Vx = worldNextPoint.x - worldPoint.x;
            const Vy = worldNextPoint.y - worldPoint.y;
            const dSquared = Vx * Vx + Vy * Vy;
            if (!myMath.tooSmall(dSquared)) {
                const d = Math.sqrt(dSquared);

                const vx = Vx / d;
                const vy = Vy / d;
                const angle = myMath.fullAngleForNormalizedVector(vx, vy) * 180 / Math.PI;

                item.area.r = angle;
                
                if (isFinite(rotationOffset)) {
                    item.area.r += rotationOffset;
                };
            }
        }

        // bringing transform back from world to local so that also works correctly for sub-items
        let localPoint = worldPoint;
        if (item.meta && item.meta.parentId) {
            const parentItem = schemeContainer.findItemById(item.meta.parentId);
            if (parentItem) {
                localPoint = schemeContainer.localPointOnItem(worldPoint.x, worldPoint.y, parentItem);
            }
        }
        const p0 = schemeContainer.worldPointOnItem(0, 0, item);
        const pc = schemeContainer.worldPointOnItem(item.area.w/2, item.area.h/2, item);
        const dx = pc.x - p0.x;
        const dy = pc.y - p0.y;

        item.area.x = localPoint.x - dx;
        item.area.y = localPoint.y - dy;


        schemeContainer.reindexItemTransforms(item);
        EventBus.emitItemChanged(item.id);
    }
}