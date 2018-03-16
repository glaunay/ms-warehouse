"use strict";
/*
*	Module for the couchDb database interaction.
*/
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const EventEmitter = require("events");
const nanoDB = require("nano");
const win = require("../lib/logger");
// connection to couchDb database with logs
let nano = nanoDB('http://vreymond:couch@localhost:5984');
/*
* Function that allows the insertion of data inside the database.
* @data : contain a jobID content type or an array of jobID type content.
* @nameDB : name of the database to insert data.
* #addEmitter : new instance of EventEmitter class.
* #db : simple alias for the database name using nano function use().
* #docList : array that contain data. If data is a simple jobID content, putting it into docList array.
*/
function addToDB(data, nameDB) {
    let addEmitter = new EventEmitter();
    let db = nano.use(nameDB);
    // Test is data is a list
    let docList = Array.isArray(data) ? data : [data];
    //for (let elem of docList){
    //	win.logger.log('DEBUG', 'Adding content to warehouse database:' + '\n' + JSON.stringify(elem) + '\n');
    db.bulk({ docs: docList }, function (err, body) {
        if (err) {
            win.logger.log('ERROR', 'Insertion from jobID.json file in database ');
            return;
        }
        win.logger.log('SUCCESS', 'Insertion of ' + docList.length + ' jobID.json files in ' + nameDB);
        addEmitter.emit('addSucceed');
    });
    //}
    return addEmitter;
}
exports.addToDB = addToDB;
/*
* Function that accept a query and request couchDb with nano structure.
* @query : mango query is required to be accepted by couchDb
*/
function testRequest(query, nameDB) {
    let reqEmitter = new EventEmitter();
    // just to test if the query work with constraints
    nano.request({ db: nameDB,
        method: 'POST',
        doc: '_find',
        body: query
    }, function (err, data) {
        if (err) {
            win.logger.log('ERROR', err);
        }
        else {
            reqEmitter.emit('requestDone', data);
        }
    });
    return reqEmitter;
}
exports.testRequest = testRequest;
