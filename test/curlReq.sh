curl "http://localhost:7687/pushConstraints" \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data @<(cat <<EOF
{
  "coreScript":"7b8459fdb1eee409262251c429c48814",
  "inputs":{
    "file1.inp":"7726e41aaafd85054aa6c9d4747dec7b"
  }
}
EOF
)