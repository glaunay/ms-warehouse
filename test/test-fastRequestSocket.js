"use strict";
/*
    Socket client test.
    Trying to request as fast as possible the database to test the sturdiness
    using socket connection.
    With a setInterval of 200ms, the microservice is stable. On the other hand,
    with 100 ms, the microservice will crash several seconds after starting.
*/
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const program = require("commander");
// Required modules
const client = require("../wh-client");
const win = require("../lib/logger");
// Commander package part
program
    .option('-v, --verbose <level>', 'Specified the verbose level (debug, info, success, warning, error, critical)')
    .parse(process.argv);
if (program.verbose) {
    let upper = program.verbose.toUpperCase(); // change loglevel string into upper case (to match logger specifications)
    if (win.levels.hasOwnProperty(upper)) {
        win.logger.level = upper;
    }
    else {
        win.logger.log('WARNING', `No key ${upper} found in logger.levels. Using the default INFO level`);
    }
}
// constraints for testing
let constraints = {
    "script": null, "scriptHash": "7b8459fdb1eee409262251c429c48814",
    "inputHash": {
        "file1.inp": "7726e41aaafd85054aa6c9d4747dec7b"
    }
};
let jobID_Test = { "script": "/Users/vreymond/Stage/Projet/ms-warehouse/run_hex.sh",
    "exportVar": { "hexFlags": " -nocuda -ncpu 16 ",
        "hexScript": "/software/mobi/hex/8.1.1/exe/hex8.1.1.x64" },
    "modules": ["naccess", "hex"],
    "tagTask": "hex",
    "scriptHash": "61d743a3-6371-4830-b1ca-15db6fbbb02c",
    "inputHash": { "file1.inp": "aaf4d3b5-e5a3-44a3-8bc5-bde61fad671a",
        "file2.inp": "b01ba442-be19-4c45-b6a6-345e0ffb6230" } };
/*
* function createJobByExpress that will check if job already exist inside the coiuchDB database before creating it.
* @constraints : constraints we want to check
*/
function createJobBySocket(constraints) {
    client.pushConstraints(constraints);
}
/*
* function onJobComp that simulate a completed job that we want to store into the couchDB database
* @data : data to store
* NOT IMPLEMENTED YET
*/
function onJobComp(data) {
    client.storeJob(jobID_Test);
}
setInterval(function () {
    createJobBySocket(constraints);
}, 1000);
setInterval(function () {
    onJobComp(jobID_Test);
}, 1000);
