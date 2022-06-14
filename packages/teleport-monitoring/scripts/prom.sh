#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Starting prometheus on: http://localhost:9090"

docker rm prom
docker run \
    -p 9090:9090 \
    -v $(pwd)/../prometheus:/etc/prometheus \
    --name prom \
    prom/prometheus