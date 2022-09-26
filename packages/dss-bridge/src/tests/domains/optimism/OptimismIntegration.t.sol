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

pragma solidity ^0.8.14;

import { OptimismDomain } from "dss-test/domains/OptimismDomain.sol";

import "../../IntegrationBase.t.sol";

import { OptimismDomainHost } from "../../../domains/optimism/OptimismDomainHost.sol";
import { OptimismDomainGuest } from "../../../domains/optimism/OptimismDomainGuest.sol";

contract OptimismIntegrationTest is IntegrationBaseTest {

    function getRemoteDomain() internal virtual override view returns (BridgedDomain) {
        return new OptimismDomain("optimism", primaryDomain);
    }

    function getRemoteDai() internal virtual override view returns (address) {
        // DAI is already deployed on this domain
        return 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1;
    }

    function setupDomains() internal virtual override {
        // Primary domain
        escrow = EscrowLike(mcd.chainlog().getAddress("OPTIMISM_ESCROW"));
        // Pre-calc the guest nonce
        address guestAddr = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), bytes1(0x09))))));
        OptimismDomainHost _host = new OptimismDomainHost(DOMAIN_ILK, address(mcd.daiJoin()), address(escrow), mcd.chainlog().getAddress("MCD_ROUTER_TELEPORT_FW_A"), OptimismDomain(remoteDomain).l1messenger(), guestAddr);
        host.file("glLift", 1_000_000);
        host.file("glRectify", 1_000_000);
        host.file("glCage", 1_000_000);
        host.file("glExit", 1_000_000);
        host.file("glDeposit", 1_000_000);
        host = DomainHost(_host);

        // Remote domain
        remoteDomain.makeActive();
        guest = DomainGuest(new OptimismDomainGuest(DOMAIN_ILK, address(rmcd.daiJoin()), address(claimToken), OptimismDomain(remoteDomain).l2messenger(), address(host)));
        assertEq(address(guest), guestAddr);

        // Set back to primary before returning control
        primaryDomain.makeActive();
    }

}
