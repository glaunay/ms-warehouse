/*
*	Module for the couchDb database interaction.
*/

// Required packages
import EventEmitter = require('events');
import nanoDB = require('nano');
// Required modules
import * as types from '../types/index';
import win = require('../lib/logger');

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
export function addToDB (data: types.jobID | types.jobID[], nameDB: string): EventEmitter {
	let addEmitter: EventEmitter = new EventEmitter();
	let db: any = nano.use(nameDB);
	

	// Test is data is a list
	let docList: types.jobID[] = Array.isArray(data) ? data : [data];
	//for (let elem of docList){
	//	win.logger.log('DEBUG', 'Adding content to warehouse database:' + '\n' + JSON.stringify(elem) + '\n');
		db.bulk({docs: docList}, function(err: any, body: any) {		// nano function insert() to add some data
           	if (err) {
               	win.logger.log('ERROR', 'Insertion from jobID.json file in database ')
                return;
            }
        win.logger.log('SUCCESS', 'Insertion of ' + docList.length +  ' jobID.json files in ' + nameDB)
        addEmitter.emit('addSucceed');
        });
	//}
	return addEmitter;
}

/*
* Function that accept a query and request couchDb with nano structure.
* @query : mango query is required to be accepted by couchDb 
*/
export function testRequest(query: types.query, nameDB: string): EventEmitter{
	let reqEmitter : EventEmitter = new EventEmitter()

	// just to test if the query work with constraints
	nano.request({db: nameDB,
			method: 'POST',
			doc: '_find',
			body: query
			
		}, function(err:any, data:any){
			if(err){
				win.logger.log('ERROR', err)
			}
			else{
				reqEmitter.emit('requestDone', data);
			}			
		})
	return reqEmitter;
}
