/*
*	Types modules. 
*	Contain all new interface for the entire program
*/
import { logger, setLogLevel } from "../lib/logger";

// stringMap type interface
export interface stringMap { [s: string] : any; }

export function isStringMap (obj: any): obj is stringMap {
    if (typeof(obj) != 'object') return false;

    for (let key in obj){
        if (typeof(key) != 'string') return false;

        if (typeof(obj[key]) != 'string') return false;
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

export interface clientConfig {
	warehouseAddress: string,
	portSocket: number
}

export function isClientConfig(obj: any): obj is clientConfig{
	if (typeof(obj) != 'object') {
		logger.log('error', `Client config content is not an "object" type`);
		return false;
	}
	if (Object.keys(obj).length !== 2) {
		logger.log('error', `Number of keys is not correct: ${Object.keys(obj).length} given, 2 expected`);
		return false;
	} 
	if (!obj.hasOwnProperty('warehouseAddress')) {
		logger.log('error', `Missing key in config server file: "warehouseAddress"`);
		return false;
	}
	if (!obj.hasOwnProperty('portSocket')) {
		logger.log('error', `Missing key in config server file: "portSocket"`);
		return false;
	}

	for (let key in obj){
		if (typeof(key) != 'string') {
			logger.log('error', `Key "${key}" is not a string format`);
			return false;
		}
		if (key === 'portSocket'){
			if (typeof(obj[key]) != 'number') {
				logger.log('error', `Key "${key}" value is not a number format`);
				return false;
			}
		}
		else {
			if (typeof(obj[key]) != 'string') {
				logger.log('error', `Key "${key}" value is not a string format`);
				return false;
			}
		}
	}

	return true;
}

export interface serverConfig {
	previousCacheDir: string[],
	accountDBName: string,
	password: string,
	databaseName: string,
	databaseAddress: string,
	portCouch: number,
	portExpress: number,
	portSocket: number,
	warehouseAddress: string
}

export function isServerConfig(obj: any): obj is serverConfig{
	if (typeof(obj) !== 'object') {
		logger.log('error', `Server config content is not an "object" type`);
		return false;
	}
	if (Object.keys(obj).length !== 9) {
		logger.log('error', `Number of keys is not correct: ${Object.keys(obj).length} given, 9 expected`);
		return false;
	} 
	if (!obj.hasOwnProperty('previousCacheDir')) {
		logger.log('error', `Missing key in config server file: "previousCacheDir"`);
		return false;
	}
	if (!obj.hasOwnProperty('accountDBName')) {
		logger.log('error', `Missing key in config server file: "accountDBName"`);
		return false;
	}
	if (!obj.hasOwnProperty('password')) {
		logger.log('error', `Missing key in config server file: "password"`);
		return false;
	}
	if (!obj.hasOwnProperty('databaseName')) {
		logger.log('error', `Missing key in config server file: "databaseName"`);
		return false;
	}
	if (!obj.hasOwnProperty('databaseAddress')) {
		logger.log('error', `Missing key in config server file: "databaseAddress"`);
		return false;
	}
	if (!obj.hasOwnProperty('portCouch')) {
		logger.log('error', `Missing key in config server file: "portCouch"`);
		return false;
	}
	if (!obj.hasOwnProperty('portExpress')) {
		logger.log('error', `Missing key in config server file: "portExpress"`);
		return false;
	}
	if (!obj.hasOwnProperty('portSocket')) {
		logger.log('error', `Missing key in config server file: "portSocket"`);
		return false;
	}
	if (!obj.hasOwnProperty('warehouseAddress')) {
		logger.log('error', `Missing key in config server file: "warehouseAddress"`);
		return false;
	}

	for (let key in obj){
		if (typeof(key) != 'string') {
		logger.log('error', `Key "${key}" is not a string format`);
		return false;
	}
		if (key === 'portCouch' || key === 'portExpress' || key === 'portSocket'){
			if (typeof(obj[key]) != 'number') {
				logger.log('error', `Key "${key}" value is not a number format`);
				return false;
			}
		}
		else if (key === 'previousCacheDir'){
			if (!Array.isArray(obj[key])) {
				logger.log('error', `Key "${key}" value is not an array format`);
				return false;
			}
		}
		else{
			if (typeof(obj[key]) != 'string') {
				logger.log('error', `Key "${key}" value is not a string format`);
				return false;
			}
		}
	}

	return true;
}
