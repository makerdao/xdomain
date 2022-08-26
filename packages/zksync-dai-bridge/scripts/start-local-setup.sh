#!/usr/bin/env bash

cd node_modules/local-setup

mkdir -p ./volumes
mkdir -p ./volumes/postgres ./volumes/geth ./volumes/zksync/env/dev ./volumes/zksync/data

docker-compose down -v
docker-compose up -d

