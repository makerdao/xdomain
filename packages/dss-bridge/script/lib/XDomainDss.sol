// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import { Vm } from "forge-std/Vm.sol";
import { Cure } from "xdomain-dss/Cure.sol";
import { Dai } from "xdomain-dss/Dai.sol";
import { DaiJoin } from "xdomain-dss/DaiJoin.sol";
import { End } from "xdomain-dss/End.sol";
import { Pot } from "xdomain-dss/Pot.sol";
import { Jug } from "xdomain-dss/Jug.sol";
import { Spotter } from "xdomain-dss/Spotter.sol";
import { Vat } from "xdomain-dss/Vat.sol";

struct DssInstance {
    Vat vat;
    Dai dai;
    DaiJoin daiJoin;
    Spotter spotter;
    Pot pot;
    Jug jug;
    Cure cure;
    End end;
}

interface AuthLike {
    function rely(address) external;
    function deny(address) external;
}

// Tools for deploying and setting up an xdomain-dss instance
library XDomainDss {

    function switchOwner(address base, address newOwner) internal {
        AuthLike(base).rely(newOwner);
        AuthLike(base).deny(address(this));
    }

    function deploy(address owner) internal returns (DssInstance memory dss) {
        // Deploy contracts
        dss.vat = new Vat();
        dss.dai = new Dai();
        dss.daiJoin = new DaiJoin(address(dss.vat), address(dss.dai));
        //dss.dog = new Dog();  // Needs merge in xdomain-dss
        dss.spotter = new Spotter(address(dss.vat));
        dss.pot = new Pot(address(dss.vat));
        dss.jug = new Jug(address(dss.vat));
        dss.cure = new Cure();
        dss.end = new End();

        switchOwner(address(dss.vat), owner);
        switchOwner(address(dss.dai), owner);
        switchOwner(address(dss.spotter), owner);
        switchOwner(address(dss.pot), owner);
        switchOwner(address(dss.jug), owner);
        switchOwner(address(dss.cure), owner);
        switchOwner(address(dss.end), owner);
    }

    function init(DssInstance memory dss) internal {
        dss.vat.rely(address(dss.jug));
        //dss.vat.rely(address(dss.dog));
        dss.vat.rely(address(dss.pot));
        dss.vat.rely(address(dss.jug));
        dss.vat.rely(address(dss.spotter));
        dss.vat.rely(address(dss.end));

        dss.dai.rely(address(dss.daiJoin));

        //dss.dog.file("vow", address(dss.vow));

        dss.pot.rely(address(dss.end));

        dss.spotter.rely(address(dss.end));

        dss.end.file("vat", address(dss.vat));
        dss.end.file("pot", address(dss.pot));
        dss.end.file("spot", address(dss.spotter));
        dss.end.file("cure", address(dss.cure));
        //dss.end.file("vow", address(dss.vow));

        dss.cure.rely(address(dss.end));
    }

}
