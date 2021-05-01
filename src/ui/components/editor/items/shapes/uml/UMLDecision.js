function computePath(item) {
    const w = item.area.w;
    const h = item.area.h;
    return `M ${w/2} 0  L ${w} ${h/2}  L ${w/2} ${h}  L 0 ${h/2} Z`;
}

export default {
    shapeConfig: {
        shapeType: 'standard',

        id: 'uml_decision',

        menuItems: [{
            group: 'UML',
            name: 'Decision',
            iconUrl: '/assets/images/items/uml-decision.svg',
        }],

        computePath(item) {
            return computePath(item);
        },

        getPins(item) {
            const w = item.area.w;
            const h = item.area.h;
            return [{
                x: w/2, y: h/2,
            }, {
                x: w / 2, y: 0,
                nx: 0, ny: -1
            }, {
                x: w / 2, y: h,
                nx: 0, ny: 1
            }, {
                x: 0, y: h/2,
                nx: -1, ny: 0
            }, {
                x: w, y: h/2,
                nx: 1, ny: 0
            }];
        },

        args: { },
    }
}
