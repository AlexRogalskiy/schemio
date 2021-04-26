import myMath from "../../../../../myMath";


const maxSkewRatioToHeight = 3;

function makeSkewControlPoint(item) {
    return {
        x: item.area.w - myMath.clamp(item.shapeProps.skew, 0, item.area.w/maxSkewRatioToHeight) * 2,
        y: item.area.h/2
    };
}

export default {
    shapeConfig: {
        shapeType: 'standard',

        computePath(item) {
            const   w = item.area.w,
                    h = item.area.h,
                    s = myMath.clamp(item.shapeProps.skew, 0, item.area.w/maxSkewRatioToHeight),
                    d = s / 2,
                    k = item.area.h / 4,
                    cy = h / 2;

            return `M ${w-s} ${h} L ${s} ${h}  Q 0 ${h-k} 0 ${cy}  Q 0 ${k} ${s} 0 L ${w-s} 0 Q ${w} ${k} ${w} ${cy} Q ${w} ${h-k} ${w-s} ${h} Q ${w-2*s} ${h-k} ${w-2*s} ${cy} Q ${w-2*s} ${k} ${w-s} 0`;

        },

        computeOutline(item) {
            const   w = item.area.w,
                    h = item.area.h,
                    s = myMath.clamp(item.shapeProps.skew, 0, item.area.w/maxSkewRatioToHeight),
                    d = s / 2,
                    k = item.area.h / 4,
                    cy = h / 2;

            return `M ${w-s} ${h} L ${s} ${h}  Q 0 ${h-k} 0 ${cy}  Q 0 ${k} ${s} 0 L ${w-s} 0 Q ${w} ${k} ${w} ${cy} Q ${w} ${h-k} ${w-s} ${h}`;
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
                    item.shapeProps.skew = myMath.clamp((item.area.w - originalX - dx) / 2, 0, item.area.w/maxSkewRatioToHeight);
                }
            }
        },

        args: {
            skew: {type: 'number', value: 20, name: 'Skew'},
        },
    }
}

