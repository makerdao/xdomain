#!/usr/bin/env bash
set -e

export DEPLOY_HOST="$1"
export DEPLOY_GUEST="$2"

forge script script/DeployExistingTokenBridge.s.sol:DeployExistingTokenBridge --use solc:0.8.14 --rpc-url $ETH_RPC_URL --broadcast --verify -vvvv
