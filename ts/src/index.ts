/*
	Main file of the warehouse microservice.
	This allow the user to add some job into a couchDB database.
	Some options must be specified into the command line to run this microservice (see options parts). 
*/

// Required packages
import deepEqual = require('deep-equal');
import EventEmitter = require('events');
import fs = require('fs');
import glob = require('glob');
import jsonfile = require('jsonfile');
import nanoDB = require('nano');
import program = require('commander');
// Required modules
import * as dbMod from './lib/db-module';
import server = require('./wh-server');
import * as types from './types/index';
import win = require('./lib/logger');

/*
* Variable initialisation.
* #index : false by default. Becomes true if user specifiec the indexation option.
* #pathConfig : contain the path to the config file. User must specified the path in command line.
* #emitter : instance of EventEmitter class.
* #nameDB : give the name of the database.
* #nano : connection to database with logs.
*/
let index: boolean = false;
let pathConfig: any;
let emitter: EventEmitter = new EventEmitter();
let nameDB: string = "warehouse"; // TO DO put in config file?
let nano = nanoDB('http://vreymond:couch@localhost:5984'); // TO DO put in config file
let bean: any = null;
let port: number;
/*
* Commander package that simplify the usage of commands line.
*/
program
  .option('-c, --config <path>', 'Load config file')
  .option('-i, --index', 'Run indexation of cache directories')
  .option('-p, --port <port>', 'Run server on specific port')
  .option('-v, --verbose <level>', 'Specified the verbose level (debug, info, success, warning, error, critical)') 
  .parse(process.argv);

/*
* This is an options check part. 
* 3 questions are asked:
*	- if config	(1)
*		config is the most important one. It specified the path of the config file. This file contains important
*		variables to the smooth operation of this program. If not config file specified, the program throw an error.
*	- if verbose (2)
*		verbose is assigned with the logger.js file (./lib/logger.js). With this option, it allows the user
*		to modifiy the lower level of the logger. The level string can be specified in lower or upper case.
*	- if index (3)
*		this option ask the program to run the indexation feature.
*/
if (program.config && program.config != "") { // (1)
	pathConfig = program.config;

	if (program.verbose){ // (2)
		let upper: string = program.verbose.toUpperCase();		// change loglevel string into upper case (to match logger specifications)
		if (win.levels.hasOwnProperty(upper)){					 
			win.logger.level = upper;
		}
		else {
			win.logger.log('WARNING', `No key ${upper} found in logger.levels. Using the default INFO level`);
		}
	} 

	try{
		bean = jsonfile.readFileSync(pathConfig);			// parsing config.file content // add try catch
	}
	catch(err){
		win.logger.log('ERROR', 'while readding and parsing the config file');
		throw err;
	}
}
else{
	throw win.logger.log('WARNING', 'No config file specified'); // config file must be specified.
}

if (program.index) { // (3)
	if (bean.hasOwnProperty('previousCacheDir')){
		index = true;
	}
	else{
		win.logger.log('WARNING', 'No "previousCacheDir" key found in config file');
	}
} 
else{
	win.logger.log('INFO', 'No indexation asked');
}

if(program.port && program.port != "") port = program.port;

if (bean.hasOwnProperty('databaseName')) nameDB = bean.databaseName;
		

/*
* couchDB database creation part. 
* First, we check if a database with the name specified already exists. If yes,
* this databse will be destroy before creating the new one (with the same name).
*/
nano.db.destroy(nameDB, function(err: any) {
	if (err && err.statusCode != 404){
		win.logger.log('ERROR', 'Destroying ' + nameDB +' database')
		throw err;
	}

	nano.db.create(nameDB, function(err: any) {
		if (err){
			win.logger.log('ERROR', 'during creation of the database \'' + nameDB + '\' :')
			throw err;
		}
		win.logger.log('SUCCESS', 'Database ' + nameDB + ' created' + '\n')
		emitter.emit('created'); 	// emit the event 'created' when done
	})
})

// Once the database created, and if the index option is specified, we start the indexation.
emitter.on('created', () => {
	if (index) indexation(bean.previousCacheDir);
	console.log("created")
	// TO DO: Case when port is used
	//starting express server
	server.startServerExpress();
	//starting socket server + listeners
	server.startServerSocket().on('findBySocket', (packet: any) => {
		constraintsCall(packet.data(), 'socket').on('socketSucceed', (docsArray: types.objMap[]) => {
			packet.data(docsArray);
			server.push('find', packet = packet);
		})
		.on('socketNoResults', (docsArray: types.objMap[]) => {
			packet.data(docsArray);
			server.push('notFind', packet = packet);
		})
		.on('socketFailed', (error) => {
			packet.data(error);
			server.push('error', packet = packet);
		})
	})
})

/*
* function that manage the call to the constraintsToQuery function. This part is listening on three event 
* returned by the constraintsToQuery event: "docsFound", "noDocsFound" and "errorOnConstraints"
* @constraints : constraints to check 
* @connectType : specify wich connection type
*/
export function constraintsCall(constraints: types.jobConstr, connectType: string) : EventEmitter {

	let emitterCall: EventEmitter = new EventEmitter()
	// if docs found in couchDB database
	constraintsToQuery(constraints).on('docsFound', (docsResults) => {
		win.logger.log('INFO', `Found ${docsResults.docs.length} docs for those constraints from ${connectType} request`);
		win.logger.log('DEBUG', `Doc list found \n ${JSON.stringify(docsResults)}`);
		win.logger.log('DEBUG', `constraints: ${JSON.stringify(constraints)}`);
		emitterCall.emit(`${connectType}Succeed`, docsResults.docs);
	})
	// if docs not found in couchDB database
	.on('noDocsFound', (docsResults) => {
		win.logger.log('INFO', `No docs founds for constraints`)
		win.logger.log('DEBUG', `constraints: \n ${JSON.stringify(constraints)}`)
		emitterCall.emit(`${connectType}NoResults`, docsResults.docs);
	})
	// if an error occured
	.on('errorOnConstraints', (err) => {
		win.logger.log('WARNING', `Constraints are empty or not in the right format`)
		emitterCall.emit(`${connectType}Failed`, err);
	})

	return emitterCall;
}

/*
* Indexation goal is to retrieve the array of caches directory. Find all jobID.json file with their IDs,
* and add them into couchDB database.
* @cacheArray : represent the previousCacheDir key content from the config file, which is paths of all cache directory.
* #dataToCouch : array that will contain all jobID.json file that attempt to be add inside the couchDB database.
* #pathResult : list of all jobID.json path found in all caches directory.
*/
function indexation(cacheArray: string[]) : void{
	let pathResult: string[] = globCaches(cacheArray);
	// TO DO: check is jobID.json is empty file, or if {}
	
	// Adding "_id" key to all jobID.json content from pathResult.
	// directorySearch function return the name of the directory (uuid) that contain the jobID.json file.
	let dataToCouch: types.jobID[] = [];
	for (let path of pathResult) {
		let result: types.jobID | null = addIDtoDoc(path, directorySearch(path));
		result && dataToCouch.push(result); // this method remove "0" but we don't have "0" so it's OK
		//res || true || dataToCouch.push(res); will stop when a true found
	}
	//let dataToCouch: types.jobID[] = pathResult.filter((elem) => addIDtoDoc(elem, directorySearch(elem)));
	//let dataToCouch: types.jobID[] = dataToFilter.filter(function(n) { return n != undefined; });

	win.logger.log('DEBUG', 'Number of jobID.json content in list: ' + dataToCouch.length + '\n' + JSON.stringify(dataToCouch) + '\n')
	// TO DO add logger size too big
	dbMod.addToDB(dataToCouch,nameDB).on('addSucceed', () => {
		emitter.emit('indexDone');
	})
}

/*
* Function that manage the indexing of an array of caches path directory
* @pathsArray: array of strings which contain cache directory paths.
* #deepIndex : result of glob package (array of array).
* #mergedIndex : transforminf array of array into a simple array.
*/
function globCaches(pathsArray: string[]) : string[]{
	let deepIndex: any = [];
	let mergedIndex: string[];

	// checking that previousCacheDir content is an array
	if (!Array.isArray(pathsArray)){
		throw  win.logger.log('WARNING', 'previousCacheDir variable from config file is not an Array')

	}
	//checking if pathsArray contains some empty string. If yes, we do not considerate them.
	if(pathsArray.includes('')){
		let indexToRemove = pathsArray.map((e, i) => e === "" ? i : '').filter(String);
		pathsArray = pathsArray.filter(function(element){return element !== ''})
	}

	// finding pattern of jobID.json inside cache path
	for (let element in pathsArray){
		deepIndex.push(glob.sync(pathsArray[element] + "/**/jobID\.json", {follow : true}));
		win.logger.log('INFO', deepIndex[element].length + ' jobID.json file(s) found in directory ' + pathsArray[element])
	}

	// merged array of array into simple array of all path that contain a jobID.json file
	mergedIndex = [].concat.apply([], deepIndex);
	win.logger.log('DEBUG', 'List of all jobID.json file(s) found: ' + '\n' + JSON.stringify(mergedIndex) + '\n');

	return mergedIndex;
}

/*
* Function that returned the uuid of the directory that contains the jobID.json file
* @directoryPath : path to the directory that contain a jobID.json file, waiting to be inserted in couchDB
* #uuidregexV4 : regex that check if uuid is written in V4.
* #uuidArray : array that contai all uuid find in one path.
* #uuidDir : contain the last uuid of a uuidArray, that means it is the directory (uuid) that contains the jobID.json file.
*/
function directorySearch(directoryPath: string): string{

	let uuidregexV4 = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/ig
	let uuidArray: any = directoryPath.match(uuidregexV4);
	let uuidDir: any = null;

	win.logger.log('DEBUG', 'List of all uuid pattern inside a jobID.json path: ' + '\n' + JSON.stringify(uuidArray) + '\n')
	if (uuidArray != null){
		uuidDir = uuidArray.pop()  // retrieving the last element of uuidArray
	}
	else{
		win.logger.log('WARNING', 'No uuid key found in: ' + directoryPath);
	}

	win.logger.log('DEBUG', 'uuid of the directory that contain a jobID.json file ' + uuidDir);
	return uuidDir
}

/*
* Function that add an '_id' key to a jobID.json file content.
* @path : the path of the jobID.json file
* @uuid : the uuid of the directory that contain the jobID.json file.
* #file : content of a jobID.json file.
*/
function addIDtoDoc(path: string, uuid: string) : types.jobID | null {
	let file: types.jobID;
	//TO DO, some checks???

	try{
		file = jsonfile.readFileSync(path);
	}
	catch(err){
		win.logger.log('WARNING', ' while reading the json file ' + path + ' : \n' + err)
		return null;
	}

	if (Array.isArray(file)) console.log('toto')
	file["_id"] = uuid;

	return file;
}


/*
* Function that accept constraints in json format and will transform them into nano query for couchDB.
* @constraints : json that contain some constraints.
* @either : optional parameter. If true, change the request to a "or" request. At least one of contrainsts must match (not strict equality)
* (1) : checking parts. Empty json, array or false value
* (2) : if either variable is true, adding "$or" key to the query
* (3) : query builder using a map function. "$and" and "$eq" are implicit here, we dont necessary need those operande to build the query.
* 	(3.1) : If strict equality (either = false), we want to ckeck if a constraints with a value null exists in the doc. If not, the doc is
*			not returned.
*	(3.2) : When a constraints value is equal to an objMap. 2 possibilities:
*				- If either, then adding a "$in" structure inside the "$or" array
*				- Else, simply add the "$in" structure inside the "elem" (constraints) key
*			If elem is not an objMap type, we do the same thing without the "$in" structure
* (4) : listener on testRequest function. This function accept the query builded with constraintsToQuery.
*/
function constraintsToQuery(constraints: types.jobConstr, either: boolean = false) : EventEmitter{
	let constEmitter : EventEmitter = new EventEmitter;
	let query: types.query = {"selector": {}};
	let strConstr = JSON.stringify(constraints);
	let sel: any = query.selector;

	if (strConstr === JSON.stringify({}) || strConstr === JSON.stringify([])){
		let error: string = 'Empty constraints json or array given'
		win.logger.log('WARNING', error);
		constEmitter.emit('errorOnConstraints')
		return constEmitter;
	} // (1)

	if (!constraints){
		let error: string = 'Constraints value is evaluated to false, maybe empty object or empty string'
		win.logger.log('WARNING', error);
		constEmitter.emit('errorOnConstraints')
		return constEmitter;
	} // (1)

	if(either) sel["$or"] = [] // (2)

	Object.keys(constraints).map(elem => { //(3)
		if(constraints[elem] === null){
			if(!either) sel[elem] = {"$exists": true} // (3.1)
			return; // if constraints is null then we jump to the next iteration of the map => will return any value on this key
		} 

		if(types.isObjMap(constraints[elem])){ // (3.2)
			either ? sel.$or.push({[elem]: {"$in": [constraints[elem]]}}) : sel[elem] = {"$in": [constraints[elem]]}
		}
		else{
			either ? sel.$or.push({[elem]: constraints[elem]}) : sel[elem] = constraints[elem]
		}
	});

	win.logger.log('DEBUG', 'query: ' + JSON.stringify(query))

	dbMod.testRequest(query, nameDB).on('requestDone', (data) => { // (4)
		if(!data.docs.length) {
			constEmitter.emit('noDocsFound', data)
		}
		else{
			constEmitter.emit('docsFound', data)
		}
	})
	.on('requestError', (err) => {
		constEmitter.emit('errorOnConstraints', err);
	})
	return constEmitter;
}


//constraints tests

//let constraints: any = {"script": "/home/mgarnier/taskObject_devTests/install_from_git/hextask/./data/run_hex.sh"};
// let constraints: any = {"script": null, "coreScript": "ed28514366b623c47c67802cd0194943","exportVar": {
//     "hexFlags": " -nocuda -ncpu 16 ",
//     "hexScript": "/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
//   }};
// let constraints : any = {"script": null, "coreScript": "7b8459fdb1eee409262251c429c48814",
//   "inputs": {
//     "file1.inp": "7726e41aaafd85054aa6c9d4747dec7b"
//   }}

emitter.on('indexDone', (log) => {
	win.logger.log('INFO', 'Event occured')
})











