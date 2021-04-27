import myMath from "../../../../../myMath";

function computePath(item) {
    const w = item.area.w;
    const h = item.area.h;
    const s = myMath.clamp(item.shapeProps.skew, 0, w / 3);
    const cy = h/2;
    return `M ${s} 0 L ${w-s} 0 L ${w} ${cy} L ${w-s} ${h} L ${s} ${h} L 0 ${cy} Z`;
}

function makeSkewControlPoint(item) {
    return {
        x: item.area.w - myMath.clamp(item.shapeProps.skew, 0, item.area.w/3),
        y: 0
    };
}

export default {
    shapeConfig: {
        shapeType: 'standard',

        id: 'uml_preparation',

        menuItems: [{
            group: 'UML',
            name: 'Preparation',
            iconUrl: '/assets/images/items/uml-preparation.svg',
        }],

        computePath(item) {
            return computePath(item);
        },

        controlPoints: {
            make(item, pointId) {
                if (!pointId) {
                    return {
                        skew: makeSkewControlPoint(item),
                    };
                } else if (pointId === 'skew') {
                    return makeSkewControlPoint(item);
                }
            },
            handleDrag(item, controlPointName, originalX, originalY, dx, dy) {
                if (controlPointName === 'skew') {
                    item.shapeProps.skew = myMath.clamp(item.area.w - originalX - dx, 0, item.area.w/3);
                }
            }
        },

        args: {
            skew: {type: 'number', value: 20, name: 'Skew'},
        },
    }
}


