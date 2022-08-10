#!/usr/bin/env bash
set -e
ROOT=$(cd $(dirname $(dirname "$0")) && pwd)

echo "Setting up dss-teleport"
cd "$ROOT/repos/dss-teleport"
git submodule update --init --recursive
nix-shell --argstr url "N/A" --run "dapp --use solc:0.8.15 build --rpc"

echo "Setting up optimism-dai-bridge"
cd "$ROOT/../optimism-dai-bridge"
yarn
yarn build

echo "Setting up arbitrum-dai-bridge"
cd "$ROOT/../arbitrum-dai-bridge"
yarn
yarn build

echo "Setting up local test contracts"
cd $ROOT
yarn
yarn build

echo "Setting up ./external-artifacts dir"
node ./scripts/copy-artifacts.js
yarn typechain
yarn eth-sdk