#!/usr/bin/env bash
git clone https://github.com/matter-labs/local-setup.git
cd local-setup

mkdir -p ./volumes
mkdir -p ./volumes/postgres ./volumes/geth ./volumes/zksync/env/dev ./volumes/zksync/data

docker-compose down -v
docker-compose up -d

