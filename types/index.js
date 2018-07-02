"use strict";
/*
*	Types modules.
*	Contain all new interface for the entire program
*/
Object.defineProperty(exports, "__esModule", { value: true });
function isStringMap(obj) {
    if (typeof (obj) != 'object')
        return false;
    for (let key in obj) {
        if (typeof (key) != 'string')
            return false;
        if (typeof (obj[key]) != 'string')
            return false;
    }
    return true;
}
exports.isStringMap = isStringMap;
