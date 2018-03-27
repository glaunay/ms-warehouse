id = 1;
while true; 
	do curl -X PUT http://vreymond:couch@127.0.0.1:5984/warehouse/"$id" -d '{"file1.inp": "7726e41aaafd85054aa6c9d4747dec7b"}';
	let "id++";
	sleep 0.01; 
done
 