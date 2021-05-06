import map from 'lodash/map';
import forEach from 'lodash/forEach';
import AdvancedFill from '../AdvancedFill.vue';
import myMath from '../../../../myMath';

function connectPoints(p1, p2) {
    if (p1.t === 'L' && p2.t === 'B') {
        return `Q ${p2.x1+p2.x} ${p2.y1+p2.y} ${p2.x} ${p2.y} `;
    } else if (p1.t === 'B' && p2.t === 'L') {
        return `Q ${p1.x2+p1.x} ${p1.y2+p1.y} ${p2.x} ${p2.y} `;
    } else if (p1.t === 'B' && p2.t === 'B') {
        return `C ${p1.x2+p1.x} ${p1.y2+p1.y} ${p2.x1+p2.x} ${p2.y1+p2.y} ${p2.x} ${p2.y} `;
    }
    return `L ${p2.x} ${p2.y} `;
}

export function computeCurvePath(points, closed) {
    if (points.length < 2) {
        return null;
    }
    let path = 'M 0 0';

    let prevPoint = null;

    forEach(points, point => {
        if (!prevPoint) {
            path = `M ${point.x} ${point.y} `;
        } else if (!point.break) {
            path += connectPoints(prevPoint, point);
        } else {
            path += `M ${point.x} ${point.y} `;
        }
        prevPoint = point;
    });

    if (closed && points.length) {
        path += connectPoints(points[points.length - 1], points[0]);
        path += ' Z';
    }

    return path;
};

function convertCurvePointsToItemScale(area, scale, points) {
    return map(points, point => {
        if (point.t === 'B') {
            return {
                t: 'B',
                x: area.w * point.x / scale,
                y: area.h * point.y / scale,
                x1: area.w * point.x1 / scale,
                y1: area.h * point.y1 / scale,
                x2: area.w * point.x2 / scale,
                y2: area.h * point.y2 / scale,
            }
        } else {
            return {
                t: 'L',
                x: area.w * point.x / scale,
                y: area.h * point.y / scale,
            }
        }
    });
}

function createComputeOutlineFunc(shapeConfig) {
    return (item) => {
        if (shapeConfig.outlineCurve && shapeConfig.outlineCurve.points && shapeConfig.outlineCurve.points.length > 0) {
            const points = convertCurvePointsToItemScale(item.area, shapeConfig.scale, shapeConfig.outlineCurve.points);
            return computeCurvePath(points, shapeConfig.outlineCurve.closed);
        } else {
            const w = item.area.w;
            const h = item.area.h;
            return `M  0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
        }
    };
}

export function convertCurveForRender(item, shapeConfig, curveDef) {
    const points = convertCurvePointsToItemScale(item.area, shapeConfig.scale, curveDef.points);
    let fill = 'none';
    if (curveDef.fillArg === 'fill') {
        fill = AdvancedFill.computeStandardFill(item);
    } else if (curveDef.fillArg === 'none') {
        fill = 'none';
    } else if (curveDef.fillArg) {
        const otherFill = item.shapeProps[curveDef.fillArg];
        // for now advanced-color is not supported
        if (typeof otherFill === 'string') {
            fill = otherFill;
        }
    }
    
    return {
        path: computeCurvePath(points, curveDef.closed),
        fill,
        strokeColor: item.shapeProps.strokeColor,
        strokeSize: myMath.roundPrecise2(item.shapeProps.strokeSize * curveDef.strokeSize)
    };
}

function createComputeCurvesFunc(shapeConfig) {
    return (item) => {
        if (shapeConfig.curves) {
            return map(shapeConfig.curves, curve => convertCurveForRender(item, shapeConfig, curve));
        }
        return [];
    }
}

function createGetPinsFunc(shapeConfig) {
    return (item) => {
        if (shapeConfig.pins) {
            const w = item.area.w;
            const h = item.area.h;
            return map(shapeConfig.pins, pin => {
                const calculatedPin = {
                    x: pin.x * w / shapeConfig.scale, 
                    y: pin.y * h / shapeConfig.scale, 
                };

                if (pin.hasOwnProperty('nx') && pin.hasOwnProperty('ny')) {
                    calculatedPin.nx = pin.nx;
                    calculatedPin.ny = pin.ny;
                }
                return calculatedPin;
            });
        } else {
            return [{
                x: item.area.w/2,
                y: item.area.h/2
            }];
        }
    };
}

/**
 * Takes shape definition JSON which is generated by shape exporter and converts it into a shape component
 * @param {Object} shapeDef 
 */
export function convertStandardCurveShape(shapeDef) {
    return {
        shapeConfig: {
            id: shapeDef.shapeConfig.id,

            shapeType: 'standard',

            menuItems: shapeDef.shapeConfig.menuItems,

            computeOutline: createComputeOutlineFunc(shapeDef.shapeConfig),

            // standard-curves do not use computePath function but instead they rely on generateCurves function
            // since each curve might have its own fill and stroke
            computeCurves: createComputeCurvesFunc(shapeDef.shapeConfig),

            getPins: createGetPinsFunc(shapeDef.shapeConfig),

            args: {
                fill         : {type: 'advanced-color', value: {type: 'solid', color: 'rgba(255,255,255,1)'}, name: 'Fill'},
                strokeColor  : {type: 'color', value: '#111111', name: 'Stroke color'},
                strokePattern: {type: 'stroke-pattern', value: 'solid', name: 'Stroke pattern'},
                strokeSize   : {type: 'number', value: 2, name: 'Stroke Size'},
            }
        }
    };
}