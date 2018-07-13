# MS-Warehouse

[![NodeJs](https://img.shields.io/badge/code-NodeJs-brightgreen.svg)](https://nodejs.org/en/)
[![TypeScript](https://img.shields.io/badge/code-TypeScript-blue.svg)](https://www.typescriptlang.org)
[![CouchDB](https://img.shields.io/badge/database-CouchDB-red.svg)](http://couchdb.apache.org)

MS-Warehouse is a MicroService (MS) which stores pipelines and jobs traces into a NoSQL database (couchDB), when a job is completed. Before the creation of a job, you can request the warehouse MS to check if any instance of this job (results) already exists inside the database. Once this job is found, the warehouse will bring back the job to the client. 



### Goals
The job-warehouse MS has to know all the previous and actual existing pipelines (their topology and their tasks). Moreover, is has to store all the previous and actual existing tasks (their "ID card", their working directory and their status). For more informations about pipelines and tasks, see the [Pipelines and tasks](#pipelines-and-tasks) section.

The job-warehouse MS must be composed of two parts :
- the server, with two main goals :
  - manage a database management system (see the [Database](#database) section) and be adapted to a precise directory organisation (see the [Directory organisation](#directory-organisation) section) ;
  - communicate with the client and be able to treat packets (see the [Communication](#communication) section) ;
- the client : interacs with other MS (see the [Communication](#communication) section) ;

### Pipelines and tasks

A pipeline is :
- a sequence of tasks, organized in graph ;
- described by a JSON, this is the **topology** ;
- saved in a directory named **namespace**, containing one directory per task ;

A task wraps a bioinformatic job in order to manage its pre- and post-processing. The interest is that tasks can be linked up to each other and thereby form a pipeline :
```
A ---→ B
```
In this pipeline, the results of the task A will be received as input by the task B.

### Directory organisation

A specific job in a directory cache (`cacheDir`) has 3 levels of directories :

1. the JobManager (JM) directory ;
2. the namespace (directory of a pipeline) ;
3. the job directory.

Example :

```
.
├── 014ea846-0b4f-4105-8858-a608add69a5b            // (1)
│   └── f296ec1d-172b-40e4-ac5a-031547081550        // (2)
│       └── f6137cad-1df8-4f76-8010-fb3dd6411e82    // (3)
│           └── input
└── 0b96d139-d461-4dd2-9324-2515936a92c2            // (1)
    ├── ee2b1ca0-1b19-424a-b77f-f9b751b8e306        // (2)
    |   ├── 695b5ceb-0ac2-47db-b1d4-a497bda35fdc    // (3)
    |   │   └── input
    |   └── ba016dc7-92ca-418e-b7db-f126c2466391    // (3)
    |       └── input
    └── 67593282-c4a4-4fd0-8861-37d8548ce236        // (2)
        ├── 1ae72ba3-338e-4a5b-8fbe-748dc1f7f30f    // (3)
        │   └── input
        └── c984ad9d-0345-4352-9f6f-05712c478033    // (3)
            └── input
```

Three of this directory structure are available for testing the indexation of them. they are located in the `./test/` directory.


## Getting Started

These instructions will get to you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the warehouse MS and how to install them:

1) Clone the ms-warehouse project into any working directory of your choice

```
git clone https://github.com/melaniegarnier/ms-warehouse
```
2) Make sur you get a version of Node.js in your system.

- Download it directly from the [Node.js](https://nodejs.org/) website.
- Using packet manager:
    - Linux (Ubuntu) : `sudo apt-get install nodejs npm`
    - MacOS : `brew install node`


3-a) Install The NoSQL database CouchDB with website

```bash
echo "deb https://apache.bintray.com/couchdb-deb xenial main"  | sudo tee -a /etc/apt/sources.list
curl -L https://couchdb.apache.org/repo/bintray-pubkey.asc     | sudo apt-key add -
sudo apt-get update && sudo apt-get install couchdb
```

3-b) Install the NoSQL database CouchDB with website

- Download it directly from the [CouchDB](http://couchdb.apache.org) website
- Using packet manager on Unix-like systems (with couchDB documentation): [Unix-Like Systems](http://docs.couchdb.org/en/2.0.0/install/unix.html)

### Installing


Those following instructions allows you to install properly the warehouse MS.

1) Install all npm packet dependencies needed by the program

```javascript
npm install
```

2) Compile TypeScript files to generate javaScript files. Move to the root of the program `./ms-warehouse` before run the TypeScript compiler.

```javascript
// for a simple compilation. Use it every time you did modifications into .ts files
tsc
// if you prefer a nicer view (for debugging), and a automatic compilation use this:
tsc -w --pretty
```

3) Run CouchDB program using the [official manual](http://docs.couchdb.org/en/latest/install/index.html)
You can have a visual display of your database into your browser by using the Fauxton interface at this url (once you start the CouchDB program):

```
http://127.0.0.1:5984/_utils/
```

Once those two instructions done, check if the compilation worked well and if every if javaScript files are present in their right spot.
You can now follow the next part to run some tests.

## Program usage

- Start the CouchDB server
 
- To access the helping manual of the warehouse MS, containing the entire options list, just use the following command:

```bash
node index.js -h 
# helping manual:
Options:

    -c, --config <path>         Load config file
    -i, --index                 Run indexation of cache directories
    -v, --verbosity <logLevel>  Set log level (debug, info, success, warning, error, critical)
    -d, --dump                  Dump the database into json file after indexation
    -l, --dumpload <path>       Load dump file from json file to construct the database
    -t, --test                  Run tests of the warehouse
    -p, --noproxy               Start the microservice without the proxy (to make curl command working)
    -x, --dropdb                Drop the database in config.json
    -h, --help                  output usage information
```

The `./data/config-server.json` file is required by the program to work properly. If one of this key are missing or incorrectly given, the program will stop his exectuion. This file contains different kind of properties (default values are this ones):

```json
// previousCacheDir is a list that contain every cache path waiting for indexation (with -i command option)
"previousCacheDir" : ["./test/cache_Dir_1", "./test/cache_Dir_2", "./test/cache_Dir_3"],
// accountDBName is your admin account in couchDB database (creating when starting couchDB for the first time)
"accountDBName": "vreymond",
// admin couchDB password
"password": "couch",
// databaseName refer to the name of the database used by the program
"databaseName" : "warehouse",
// databaseAddress is the location (URL) of the couchDB server
"databaseAddress": "localhost",
// portCouch refer to the port used to connect the database. 5984 is the default value given by CouchDB
"portCouch" : 5984,
// portExpress refer to the port that the program listening on HTTP connections
"portExpress": 7687,
// portSocket refer to the port that the program listening on Socket connections
"portSocket": 7688,
// warehouseAddress is the location (URL) of the ms-warehouse
"warehouseAddress": "localhost"

```
All of those properties are required by the program, but also the `-c <path>` command, if not the program won't work.

- Program running:

```javascript
//Place yourself into the build program (generate by typescript compilation)
cd build/
// start the warehouse server 
node index.js -c ../data/config-server.json

// Access all the command of the program:
node index.js -c ../data/config-server.json -h

// start the warehouse server with indexation of repository (specified in the ../data/config-server.json file)
node index.js -c ../data/config.json-server -i

```

## Running the tests
### Global tests before starting the MS-Warehouse
If you want to run some tests, you can use the ```-t``` command line option:

```javascript
node index -c ../data/config-server.json -t
```
This command will call the ```./test/tests-warehouse.js``` file that will run a set of tests before starting the warehouse micro-service.
Tests list (by simply using -t command line option):

- 1) Load dump file ---> This test will load an artificial dump file of a previous warehouse. The ```./test/data.json``` file will be loaded into the warehouse database. This file contain only 2 jobID.json files.

- 2) Indexation ---> This test will the indexation feature from the warehouse API. It consist of extract some jobs of some cache directory. The program searched on 3 directory located in ```./test/cache_Dir_1```, ```./test/cache_Dir_2``` and  ```./test/cache_Dir_3```. 8 job files can be found in those directory. After this task, the program will store them into the warehouse database.

- 3) Check constraints ---> This test will introduce another feature of the warehouse calling the research by constraints. Constraints is that will describe a specific job. The program will try to find a job (couchDB document) corresponding to this constraint: 
```javascript
{
	"script":"/My/Path/To/My/Script/script.sh",    
	"inputHash":{   
		"file1.inp":"42386c2d-fd44-459c-a94f-d4af29485b4f",    
		"file2.inp":"9e63443d-fc8f-49aa-9dc6-a7f8b15f0ceb"   
	}
}
```
This test will return an error, actually there is not job matching this specific constraint stored inside the database. This result is expected.

- 4) Adding job ---> This test will add a job with a ```"script"``` and ```"inputHash"``` keys with the value of the previous constraint. The database return a success message when the job is fully well inserted.

- 5) Check constraints 2 ---> We try again to check if the job possessing the exactly same constraints (as step 3). A job footprint is now present in the database. The database will return ```ok```.

- 6) Database dump ---> This test will dump the database content in a json file (the name of the file is the database name given in the config.json file, for example ```warehouse.json```).

If all tests succeed, the program will remove the 11 job documents added by the tests.
Finally, the program will start running the micro-service on the two port specified in the ```../data/config-server.json``` file for the Socket and HTTP connections.

### Socket and Express tests when MS-Warehouse running

Once the Warehouse is running, you can execute two different tests using Socket connection or Express connection. Both of them will do two actions, the first one is a check inside the database is there is a job trace corresponding to a certain constraints. The database will return 0 document corresponding if its the first time you start those tests. The second part of those tests will add a specific job trace inside the database. The MS-warehouse return every time a message, in JSON format, to the test who request the database. A message is structured as below:

```json
// Messages returned the first time you run the Socket or Express tests
// 1) Check if job trace exist in database, message returned by the micro-service (no docs found):
{
    "type":"results",
    "value":"notFind",
    "data":[]
}

// 2) Adding job trace into database (success value):
{
    "type":"results",
    "value":"success",
    "data":{}
}
```

```json
// Message returned the second time you start the test
// 1) Check if job trace exist in database, message returned by the micro-service 
// (one doc found added by the previous test):
{
    "type":"results",
    "value":"find",
    "data":[
        {
            "_id":"9e77ca03784c86afaf82761d5532f8e2",
            "_rev":"1-8746bfeb42fbbd80f912c482efb71231",
            "script":"/Socket/Connection/Script.sh",
            "exportVar":{
                "hexFlags":" -nocuda -ncpu 16 ",
                "hexScript":"/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
            },
            "modules":["naccess","hex"],
            "tagTask":"hex",
            "scriptHash":"7b8459fdb1eee409262251c429c48814",
            "inputHash":{
                "file1.inp":"7726e41aaafd85054aa6c9d4747dec7b",
                "file2.inp":"b01ba442-be19-4c45-b6a6-345e0ffb6230"
            }
        }
    ]
}

// 2) Adding job trace into database (success value):
// If the test will be run one more time (3rd), we will see two document during checking part
{
    "type":"results",
    "value":"success",
    "data":{}
}
```

- Socket connection test:


```bash
# Type this following command in the root of the warehouse directory to start the socket connection test.
node test/test-socket.js
```

- Express connection test:

```bash
# Type this following command in the root of the warehouse directory to start the express connection test.
node test/test-express.js
```

## API of MS-Warehouse

This part will describe the API of the micro-service Warehouse. This API give the two main features of the Warehouse, the job trace check and the storage of job trace.

```javascript
// Push Constraints Warehouse function
"http://address:port/pushConstraints"

//Store Job Warehouse function
"http://address:port/storeJob"
```

If you want to execute the express test, use the following command:

```bash
cd build/
node test/test-express.js
```

## Port forwarding, remote server

If you want to access to database with remote server use this command:

```bash
ssh login@arwen.ibcp.fr -L 1234:193.51.160.146:5984

#access to Fauxton distant:
"http://localhost:1234/_utils/"
```

## Deployment local / server (In progress)

|:arrow\_down: Local \ Server :arrow\_right:| Pipeline | Job-Manager | Warehouse|
| --- | --- | --- | --- |
| **Pipeline** | :heavy\_minus\_sign:| | :heavy\_minus\_sign: |
| **Job-manager**     | |:heavy\_minus\_sign:|
| **Warehouse**     | :heavy\_minus\_sign: |        | :heavy\_minus\_sign:|

:heavy\_minus\_sign:  
:white\_check\_mark:  
:x:

# Contributors

> Guillaume Launay, Mélanie Garnier, Valentin Reymond

| <a href="https://github.com/melaniegarnier/ms-jobmanager" target="_blank">**Job-Manager Micro-Service**</a> | <a href="https://github.com/melaniegarnier/taskobject" target="_blank">**Taskobject Micro-Service**</a> | <a href="https://github.com/melaniegarnier/ms-warehouse" target="_blank">**Warehouse Micro-Service**</a> |
| :---: |:---:| :---:|
| [<img alt="glaunay" src="https://avatars2.githubusercontent.com/u/1949853?s=460&v=4" width="150">](https://github.com/glaunay)     | [<img alt="melaniegarnier" src="https://avatars1.githubusercontent.com/u/22618294?s=460&v=4" width="150">](https://github.com/melaniegarnier) | [<img alt="vreymond" src="https://avatars2.githubusercontent.com/u/25683049?s=460&v=4" width="150">](https://github.com/vreymond) |
| <a href="https://github.com/glaunay" target="_blank">`github.com/glaunay`</a> | <a href="https://github.com/melaniegarnier" target="_blank">`github.com/melaniegarnier`</a> | <a href="https://github.com/vreymond" target="_blank">`github.com/vreymond`</a> |


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details


