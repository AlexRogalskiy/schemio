import { defaultifyObject, enrichObjectWithDefaults } from '../../defaultify';
import { defaultifyItem } from './Item';
import map from 'lodash/map';

const defaultScheme = {
    styles: {
        backgroundColor:    'rgba(240, 240, 240, 1.0)',
        gridColor:          'rgba(128 ,128, 128, 0.2)',
        boundaryBoxColor:   'rgba(36, 182, 255, 0.8)'
    }
};


export function enrichSchemeWithDefaults(scheme) {
    enrichObjectWithDefaults(scheme, defaultScheme);
}

export function defaultifyScheme(scheme) {
    const resultedScheme = defaultifyObject(scheme, defaultScheme);
    
    resultedScheme.items = map(resultedScheme.items, item => defaultifyItem(item));
    return resultedScheme;
}
