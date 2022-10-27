// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import "forge-std/Script.sol";
import "dss-test/domains/Domain.sol";

import "./lib/XDomainDss.sol";

// To deploy on a domain with an existing DAI + Token Bridge
contract DeployExistingTokenBridge is Script {

    string config;

    Domain hostDomain;
    address hostAdmin;

    Domain guestDomain;
    address guestAdmin;

    function readInput(string memory input) internal returns (string memory) {
        string memory root = vm.projectRoot();
        string memory chainInputFolder = string.concat("/script/input/", vm.toString(block.chainid), "/");
        return vm.readFile(string.concat(root, chainInputFolder, string.concat(input, ".json")));
    }

    function run() external {
        config = readInput("config");

        hostDomain = new Domain(config, vm.envString("DEPLOY_HOST"));
        hostAdmin = hostDomain.readConfigAddress("admin");
        
        guestDomain = new Domain(config, vm.envString("DEPLOY_GUEST"));
        guestAdmin = guestDomain.readConfigAddress("admin");

        vm.startBroadcast();
        DssInstance memory dss = XDomainDss.deploy(guestAdmin);
        vm.stopBroadcast();
    }

}
