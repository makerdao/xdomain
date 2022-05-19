#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

cp -f ./ops/Dockerfile ../repos/optimism-monorepo/ops/docker/hardhat/Dockerfile
cp -f ./ops/yarn.lock ../repos/optimism-monorepo/ops/docker/hardhat/yarn.lock
cd ../repos/optimism-monorepo/ops

docker-compose build