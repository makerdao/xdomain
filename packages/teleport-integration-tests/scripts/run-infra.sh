#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Setting up optimism monorepo"
cp -f ./ops/l1_chain.env ../repos/optimism-monorepo/ops/envs/l1_chain.env
cp -f ./ops/dtl.env ../repos/optimism-monorepo/ops/envs/dtl.env

cd ../repos/optimism-monorepo/ops

docker-compose down -v
docker-compose up