#!/usr/bin/env bash
git clone https://github.com/matter-labs/local-setup.git
cd local-setup
git checkout 65f57fe7e266438e9c2b53e4f61ec253e85cd014

rm -rf ./volumes
mkdir -p ./volumes
mkdir -p ./volumes/postgres ./volumes/geth ./volumes/zksync/env/dev ./volumes/zksync/data

docker-compose down -v
docker-compose up -d

