
import Compiler from '../../src/ui/userevents/Compiler.js';
import expect from 'expect';

const mockedUserEventBus = {
    isActionAllowed() {
        return true;
    }
}

describe('UserEvents Compiler', () => {
    it('should compile simple actions for items', () => {
        const compiler = new Compiler();
        const selfItem = {
            id: 'qwe',
            opacity: 1.0
        };
        const abcItem = {
            id: 'abc'
        };
        const schemeContainer = {
            findElementsBySelector(selector, selfItem2) {
                if (selector === 'self') {
                    return [ selfItem2 ];
                }
                if (selector === '#abc') {
                    return [ abcItem ];
                }
                throw new Error('Unknown selector');
            }
        };

        const action = compiler.compileActions(schemeContainer, selfItem, [{
            element: 'self',
            method: 'set',
            args: { field: 'opacity', value: 0.5}
        }, {
            element: '#abc',
            method: 'set',
            args: { field: 'shapeProps.strokeSize', value: 2}
        }, {
            element: '#abc',
            method: 'set',
            args: {field: 'shapeProps.text', value: 'Blah'}
        }]);

        action(mockedUserEventBus);

        expect(selfItem).toStrictEqual({
            id: 'qwe',
            opacity: 0.5
        });
        expect(abcItem).toStrictEqual({
            id: 'abc',
            shapeProps: {
                text: 'Blah',
                strokeSize: 2
            }
        });
    });


    it('should compile simple actions for item connectors', () => {
        const compiler = new Compiler();
        const selfItem = {
            id: 'qwe',
            opacity: 1.0,
            connectors: [{
                id: 'c1',
                style: { color: '#333' }
            }, {
                id: 'c2',
                style: { color: '#000' }
            }]
        };
        const abcItem = {
            id: 'abc',
            connectors: [{
                id: 'b1',
                style: { color: '#444' }
            }, {
                id: 'b2',
                style: { color: '#000' }
            }, {
                id: 'b3',
                style: { color: '#555' }
            }]
        };
        const schemeContainer = {
            findElementsBySelector(selector, selfItem) {
                if (selector === '#c1') {
                    return [ selfItem.connectors[0] ];
                }
                if (selector === '#b1') {
                    return [ abcItem.connectors[0] ];
                }
                if (selector === '#b2') {
                    return [ abcItem.connectors[1] ];
                }
            }
        };

        const action = compiler.compileActions(schemeContainer, selfItem, [{
            element: '#c1',
            method: 'set',
            args: { field: 'style.opacity', value: 0.5}
        }, {
            element: '#b1',
            method: 'set',
            args: {field: 'style.color', value: '#abc'}
        }, {
            element: '#b2',
            method: 'set',
            args: {field: 'style.color', value: '#f00'}
        }]);

        action(mockedUserEventBus);

        expect(selfItem).toStrictEqual({
            id: 'qwe',
            opacity: 1.0,
            connectors: [{
                id: 'c1',
                style: { color: '#333', opacity: 0.5 }
            }, {
                id: 'c2',
                style: { color: '#000' }
            }]
        });
        expect(abcItem).toStrictEqual({
            id: 'abc',
            connectors: [{
                id: 'b1',
                style: { color: '#abc' }
            }, {
                id: 'b2',
                style: { color: '#f00' }
            }, {
                id: 'b3',
                style: { color: '#555' }
            }]
        });
    });



    it('should compile actions for item groups', () => {
        const compiler = new Compiler();
        const selfItem = {id: 'self-item-id'};
        const items = [{
            id: 'qwe',
            opacity: 1.0
        }, {
            id: 'zxc',
            opacity: 0.6
        }, {
            id: 'ert',
            opacity: 1.0
        }];
        const schemeContainer = {
            findElementsBySelector(selector, selfItem) {
                if (selector === 'group: my-group') {
                    return [items[0], items[1]];
                } else if (selector === 'group: another-group') {
                    return [items[2]];
                }
                return [];
            }
        };

        const action = compiler.compileActions(schemeContainer, selfItem, [{
            element: 'group: my-group',
            method: 'set',
            args: { field: 'opacity', value: 0.5}
        }, {
            element: 'group: another-group',
            method: 'set',
            args: { field: 'someField', value: 'blah'}
        }]);

        action(mockedUserEventBus);

        expect(items).toStrictEqual([{
            id: 'qwe',
            opacity: 0.5
        }, {
            id: 'zxc',
            opacity: 0.5
        }, {
            id: 'ert',
            opacity: 1.0,
            someField: 'blah'
        }]);
    });
});