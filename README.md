# job-warehouse
Job-warehouse is a MicroService (MS) which stores jobs into a NoSQL database, in order to restore them if necessary.  
In development...

## Development requirements

### Goals

The job-warehouse MS needs to :
- be adapted to a precise directory organisation (see the [Directory organisation](#directory-organisation) section) ;
- use the [couchDB][1] database management system ; // nano
- server / client (ipc)
- interact with other MS thanks to packets (see the [Packets](#packets) section) ;

### Directory organisation

A specific job in a directory cache (`cacheDir`) has 3 levels of directories :

1. the JM directory ;
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



### Specifications



### Packets





[1]: http://couchdb.apache.org/
