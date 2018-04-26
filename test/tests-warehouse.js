"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const jsonfile = require("jsonfile");
const EventEmitter = require("events");
const index = require("../index");
const child_process_1 = require("child_process");
const logger_1 = require("../lib/logger");
let dataToIndex = ["./test/cache_Dir_1", "./test/cache_Dir_2", "./test/cache_Dir_3"];
// Imitate a job content that will be insert in database
let dataToAdd = {
    "script": "/My/Path/To/My/Script/script3.sh",
    "exportVar": {
        "hexFlags": " -nocuda -ncpu 16 ",
        "hexScript": "/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
    },
    "modules": ["naccess", "hex"],
    "tagTask": "hex",
    "scriptHash": "4286ddd9-3fde-4fa4-b542-57980fbaabbe",
    "inputHash": {
        "file1.inp": "b61cba08-7df7-4fad-900b-b09414c38d5d",
        "file2.inp": "22d4faa3-3d74-432d-bab1-5af7bbb99df3"
    }
};
let dataConstraints = {
    "script": "/My/Path/To/My/Script/script3.sh"
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
                // logger.log('info', '*********** EXTERNAL SOCKET CONNECTION TEST ***********');
                // socketTest()
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
    let file = jsonfile.readFileSync('./test/data.json');
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
    logger_1.logger.log('info', `Starting database dumping...`);
    index.dumpingDatabase().on('dumpDone', () => {
        logger_1.logger.log('success', '----> OK\n\n');
        emitterDump.emit('dumpOK');
    });
    return emitterDump;
}
// Clean database (remove files inserted without destroying database)
function cleanDB(addressDB, portDB, nameDB) {
    let emitterDelete = new EventEmitter();
    //curl -X GET http://10.10.211.133:5984/ibmuwarticles/_all_docs
    //curl -X DELETE http://127.0.0.1:5984/my_database/001?rev=1-3fcc78daac7a90803f0a5e383f4f1e1e
    let chunkRes = '';
    let chunkError = '';
    let curl = child_process_1.spawn('curl', ['-X', 'GET', `http://${addressDB}:${portDB}/${nameDB}/_all_docs`]);
    curl.stdout.on('data', (data) => {
        chunkRes += data.toString('utf8');
    });
    curl.stderr.on('data', (data) => {
        chunkError += data.toString('utf8');
    });
    curl.on('close', (code) => {
        let parseChunkRes = JSON.parse(chunkRes);
        let id = '';
        let rev = '';
        for (let [index, elem] of parseChunkRes.rows.entries()) {
            id = elem.id;
            rev = elem.value.rev;
            deleteDoc(id, rev, addressDB, portDB, nameDB);
            if (index === parseChunkRes.rows.length - 1) {
                emitterDelete.emit('deleteDone');
            }
        }
    });
    return emitterDelete;
}
exports.cleanDB = cleanDB;
// Remove a single document into database
function deleteDoc(id, rev, addressDB, portDB, nameDB) {
    let chunkRes = '';
    let chunkError = '';
    let curl = child_process_1.spawn('curl', ['-X', 'DELETE', `http://${addressDB}:${portDB}/${nameDB}/${id}?rev=${rev}`]);
    curl.stdout.on('data', (data) => {
        chunkRes += data.toString('utf8');
    });
    curl.stderr.on('data', (data) => {
        chunkError += data.toString('utf8');
    });
    curl.on('close', (code) => {
    });
}
