"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const jsonfile = require("jsonfile");
const EventEmitter = require("events");
const child_process_1 = require("child_process");
const index = __importStar(require("../index"));
const logger_1 = require("../lib/logger");
let dataToIndex = ["./test/cache_Dir_1", "./test/cache_Dir_2", "./test/cache_Dir_3"];
// Imitate a job content that will be insert in database
let dataToAdd = {
    "workDir": "/My/Path/To/Work/Directory",
    "script": "/My/Path/To/My/Script/script.sh",
    "exportVar": {
        "hexFlags": " -nocuda -ncpu 16 ",
        "hexScript": "/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
    },
    "modules": ["naccess", "hex"],
    "tagTask": "hex",
    "scriptHash": "4286ddd9-3fde-4fa4-b542-57980fbaabbe",
    "inputHash": {
        "file1.inp": "42386c2d-fd44-459c-a94f-d4af29485b4f",
        "file2.inp": "9e63443d-fc8f-49aa-9dc6-a7f8b15f0ceb"
    }
};
let dataConstraints = {
    "script": "/My/Path/To/My/Script/script.sh",
    "inputHash": {
        "file1.inp": "42386c2d-fd44-459c-a94f-d4af29485b4f",
        "file2.inp": "9e63443d-fc8f-49aa-9dc6-a7f8b15f0ceb"
    }
};
// Load dumping file to database
function startTests() {
    let emitter = new EventEmitter();
    logger_1.logger.log('info', `Starting warehouse microservice tests:\n`);
    logger_1.logger.log('info', '***********   LOAD DUMP FILE TEST   ***********');
    loadDumpIndexation().on('loadDone', () => {
        logger_1.logger.log('info', '***********   CHECK CONSTRAINTS TEST   ***********');
        checkConstraints(dataConstraints).on('checkFail', () => {
            logger_1.logger.log('info', '***********   ADDING JOB TEST   ***********');
            addJob(dataToAdd).on('addDone', () => {
                logger_1.logger.log('info', '***********   DATABASE DUMP TEST   ***********');
                dumpDatabase().on('dumpOK', () => {
                    emitter.emit('allTestsDone');
                });
            });
        });
    });
    return emitter;
}
exports.startTests = startTests;
// Start indexation
function loadDumpIndexation() {
    let emitterDumpLoad = new EventEmitter();
    logger_1.logger.log('info', `Reading data.json file content...`);
    let file = jsonfile.readFileSync('../data/data.json');
    logger_1.logger.log('success', '----> OK');
    logger_1.logger.log('info', `Start loading dump file to database...`);
    index.storeJob(file.docs).on('storeDone', () => {
        logger_1.logger.log('success', `----> OK \n\n`);
        logger_1.logger.log('info', '***********     INDEXATION TEST     ***********');
        logger_1.logger.log('info', `Searching for jobID.json files in... \n ./test/cache_Dir_1  ./test/cache_Dir_2  ./test/cache_Dir_3`);
        index.indexation(dataToIndex).on('indexDone', () => {
            logger_1.logger.log('success', '----> OK \n\n');
            emitterDumpLoad.emit('loadDone');
        });
    })
        .on('storeError', (err) => {
        logger_1.logger.log('error', `Load dumping from ./data.json failed \n ${err}`);
    });
    return emitterDumpLoad;
}
// Checking if job exist in database using constraints
function checkConstraints(constraints) {
    let emitterConst = new EventEmitter();
    logger_1.logger.log('info', `Looking for constraints in database... \n ${JSON.stringify(dataConstraints)}`);
    index.constraintsCall(constraints, 'test').on('testSucceed', (docsArray) => {
        logger_1.logger.log('info', `${JSON.stringify(docsArray)}`);
        logger_1.logger.log('success', '----> OK\n\n');
        emitterConst.emit('checkSuccess');
    })
        .on('testNoResults', (docsArray) => {
        logger_1.logger.log('error', '----> NOT OK (As expected)\n\n');
        emitterConst.emit('checkFail');
    });
    return emitterConst;
}
// Add a job into database
function addJob(job) {
    let emitterAdd = new EventEmitter();
    console.log('Dans la fonction addJob');
    logger_1.logger.log('info', `Inserting jobID to database... \n ${JSON.stringify(dataToAdd)}`);
    index.storeJob(job).on('storeDone', () => {
        logger_1.logger.log('success', '----> OK\n\n');
        logger_1.logger.log('info', '***********  CHECK CONSTRAINTS TEST 2  ***********');
        checkConstraints(dataConstraints).on('checkSuccess', () => {
            emitterAdd.emit('addDone');
        });
    });
    return emitterAdd;
}
// Dump database into json file
function dumpDatabase() {
    let emitterDump = new EventEmitter();
    let test = true;
    logger_1.logger.log('info', `Starting database dumping...`);
    index.dumpingDatabase(test).on('dumpDone', () => {
        logger_1.logger.log('success', '----> OK\n\n');
        emitterDump.emit('dumpOK');
    });
    return emitterDump;
}
function cleanDB(addressDB, portDB, nameDB, accountDB, passwordDB, proxyBool) {
    let emitterDelete = new EventEmitter();
    let id = "";
    let rev = "";
    let dataConstraintsTest = {
        "script": "/My/Path/To/My/Script/script.sh"
    };
    index.constraintsToQuery(dataConstraintsTest).on('docsFound', (data) => {
        let docs = data.docs;
        for (let [index, elem] of docs.entries()) {
            id = elem._id;
            rev = elem._rev;
            deleteDoc(id, rev, addressDB, portDB, nameDB, accountDB, passwordDB, proxyBool);
            if (index === docs.length - 1) {
                emitterDelete.emit('deleteDone');
            }
        }
    });
    return emitterDelete;
}
exports.cleanDB = cleanDB;
// Remove a single document into database
function deleteDoc(id, rev, addressDB, portDB, nameDB, accountDB, passwordDB, proxyBool) {
    let chunkRes = '';
    let chunkError = '';
    let curl;
    if (proxyBool) {
        curl = child_process_1.spawn('curl', ['--noproxy', `${addressDB}`, '-X', 'DELETE', `http://${accountDB}:${passwordDB}@${addressDB}:${portDB}/${nameDB}/${id}?rev=${rev}`]);
    }
    else {
        curl = child_process_1.spawn('curl', ['-X', 'DELETE', `http://${accountDB}:${passwordDB}@${addressDB}:${portDB}/${nameDB}/${id}?rev=${rev}`]);
    }
    curl.stdout.on('data', (data) => {
        chunkRes += data.toString('utf8');
    });
    curl.stderr.on('data', (data) => {
        chunkError += data.toString('utf8');
    });
    curl.on('close', (code) => {
        logger_1.logger.log('debug', `Deleting ${id} of ${nameDB} database`);
    });
}
