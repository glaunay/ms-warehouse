# job-warehouse
Job-warehouse is a MicroService (MS) which stores pipelines and jobs into a NoSQL database, in order to restore them if necessary.  
In development...

## How to install

First of all, you need to install the Typescript package using the node package manager (npm).

```
npm install -g typescript
```

Once Typescript installed, you should now retrieve the repository from github using this command:

```
git clone https://github.com/melaniegarnier/ms-warehouse.git
```

Move into the project directory. Now you need to install all node packages dependencies:

```
npm install
```

## Run the program

The first thing you need to do is to compile the ```./ts/``` directory by using the ```tsc``` command in your terminal at the root of this repository ```~/ms-warehouse/```. By using this, you will use the "typescript compiler" and transform all files contained inside the ```./ts/``` repository into javascript files. And now, you will be able to execute with node the program.

To get the help manual from the progam, containing the entire options list, just use the following command:

```javascript
node index.js -h 
// or --help
// you will get:
Options:

    -c, --config <path>     Load config file
    -i, --index             Run indexation of cache directories
    -l, --loglevel <level>  Specified the logger level (debug, info, success, warning, error, critical)
    -h, --help              output usage information
```

## Development requirements

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



### Database

The job-warehouse uses the NoSQL database management system [couchDB][1] (a [guide][4] to begin). In JavaScript, the NPM package used to interact with couchDB is [nano][2].

Two collections :
- jobs
- pipelines



### Communication

The client must be imported by other MS in order to mimic the server API. In fact, the client is an interface to reproduce the server operations.  
When a MS calls a job-warehouse client function, the client sends the information (in a packet format, see the [Packets](#packets) section) to the server thanks to the NPM package [node-ipc][3]. Then, if the server recognizes the packet, it understands the operation to make.

#### Packets





[1]: http://couchdb.apache.org/
[2]: https://www.npmjs.com/package/nano
[3]: https://www.npmjs.com/package/node-ipc
[4]: http://guide.couchdb.org/draft/index.html
