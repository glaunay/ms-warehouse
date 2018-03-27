id = 1;
while true; 
	do curl -X GET http://vreymond:couch@127.0.0.1:5984/warehouse/"$id";
	let "id++";
	sleep 0.1; 
done