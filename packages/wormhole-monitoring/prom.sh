#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

docker rm prom
docker run \
    -p 9090:9090 \
    -v $(pwd)/prometheus:/etc/prometheus \
    --name prom \
    prom/prometheus