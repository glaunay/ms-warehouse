/*
*	Types modules. 
*	Contain all new interface for the entire program
*/

// Interfac to define a dictionary type
export interface objMap { [key: string] : string }

export interface msg {
	type: string,
	value: string,
	data: objMap
}

// jobID type
//interface jobID_notNull {
export interface jobID {
	cmd?: string,
	script: string,
	exportVar: {},
	modules: string[],
	tagTask: string,
	coreScript: string, // value is hash
	inputs: objMap, // contain file name as key and hash pattern as value
	_id?: string
}

//add job serialized extends from jobID

// Interface for the job constraints. Every key are optional
export interface jobConstr{
	cmd?: string,
	script?: string | null,
	exportVar?: {} | null,
	modules?: string[] | null,
	tagTask?: string | null,
	coreScript?: string | null, // value is hash // remove corescript
	inputs?: objMap | null,
	[key: string] : any // to avoid index signature problem(type has an implicitely 'any' type)
	// add _id key???
}

// Simple interface for nano query
export interface query {
	selector: any
}

// Function that test if an object is a dictionary
export function isObjMap(obj: any): obj is objMap {
	if(typeof(obj) != 'object') return false;
	 
	for(let key in obj){
		if(typeof(key) != 'string') return false;
		 
		if(typeof(obj[key]) != 'string') return false;
	}
	return true;
}



