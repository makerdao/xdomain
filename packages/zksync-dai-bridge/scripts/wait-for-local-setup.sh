#!/bin/bash

RETRIES=${RETRIES:-300}

JSON='{"jsonrpc":"2.0","id":0,"method":"eth_chainId","params":[]}'
L2_URL='http://localhost:3050'
L1_URL='http://localhost:8545'

echo "Waiting for local setup..."

while [ "$RETRIES" -gt 0 ]; do
    curl    --silent --fail --output /dev/null -H "Content-Type: application/json" -d $JSON $L2_URL \
    && curl --silent --fail --output /dev/null -H "Content-Type: application/json" -d $JSON $L1_URL

  if [ $? -eq 0 ]
  then
    echo "Local setup ready!"
    break
  else
    let RETRIES-=1
    sleep 3
  fi
done

if [ "$RETRIES" -eq 0 ]
then
  exit 1
fi
