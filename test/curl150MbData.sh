#!/bin/bash

#curl -s -S -H "Content-Type:application/json" -H "charset=utf-8" -d @data.json -X POST "http://vreymond:couch@127.0.0.1:5984/warehouse/_bulk_docs";

curl -s -S -H "Content-Type:application/json" -H "charset=utf-8" -d @data.json -X POST "http://localhost:7687/storeJob/";

 