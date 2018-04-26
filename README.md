# ms-warehouse

[![NodeJs](https://img.shields.io/badge/code-NodeJs-brightgreen.svg)](https://nodejs.org/en/)
[![TypeScript](https://img.shields.io/badge/code-TypeScript-blue.svg)](https://www.typescriptlang.org)
[![CouchDB](https://img.shields.io/badge/database-CouchDB-red.svg)](http://couchdb.apache.org)

ms-warehouse is a MicroService (MS) which stores pipelines and jobs into a NoSQL database (couchDB), when a job is completed. Before the creation of a job, you can request the warehouse MS to check if any instance of this job (results) already exists inside the database. Once this job is found, the warehouse will bring back the job to the client. 

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

3) Install the NoSQL database CouchDB

- Download it directly from the [CouchDB](http://couchdb.apache.org) website
- Using packet manager on Unix-like systems (with couchDB documentation): [Unix-Like Systems](http://docs.couchdb.org/en/2.0.0/install/unix.html)

### Installing


Those following instructions allows you to install properly the warehouse MS.

1) Install all npm packet dependencies needed by the program

```javascript
npm install
// Your password is required (a global package will be installed, couchdb-dump)
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

```javascript
node index.js -h 
// helping manual:
Options:
    -c, --config <path>         Load config file
    -i, --index                 Run indexation of cache directories
    -v, --verbosity <logLevel>  Set log level (debug, info, success, warning, error, critical)
    -d, --dump                  Dump the database into json file after indexation
    -l, --dumpload <path>       Load dump from json file to construct the database
    -t, --test                  Run tests of the warehouse
    -h, --help                  output usage information
```

The `./config.json` file is required by the program to work properly. This file contains different kind of properties (default values are this ones):

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
"portSocket": 7688

```
All of those properties are required by the program, but also the `-c <path>` command, if not the program won't work.

- Program running:

```javascript
// start the warehouse server
node index.js -c config.json

// start the warehouse server with indexation of repository (specified in the config.json file)
node index.js -c config.json -i
```

## Running the tests

If you want to run some tests, you can use the ```-t``` command line option:

```javascript
node index -c config.json -t
```
This command will call the ```./test/tests-warehouse.js``` that will runs a set of tests before starting the warehouse micro-service.
Tests list:

- 1) Load dump file ---> This test will load an artificial dump file of a previous warehouse. The ```./test/data.json``` file will be loaded into the warehouse database. This file contain only 2 jobID.json files.

- 2) Indexation ---> This test will the indexation feature from the warehouse API. It consist of extract some jobs of some cache directory. The program searched on 3 directory located in ```./test/cache_Dir_1```, ```./test/cache_Dir_2``` and  ```./test/cache_Dir_3```. 8 job files can be found in those directory. After this task, the program will store them into the warehouse database.

- 3) Check constraints ---> This test will introduce another feature of the warehouse calling the research by constraints. Constraints is that will describe a specific job. The program will try to find a job (couchDB document) corresponding to this constraint: ```{"script":"/My/Path/To/My/Script/script3.sh"}```.
This test will return an error, actually there is not job matching this specific constraint stored inside the database. This result is expected.

- 4) Adding job ---> This test will add a job with a ```"script"``` key with the value of the previous constraint ```{"script":"/My/Path/To/My/Script/script3.sh"}```. The database return a success message when the job is fully well inserted.

- 5) Check constraints 2 ---> We try again to check if the job possessing the ```{"script":"/My/Path/To/My/Script/script3.sh"}``` constraint is now present in the database. The database will return ```ok```.

- 6) Database dump ---> This test will dump the database content in a json file (the name of the file is the database name given in the config.json file, for example ```warehouse.json```).

If all tests succeed, the program will remove the 11 job documents added by the tests.
Finally, the program will start running the micro-service on the two port specified in the ```./config.json``` file for the Socket and HTTP connections.


# Contributors
[<img alt="glaunay" src="https://avatars2.githubusercontent.com/u/1949853?s=460&v=4" width="117">](https://github.com/glaunay) | [<img alt="vreymond" src="https://avatars2.githubusercontent.com/u/25683049?s=460&v=4" width="117">](https://github.com/vreymond) | [<img alt="melaniegarnier" src="https://avatars1.githubusercontent.com/u/22618294?s=460&v=4" width="117">](https://github.com/melaniegarnier)|
:---: |:---: |:---: |:---: |:---: |:---: |
[glaunay](https://github.com/glaunay) |[vreymond](https://github.com/vreymond) |[melaniegarnier](https://github.com/melaniegarnier)
 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details


