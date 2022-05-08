// SPDX-License-Identifier: AGPL-3.0-or-later

/// DomainJoin.sol -- xdomain join adapter

// Copyright (C) 2022 Dai Foundation
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

pragma solidity ^0.8.13;

import "dss-test/DSSTest.sol";
import {
    VatAbstract
} from "dss-interfaces/Interfaces.sol";

import { ClaimToken } from "../ClaimToken.sol";
import { DomainHost } from "../DomainHost.sol";
import { DomainGuest } from "../DomainGuest.sol";

contract SimpleDomainHost is DomainHost {

    DomainGuest guest;

    constructor(bytes32 _ilk, address _daiJoin, address _escrow) DomainHost(_ilk, _daiJoin, _escrow) {}

    function setGuest(address _guest) external {
        guest = DomainGuest(_guest);
    }

    function _lift(uint256 _line, uint256 _minted) internal override {
        guest.lift(_line, _minted);
    }
    function _rectify(uint256 wad) internal virtual override {
        dai.transfer(address(guest), wad);
        guest.rectify();
    }
    function _cage() internal virtual override {
        guest.cage();
    }
    function _mintClaim(address usr, uint256 claim) internal virtual override {
        guest.mintClaim(usr, claim);
    }

}

contract SimpleDomainGuest is DomainGuest {

    DomainHost host;

    constructor(address _daiJoin, address _claimToken, address _host) DomainGuest(_daiJoin, _claimToken) {
        host = DomainHost(_host);
    }

    function _release(uint256 burned, uint256 totalDebt) internal override {
        host.release(burned, totalDebt);
    }
    function _surplus(uint256 wad) internal virtual override {
        dai.transfer(address(host), wad);
        host.surplus();
    }
    function _deficit(uint256 wad) internal virtual override {
        host.deficit(wad);
    }
    function _tell(uint256 value) internal virtual override {
       host.tell(value);
    }

}

contract IntegrationTest is DSSTest {

    // Bridge
    ClaimToken claimToken;
    SimpleDomainHost host;
    SimpleDomainGuest guest;

    // Remote domain MCD deploy
    

    bytes32 constant ILK = "SOME-DOMAIN-A";

    function setupEnv() internal virtual override returns (MCD) {
        return autoDetectEnv();
    }

    function postSetup() internal virtual override {
        claimToken = new ClaimToken();
        host = new SimpleDomainHost(ILK, address(mcd.daiJoin()), mcd.chainlog().getAddress("OPTIMISM_ESCROW"));
        guest = new SimpleDomainGuest(address(mcd.daiJoin()), address(claimToken));
        guest.file("end", address(end));
    }

}
