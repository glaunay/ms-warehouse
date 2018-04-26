/*
*	Module for the couchDb database interaction.
*/

// Required packages
import EventEmitter = require('events');
import nanoDB = require('nano');
import splitArray = require('split-array');
import { spawn } from 'child_process';
// Required modules
import * as types from '../types/index';
import {logger, setLogLevel} from '../lib/logger';


/*
* Function that accept a query and request couchDb with nano structure.
* @query : mango query is required to be accepted by couchDb 
*/
export function testRequest(query: types.query, nameDB: string, accountName: string, passwordDB: string): EventEmitter{
	let reqEmitter : EventEmitter = new EventEmitter();
	let chunkRes = '';
	let chunkError = '';
	let curl = spawn('curl', ['-s','-S','-H', 'Content-Type:application/json','-H','charset=utf-8','-d', `${JSON.stringify(query)}`, '-X', 'POST', `http://${accountName}:${passwordDB}@127.0.0.1:5984/${nameDB}/_find`])
	curl.stdout.on('data', (data: any) => {
		chunkRes += data.toString('utf8');
	})

	curl.stderr.on('data', (data: any) => {
		chunkError += data.toString('utf8');
	})

	curl.on('close', (code: any) => {

		let jsonChunkRes = JSON.parse(chunkRes);
		
		if (chunkError.length > 0) {
			logger.log('error', 'Insertion from jobID.json file in database \n' + chunkError);
			reqEmitter.emit('curlError', chunkError);
		}
		else{
			reqEmitter.emit('requestDone', jsonChunkRes )
		}
	})
	return reqEmitter;
}

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
export async function addToDB (data: types.jobSerialInterface | types.jobSerialInterface[], nameDB: string, accountName: string, passwordDB: string) : Promise<any> {

	let docList: types.jobSerialInterface[] = Array.isArray(data) ? data : [data];
	let arrayData:any[] = docList.length > 500 ? arraySplit(docList, 500) : docList;
	for (let elem of arrayData) {
		let addObj: addData = new addData(elem, nameDB, accountName, passwordDB);
		await addObj.three_curl()
	};
}

/*
* Function arraySplit that can split a high array into an array of array.
* @arrayToSplit : high length array to split.
* @number : define the length of the splitted array
* #array : array returned by the function, this an array of array of number variable length. 
*/
function arraySplit(arrayToSplit: types.jobSerialInterface[], number: number): types.jobSerialInterface[][]{

	let array: types.jobSerialInterface[][] = splitArray(arrayToSplit, number);
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
class addData extends EventEmitter{
	docList: types.jobSerialInterface[];
	nameDB: string;
	accountName: string;
	passwordDB: string;
	chunkRes: string;
	chunkError: string;
	
	constructor(_docList: types.jobSerialInterface[], _nameDB: string, _accountName: string, _passwordDB: string){
		super();
		this.docList = _docList;
		this.nameDB = _nameDB;
		this.accountName = _accountName,
		this.passwordDB = _passwordDB,
		this.chunkRes = '';
		this.chunkError = '';
		let self: addData = this;
	}
	/*
	* Function that will try 3 times to insert data into couchDB
	*/
	async three_curl(){
		let self = this
		let p = new Promise((resolve, reject) => {
			self._curl()
				.then(()=>{ 
					//console.log("curl1 OK");
					resolve() 
				}) 
				.catch(() => {
					//console.log("curl1 PB");
					self._curl()
						.then(()=>{
							//console.log("curl2 OK");
							resolve()})				
						.catch(() =>{
							//console.log("curl2 PB");
							self._curl()
								.then(()=>{
									//console.log("curl3 OK");
									resolve()
								})				
								.catch(()=>{
									logger.log('error','Max try adding reach')
									//console.log("curl3 PB");
									reject()
								})
						})
				})
		});
		return p;
	}

	async _curl(): Promise<any> {
		let self: addData = this;
		let p: any = new Promise((resolve, reject) => {
			Array.isArray(self.docList) ? self.docList : self.docList = [self.docList];
			// (1)
			let curl = spawn('curl', ['-s','-S','-H', 'Content-Type:application/json','-d', `{"docs": ${JSON.stringify(self.docList)}}`, '-X', 'POST', `http://${self.accountName}:${self.passwordDB}@127.0.0.1:5984/${self.nameDB}/_bulk_docs`]);
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

				if (self.chunkError.length > 0) {
					reject(self.chunkError);
				}
				else{
					// (4)
					let result: any[] = jsonChunkRes.map(function(elem: any){
						return elem["ok"] === true;
					})
					// (5)
					let checkEqual: boolean = true;
					for(let elem of result){
						if (result[0] !== elem){
							checkEqual = false;
							break;
						}
					}
					//result[0] = false
					// (6)
					if(checkEqual && result[0] === true){
						resolve();
					}
					// (7)
					else {
						self.docList = self.docList.filter((elem,i) => result[i] === false);
						self.chunkRes = '';
						self.chunkError = '';
						reject();
					}
				}
			})
		})
		return p;
	}
}
