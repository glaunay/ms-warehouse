"use strict";
/*
*	Types modules.
*	Contain all new interface for the entire program
*/
Object.defineProperty(exports, "__esModule", { value: true });
// Function that test if an object is a dictionary
function isObjMap(obj) {
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
exports.isObjMap = isObjMap;
