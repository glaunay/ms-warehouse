"use strict";
/*
    Main file of the warehouse microservice.
    This allow the user to add some job into a couchDB database.
    Some options must be specified into the command line to run this microservice (see options parts).
*/
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const glob = require("glob");
const jsonfile = require("jsonfile");
const nanoDB = require("nano");
const program = require("commander");
// Required modules
const dbMod = __importStar(require("./lib/db-module"));
const win = require("./lib/logger");
/*
* Variable initialisation.
* #index : false by default. Becomes true if user specifiec the indexation option.
* #pathConfig : contain the path to the config file. User must specified the path in command line.
* #emitter : instance of EventEmitter class.
* #nameDB : give the name of the database.
* #nano : connection to database with logs.
*/
let index = false;
let pathConfig;
let emitter = new EventEmitter();
let nameDB = "warehouse"; // TO DO put in config file?
let nano = nanoDB('http://vreymond:couch@localhost:5984'); // TO DO put in config file
let bean = null;
/*
* Commander package that simplify the usage of commands line.
*/
program
    .option('-c, --config <path>', 'Load config file')
    .option('-i, --index', 'Run indexation of cache directories')
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
if (program.config && program.config != "") {
    pathConfig = program.config;
    if (program.verbose) {
        let upper = program.verbose.toUpperCase(); // change loglevel string into upper case (to match logger specifications)
        if (win.levels.hasOwnProperty(upper)) {
            win.logger.level = upper;
        }
        else {
            win.logger.log('WARNING', 'No key ' + upper + ' found in logger.levels. Using the default INFO level');
        }
    }
    try {
        bean = jsonfile.readFileSync(pathConfig); // parsing config.file content // add try catch
    }
    catch (err) {
        win.logger.log('ERROR', 'while readding and parsing the config file');
        throw err;
    }
}
else {
    throw win.logger.log('WARNING', 'No config file specified'); // config file must be specified.
}
if (program.index) {
    if (bean.hasOwnProperty('previousCacheDir')) {
        index = true;
    }
    else {
        win.logger.log('WARNING', 'No "previousCacheDir" key found in config file');
    }
}
else {
    win.logger.log('INFO', 'No indexation asked');
}
if (bean.hasOwnProperty('databaseName'))
    nameDB = bean.databaseName;
/*
* couchDB database creation part.
* First, we check if a database with the name specified already exists. If yes,
* this databse will be destroy before creating the new one (with the same name).
*/
nano.db.destroy(nameDB, function (err) {
    if (err && err.statusCode != 404) {
        win.logger.log('ERROR', 'Destroying ' + nameDB + ' database');
        throw err;
    }
    nano.db.create(nameDB, function (err) {
        if (err) {
            win.logger.log('ERROR', 'during creation of the database \'' + nameDB + '\' :');
            throw err;
        }
        win.logger.log('SUCCESS', 'Database ' + nameDB + ' created' + '\n');
        emitter.emit('created'); // emit the event 'created' when done
    });
});
// Once the database created, and if the index option is specified, we start the indexation.
emitter.on('created', () => {
    if (index)
        indexation(bean.previousCacheDir);
});
/*
* Indexation goal is to retrieve the array of caches directory. Find all jobID.json file with their IDs,
* and add them into couchDB database.
* @cacheArray : represent the previousCacheDir key content from the config file, which is paths of all cache directory.
* #dataToCouch : array that will contain all jobID.json file that attempt to be add inside the couchDB database.
* #pathResult : list of all jobID.json path found in all caches directory.
*/
function indexation(cacheArray) {
    let pathResult = globCaches(cacheArray);
    // TO DO: check is jobID.json is empty file, or if {}
    // Adding "_id" key to all jobID.json content from pathResult.
    // directorySearch function return the name of the directory (uuid) that contain the jobID.json file.
    let dataToCouch = [];
    for (let path of pathResult) {
        let result = addIDtoDoc(path, directorySearch(path));
        result && dataToCouch.push(result); // this method remove "0" but we don't have "0" so it's OK
        //res || true || dataToCouch.push(res); will stop when a true found
    }
    //let dataToCouch: types.jobID[] = pathResult.filter((elem) => addIDtoDoc(elem, directorySearch(elem)));
    //let dataToCouch: types.jobID[] = dataToFilter.filter(function(n) { return n != undefined; });
    win.logger.log('DEBUG', 'Number of jobID.json content in list: ' + dataToCouch.length + '\n' + JSON.stringify(dataToCouch) + '\n');
    // TO DO add logger size too big
    dbMod.addToDB(dataToCouch, nameDB).on('addSucceed', () => {
        emitter.emit('indexDone');
    });
}
/*
* Function that manage the indexing of an array of caches path directory
* @pathsArray: array of strings which contain cache directory paths.
* #deepIndex : result of glob package (array of array).
* #mergedIndex : transforminf array of array into a simple array.
*/
function globCaches(pathsArray) {
    let deepIndex = [];
    let mergedIndex;
    // checking that previousCacheDir content is an array
    if (!Array.isArray(pathsArray)) {
        throw win.logger.log('WARNING', 'previousCacheDir variable from config file is not an Array');
    }
    //checking if pathsArray contains some empty string. If yes, we do not considerate them.
    if (pathsArray.includes('')) {
        let indexToRemove = pathsArray.map((e, i) => e === "" ? i : '').filter(String);
        pathsArray = pathsArray.filter(function (element) { return element !== ''; });
    }
    // finding pattern of jobID.json inside cache path
    for (let element in pathsArray) {
        deepIndex.push(glob.sync(pathsArray[element] + "/**/jobID\.json", { follow: true }));
        win.logger.log('INFO', deepIndex[element].length + ' jobID.json file(s) found in directory ' + pathsArray[element]);
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
function directorySearch(directoryPath) {
    let uuidregexV4 = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/ig;
    let uuidArray = directoryPath.match(uuidregexV4);
    let uuidDir = null;
    win.logger.log('DEBUG', 'List of all uuid pattern inside a jobID.json path: ' + '\n' + JSON.stringify(uuidArray) + '\n');
    if (uuidArray != null) {
        uuidDir = uuidArray.pop(); // retrieving the last element of uuidArray
    }
    else {
        win.logger.log('WARNING', 'No uuid key found in: ' + directoryPath);
    }
    win.logger.log('DEBUG', 'uuid of the directory that contain a jobID.json file ' + uuidDir);
    return uuidDir;
}
/*
* Function that add an '_id' key to a jobID.json file content.
* @path : the path of the jobID.json file
* @uuid : the uuid of the directory that contain the jobID.json file.
* #file : content of a jobID.json file.
*/
function addIDtoDoc(path, uuid) {
    let file;
    //TO DO, some checks???
    try {
        file = jsonfile.readFileSync(path);
    }
    catch (err) {
        win.logger.log('WARNING', ' while reading the json file ' + path + ' : \n' + err);
        return null;
    }
    if (Array.isArray(file))
        console.log('toto');
    file["_id"] = uuid;
    return file;
}
/*
* Function that accept constraints in json format and will transform them into nano query for couchDB.
* @constraints : json that contain some constraints.
TO DO: - interface on constraints, (all optionals) : parameter given to the func
       - Object.keys(constraints).length === 0 instead of case 1
       - instead of case 2: Array.isArray(constraints)
* Case 3: undefined, null, empty string, false are evaluated to false
*/
function constraintsToQuery(constraints) {
    let query = { "selector": {} };
    switch (true) {
        case JSON.stringify(constraints) === JSON.stringify({}):
            win.logger.log('WARNING', 'Empty constraints json given');
            constraints = null;
            break;
        case JSON.stringify(constraints) === JSON.stringify([]):
            win.logger.log('WARNING', 'Constraints must be a json object not an array');
            constraints = null;
            ;
            break;
        case constraints == false:
            win.logger.log('WARNING', 'Constraints value is evaluated to false, maybe empty object or empty string');
            constraints = null;
            break;
        default:
            console.log('ok');
            // "$and" and "$eq" are implicit here, we dont necessary need those operande to build the query.
            Object.keys(constraints).map(elem => query.selector[elem] = constraints[elem]);
            /* Query test file inputs property. ===> doesnt work now
            query = {"selector": {
                "$and": [
                {
                    "script": {
                        "$eq": "/home/mgarnier/taskObject_devTests/install_from_git/hextask/./data/run_hex.sh"
                    }
                },
                {
                    "inputs": {
                        "$and": [{
                            "file1.inp": {
                                "$eq" : "c8892c5bbc35bb60ab7cb6eba57b05a8"
                            }
                        },
                        {
                            "file2.inp": {
                                "$eq" : "87cb7dce13ea9b3c6885ade04eb242c5"
                            }
                        }
                        ]
                    }
                }
                ]
            }
        }
        */
            //console.log(query)
            break;
    }
    return query;
}
function testRequest(query) {
    // just to test if the query work with constraints
    nano.request({ db: nameDB,
        method: 'POST',
        doc: '_find',
        body: query
    }, function (err, data) {
        console.log('------------');
        console.log(data); //console.log(result)
        console.log('------------');
    });
}
//constraints tests
//let constraints: any = {"script": "/home/mgarnier/taskObject_devTests/install_from_git/hextask/./data/run_hex.sh"};
//let constraints: any = {"script": "/home/mgarnier/taskObject_devTests/install_from_git/hextask/./data/run_hex.sh", "coreScript": "ed28514366b623c47c67802cd0194943"};
//testRequest(constraintsToQuery(constraints))
emitter.on('indexDone', (log) => {
    win.logger.log('INFO', 'Event occured');
});
