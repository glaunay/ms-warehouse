/*
*	Types modules. 
*	Contain all new interface for the entire program
*/

// jobID type
//interface jobID_notNull {
export interface jobID {
	script: string,
	exportVar: {},
	modules: string[],
	tagTask: string,
	coreScript: string, // value is hash
	inputs: {
		[key:string] : string // value is hash
	},
	_id?: string
}

//export type jobID = null | jobID_notNull



