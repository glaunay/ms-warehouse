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
/*
    Old interfaces version of jobID and Constraints
*/
// // jobID type
// //interface jobID_notNull {
// export interface jobID {
// 	cmd?: string,
// 	script: string,
// 	exportVar: {},
// 	modules: string[],
// 	tagTask: string,
// 	coreScript: string, // value is hash
// 	inputs: objMap, // contain file name as key and hash pattern as value
// 	_id?: string
// }
// // Interface for the job constraints. Every key are optional
// export interface jobConstr{
// 	cmd?: string,
// 	script?: string | null,
// 	exportVar?: {} | null,
// 	modules?: string[] | null,
// 	tagTask?: string | null,
// 	coreScript?: string | null, // value is hash // remove corescript
// 	inputs?: objMap | null,
// 	[key: string] : any // to avoid index signature problem(type has an implicitely 'any' type)
// 	// add _id key???
// }
