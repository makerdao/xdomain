// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import "forge-std/Script.sol";

import "./lib/XDomainDss.sol";

// To deploy on a domain with an existing DAI + Token Bridge
contract DeployExistingTokenBridge is Script {

    function run() external {
        vm.startBroadcast();
        DssInstance memory dss = XDomainDss.deploy(vm.envAddress("MCD_PAUSE_PROXY"));
        vm.stopBroadcast();
    }

}
