/*
*	Types modules. 
*	Contain all new interface for the entire program
*/

// stringMap type interface
export interface stringMap { [s: string] : string; }

export function isStringMap(obj: any): obj is stringMap {
    if(typeof(obj) != 'object') return false;

    for(let key in obj){
        if(typeof(key) != 'string') return false;

        if(typeof(obj[key]) != 'string') return false;
    }
    return true;
}


export interface msg {
	type: string,
	value: string,
	data: stringMap
}

// Job serialized interface
export interface jobSerialInterface {
	workDir?: string,
	id?: string,
	cmd?: string,
	script?: string,
	exportVar?: stringMap,
	modules?: string[],
	tagTask?: string,
	scriptHash: string,
	inputHash?: stringMap
	[key: string] : any
}

// Constraints interface
export interface jobSerialConstraints {
	workDir?: string,
	cmd?: string | null,
	script?: string | null,
	exportVar?: stringMap | null,
	modules?: string[] | null,
	tagTask?: string | null,
	scriptHash?: string | null,
	inputHash?: stringMap | null,
	[key: string] : any
}

// Simple interface for nano query
export interface query {
	selector: any
}
