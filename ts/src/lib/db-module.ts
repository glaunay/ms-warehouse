/*
*	Module for the couchDb database interaction.
*/

// Required packages
import EventEmitter = require('events');
import nanoDB = require('nano');
import { spawn } from 'child_process';
// Required modules
import * as types from '../types/index';
import win = require('../lib/logger');

// connection to couchDb database with logs
let nano = nanoDB('http://vreymond:couch@localhost:5984');

/*
* Function that accept a query and request couchDb with nano structure.
* @query : mango query is required to be accepted by couchDb 
*/
export function testRequest(query: types.query, nameDB: string): EventEmitter{
	let reqEmitter : EventEmitter = new EventEmitter();
	let chunkRes = '';
	let chunkError = '';
	let curl = spawn('curl', ['-s','-S','-H', 'Content-Type:application/json','-H','charset=utf-8','-d', `${JSON.stringify(query)}`, '-X', 'POST', 'http://vreymond:couch@127.0.0.1:5984/' + nameDB + '/_find'])
	curl.stdout.on('data', (data: any) => {
		chunkRes += data.toString('utf8');
	})

	curl.stderr.on('data', (data: any) => {
		chunkError += data.toString('utf8');
	})

	curl.on('close', (code: any) => {

		let jsonChunkRes = JSON.parse(chunkRes);
		
		if (chunkError.length > 0) {
			win.logger.log('ERROR', 'Insertion from jobID.json file in database \n' + chunkError);
			reqEmitter.emit('curlError', chunkError);
		}
		else{
			reqEmitter.emit('requestDone', jsonChunkRes )
		}
	})
	return reqEmitter;
}

//-------------------------------------------------------------------------
// Test with curl

/*
* curl -X PUT http://vreymond:couch@127.0.0.1:5984/warehouse/"$id" -d '{"file1.inp": "7726e41aaafd85054aa6c9d4747dec7b"}'
* curl -d '{"docs":[{"key":"baz","name":"bazzel"},{"key":"bar","name":"barry"}]}' -X POST $DB/_bulk_docs
*/
export function addToDB (data: types.jobSerialInterface | types.jobSerialInterface[], nameDB: string): EventEmitter {
	//cnt++;
	//win.logger.log('CRITICAL', 'cnt = ' + cnt)
	
	let addEmitter: EventEmitter = new EventEmitter();
	// Test is data is a list
	let docList: types.jobSerialInterface[] = Array.isArray(data) ? data : [data];

	let addObj: addData = new addData(docList, nameDB);

	addObj.on('addOk', () =>{
		win.logger.log('SUCCESS', `Insertion of ${docList.length} jobID.json files in ${nameDB}`)
        addEmitter.emit('addSucceed');
	})
	.on('maxTry', (docListFailed) => {
		win.logger.log('WARNING', `max try limit of adding reached, list of ${docListFailed} will not be added to the ${nameDB} database`);
		addEmitter.emit('maxTryReach', docListFailed)
	})
	.on('curlError', (curlError) => {
		win.logger.log('ERROR', `An error occured during the curl command: \n  ${curlError}`);
		addEmitter.emit('callCurlErr', curlError);
	})
	// let chunkRes = '';
	// let chunkError = '';

	

	// //console.log(docList)
	// //-H "Content-Type:application/json"
	// let curl = spawn('curl', ['-s','-S','-H', 'Content-Type:application/json','-d', '{"docs":'+JSON.stringify(docList)+'}', '-X', 'POST', 'http://vreymond:couch@127.0.0.1:5984/' + nameDB + '/_bulk_docs'])

	// curl.stdout.on('data', (data: any) => {
	// 	//console.log(data.toString('utf8'))
	// 	chunkRes += data.toString('utf8')
	// 	//win.logger.log('CRITICAL', 'cnt in stdout = ' + cnt)
	// 	//console.log(`stdout: ${data}`);
	// 	//console.log(data.toString('utf8'))
	// 	//win.logger.log('SUCCESS', `Insertion of ${docList.length} jobID.json files in ${nameDB}`)
	// });

	// curl.stderr.on('data', (data: any) => {
	// 	chunkError += data.toString('utf8')
	// 	//win.logger.log('CRITICAL', 'cnt in stderr = ' + cnt)
	// 	//console.log(`stderr: ${data}`);
	// 	//win.logger.log('ERROR', 'Insertion from jobID.json file in database \n', data.toString('utf8'));

	// });

	// curl.on('close', (code: any) => {
	// 	//win.logger.log('CRITICAL', 'cnt in close = ' + cnt)
	// 	//console.log(`child process exited with code ${code}`);
		
	// 	console.log(typeof(chunkRes))
	// 	let jsonChunkRes = eval(chunkRes);
	// 	let jsonChunkError = eval(chunkError);

	// 	if (chunkError.length > 0) {
	// 		win.logger.log('ERROR', 'Insertion from jobID.json file in database \n' + chunkError);
	// 		addEmitter.emit('curlError', chunkError);
	// 	}
	// 	else{
	// 		let result: any[] = jsonChunkRes.map(function(elem: any){
	// 			if(elem["ok"] === true) return true;
	// 			else return false;
	// 		})
	// 		console.log(result)
	// 		let checkEqual: boolean = !!result.reduce(function(a, b){ return (a === b) ? a : NaN; });

	// 		if(checkEqual){
	// 			win.logger.log('SUCCESS', `Insertion of ${docList.length} jobID.json files in ${nameDB}`)
 //            	addEmitter.emit('addSucceed');
	// 		}
	// 		else {
	// 			let falseCount: number = result.filter(elem => elem === false).length;

	// 			win.logger.log('ERROR', 'Insertion from jobID.json file in database')
 //               	win.logger.log('ERROR', jsonChunkError);
 //               	addEmitter.emit('addError', jsonChunkError);
	// 		}
	// 	}
	// 	win.logger.log('CRITICAL', chunkRes);
	// });
	
	return addEmitter;
}

/*
* Class that manage the curl command build using spawn.
* @ _docList : list of job attempt to be added inside the database.
* @_nameDB : name of the database.
* Class property:
* #this.docList : contains _docList
* #this.nameDb : contains _nameDB
* #this.chunkRes : that will receive chunk part from the stdout (curl) stream.
* #this.chunkError : that will receive chunk part from the sterr (curl) stream.
* #this.nbTest : number of required the database to add the data.
* #this.nbMax : maximum of calling database for a specific data (docList).
* #result : array of the response from the database transformed into boolean.
* #checkEqual : boolean that inform is every element of result are equal.
*
* (1) : construct the curl command using spawn (from child_process module).
* (2) : receive data as chunk parts from stdout or stderr streams.
* (3) : data full receive, if some error (in chunkError) then emit curlError event.
* (4) : transforming response into an array of boolean. True when request succeed, false when its not.
* (5) : check if the result array contains only element with same values.
* (6) : if checkEqual is true and result array element contains true (to avoid the "true" result from checkEqual if result array containing only false value)
* (7) : _curl function recursive call.
*/
class addData extends EventEmitter{
	docList: types.jobSerialInterface[];
	nameDB: string;
	chunkRes: string;
	chunkError: string;
	//nbTest: number;
	nbMax: number;

	constructor(_docList: types.jobSerialInterface[], _nameDB: string){
		super();
		this.docList = _docList;
		this.nameDB = _nameDB;
		this.chunkRes = '';
		this.chunkError = '';
		//this.nbTest = 0;
		this.nbMax = 3;
		let self: addData = this;
		self._curl();
	}

	_curl(){

		let self: addData = this;
		// (1)
		let curl = spawn('curl', ['-s','-S','-H', 'Content-Type:application/json','-d', '{"docs":'+JSON.stringify(self.docList)+'}', '-X', 'POST', 'http://vreymond:couch@127.0.0.1:5984/' + self.nameDB + '/_bulk_docs']);
		//self.nbTest++;
		self.nbMax--;
		// (2)
		curl.stdout.on('data', (data: any) => {
			self.chunkRes += data.toString('utf8');
		});
		// (2)
		curl.stderr.on('data', (data: any) => {
			self.chunkError += data.toString('utf8');
		});
		// (3)
		curl.on('close', (code: any) => {
			let jsonChunkRes = eval(self.chunkRes);
			//let jsonChunkError = eval(self.chunkError);

			if (self.chunkError.length > 0) {
				self.emit('curlError', self.chunkError);
			}
			else{
				// (4)
				let result: any[] = jsonChunkRes.map(function(elem: any){
					return elem["ok"] === true;
				})
				// (5)
				// result[2] = false;
				// console.log(result)
				//let checkEqual: boolean = !!result.reduce(function(a, b){ return (a === b) ? a : NaN; });
				let checkEqual: boolean = true;
				for(let elem of result){
					if (result[0] !== elem){
						//console.log('COURT-CIRCUITER!!!!!!!!!!!!!')
						checkEqual = false;
						break;
					}
				}

				// (6)
				if(checkEqual && result[0] === true){
					self.emit('addOk');
				}
				// (7)
				else {

					// if number of try adding is equal 3, we emit a event maxTry
					if(self.nbMax === 0){
						self.emit('maxTry', self.docList);
					}
					else {
						// recursive call of _curl with data not added last iteration
						self.docList = self.docList.filter((elem,i) => result[i] === false);

						// check docLIst length
						self._curl();
					}
					//let falseCount: number = result.filter(elem => elem === false).length;
				}
			}
		})
	}
}

// ---------------------------------------------------------------------------------
// Nano Version
/*
* Function that allows the insertion of data inside the database.
* @data : contain a jobID content type or an array of jobID type content.
* @nameDB : name of the database to insert data.
* #addEmitter : new instance of EventEmitter class.
* #db : simple alias for the database name using nano function use().
* #docList : array that contain data. If data is a simple jobID content, putting it into docList array.
*/
export function _addToDB (data: types.jobSerialInterface | types.jobSerialInterface[], nameDB: string): EventEmitter {
	let addEmitter: EventEmitter = new EventEmitter();
	let db: any = nano.use(nameDB);

	// Test is data is a list
	let docList: types.jobSerialInterface[] = Array.isArray(data) ? data : [data];

		db.bulk({docs: docList}, function(err: any, body: any) {		// nano function bulk() to add some data
           	if (err) {
               	win.logger.log('ERROR', 'Insertion from jobID.json file in database')
               	win.logger.log('ERROR', err);
               	addEmitter.emit('addError', err);
            }
            else{
            	win.logger.log('SUCCESS', `Insertion of ${docList.length} jobID.json files in ${nameDB}`)
            	addEmitter.emit('addSucceed');
            }
        });
	return addEmitter;
}

export function _testRequest(query: types.query, nameDB: string): EventEmitter{
	let reqEmitter : EventEmitter = new EventEmitter();

	nano.request({db: nameDB,
			method: 'POST',
			doc: '_find',
			body: query

		}, function(err:any, data:any){
			if(err){
				win.logger.log('requestError', err)
			}
			else{
				reqEmitter.emit('requestDone', data);
			}			
		})
	return reqEmitter;
}












