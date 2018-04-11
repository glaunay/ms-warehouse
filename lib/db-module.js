"use strict";
/*
*	Module for the couchDb database interaction.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const EventEmitter = require("events");
const splitArray = require("split-array");
const child_process_1 = require("child_process");
const logger_1 = require("../lib/logger");
/*
* Function that accept a query and request couchDb with nano structure.
* @query : mango query is required to be accepted by couchDb
*/
function testRequest(query, nameDB, accountName, passwordDB) {
    let reqEmitter = new EventEmitter();
    let chunkRes = '';
    let chunkError = '';
    let curl = child_process_1.spawn('curl', ['-s', '-S', '-H', 'Content-Type:application/json', '-H', 'charset=utf-8', '-d', `${JSON.stringify(query)}`, '-X', 'POST', `http://${accountName}:${passwordDB}@127.0.0.1:5984/${nameDB}/_find`]);
    curl.stdout.on('data', (data) => {
        chunkRes += data.toString('utf8');
    });
    curl.stderr.on('data', (data) => {
        chunkError += data.toString('utf8');
    });
    curl.on('close', (code) => {
        let jsonChunkRes = JSON.parse(chunkRes);
        if (chunkError.length > 0) {
            logger_1.logger.log('error', 'Insertion from jobID.json file in database \n' + chunkError);
            reqEmitter.emit('curlError', chunkError);
        }
        else {
            reqEmitter.emit('requestDone', jsonChunkRes);
        }
    });
    return reqEmitter;
}
exports.testRequest = testRequest;
/*
* Function addToDB that accept a single jobSerialInterface type object or an array of jobSerialInterface type object
* @data : data attempting to be insert into the couchDB database.
* @nameDB : name of the database.
* @accountName : name of user account for couchDB.
* @passwordDB : user password for couchDB
* #docList : Transform data in array if it's a single jobSerialInterface.
* #arrayData : If data length is higher than 500, we split array into array of 500 with the arraySplit function.
* #addObj : addData class object, we use await before next iteration of the loop.
*/
function addToDB(data, nameDB, accountName, passwordDB) {
    return __awaiter(this, void 0, void 0, function* () {
        let docList = Array.isArray(data) ? data : [data];
        let arrayData = docList.length > 500 ? arraySplit(docList, 500) : docList;
        for (let elem of arrayData) {
            let addObj = new addData(elem, nameDB, accountName, passwordDB);
            yield addObj.three_curl();
        }
        ;
    });
}
exports.addToDB = addToDB;
/*
* Function arraySplit that can split a high array into an array of array.
* @arrayToSplit : high length array to split.
* @number : define the length of the splitted array
* #array : array returned by the function, this an array of array of number variable length.
*/
function arraySplit(arrayToSplit, number) {
    let array = splitArray(arrayToSplit, number);
    return array;
}
/*
* Class that manage the curl command build using spawn.
* @ _docList : list of job attempt to be added inside the database.
* @_nameDB : name of the database.
* Class property:
* #this.docList : contains _docList
* #this.nameDB : contains _nameDB
* #this.chunkRes : that will receive chunk part from the stdout (curl) stream.
* #this.chunkError : that will receive chunk part from the sterr (curl) stream.
* #result : array of the response from the database transformed into boolean.
* #checkEqual : boolean that inform is every element of result are equal.
*
* Two function inside this class:
* three_curl: this on call 3 time the curl function. We autorize max 3 try to insert data inside database before sending an error message. This function return a promise.
* _curl: funtion that will construct the curl command using spawn tool. This function return a promise
*
* (1) : construct the curl command using spawn (from child_process module).
* (2) : receive data as chunk parts from stdout or stderr streams.
* (3) : data full receive, if some error (in chunkError) then emit curlError event.
* (4) : transforming response into an array of boolean. True when request succeed, false when its not.
* (5) : check if the result array contains only element with same values.
* (6) : if checkEqual is true and result array element contains true (to avoid the "true" result from checkEqual if result array containing only false value)
* (7) : _curl function recursive call.
*/
class addData extends EventEmitter {
    constructor(_docList, _nameDB, _accountName, _passwordDB) {
        super();
        this.docList = _docList;
        this.nameDB = _nameDB;
        this.accountName = _accountName,
            this.passwordDB = _passwordDB,
            this.chunkRes = '';
        this.chunkError = '';
        let self = this;
    }
    /*
    * Function that will try 3 times to insert data into couchDB
    */
    three_curl() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            let p = new Promise((resolve, reject) => {
                self._curl()
                    .then(() => {
                    //console.log("curl1 OK");
                    resolve();
                })
                    .catch(() => {
                    //console.log("curl1 PB");
                    self._curl()
                        .then(() => {
                        //console.log("curl2 OK");
                        resolve();
                    })
                        .catch(() => {
                        //console.log("curl2 PB");
                        self._curl()
                            .then(() => {
                            //console.log("curl3 OK");
                            resolve();
                        })
                            .catch(() => {
                            logger_1.logger.log('error', 'Max try adding reach');
                            //console.log("curl3 PB");
                            reject();
                        });
                    });
                });
            });
            return p;
        });
    }
    _curl() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            let p = new Promise((resolve, reject) => {
                Array.isArray(self.docList) ? self.docList : self.docList = [self.docList];
                // (1)
                let curl = child_process_1.spawn('curl', ['-s', '-S', '-H', 'Content-Type:application/json', '-d', `{"docs": ${JSON.stringify(self.docList)}}`, '-X', 'POST', `http://${self.accountName}:${self.passwordDB}@127.0.0.1:5984/${self.nameDB}/_bulk_docs`]);
                // (2)
                curl.stdout.on('data', (data) => {
                    self.chunkRes += data.toString('utf8');
                });
                // (2)
                curl.stderr.on('data', (data) => {
                    self.chunkError += data.toString('utf8');
                });
                // (3)
                curl.on('close', (code) => {
                    let jsonChunkRes = eval(self.chunkRes);
                    if (self.chunkError.length > 0) {
                        reject(self.chunkError);
                    }
                    else {
                        // (4)
                        let result = jsonChunkRes.map(function (elem) {
                            return elem["ok"] === true;
                        });
                        // (5)
                        let checkEqual = true;
                        for (let elem of result) {
                            if (result[0] !== elem) {
                                checkEqual = false;
                                break;
                            }
                        }
                        //result[0] = false
                        // (6)
                        if (checkEqual && result[0] === true) {
                            resolve();
                        }
                        else {
                            self.docList = self.docList.filter((elem, i) => result[i] === false);
                            self.chunkRes = '';
                            self.chunkError = '';
                            reject();
                        }
                    }
                });
            });
            return p;
        });
    }
}
