all    :; forge build --use solc:0.8.14
clean  :; forge clean
test   :; ./test.sh $(match)
deploy :; forge script script/DeployExistingTokenBridge.s.sol:DeployExistingTokenBridge --use solc:0.8.14 --rpc-url $(ETH_RPC_URL) --broadcast --verify -vvvv
