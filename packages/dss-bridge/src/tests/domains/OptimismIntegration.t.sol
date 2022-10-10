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

import "./IntegrationBase.t.sol";

import { OptimismDomainHost } from "../../domains/optimism/OptimismDomainHost.sol";
import { OptimismDomainGuest } from "../../domains/optimism/OptimismDomainGuest.sol";

contract OptimismIntegrationTest is IntegrationBaseTest {

    function setupGuestDomain() internal virtual override returns (BridgedDomain) {
        return new OptimismDomain(config, "optimism", rootDomain);
    }

    function setupGuestDai() internal virtual override returns (address) {
        // DAI is already deployed on this domain
        return 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1;
    }

    function setupDomains() internal virtual override {
        // Primary domain
        escrow = EscrowLike(mcd.chainlog().getAddress("OPTIMISM_ESCROW"));
        // Pre-calc the guest nonce
        address guestAddr = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), bytes1(0x0e))))));
        OptimismDomainHost _host = new OptimismDomainHost(
            HOST_DOMAIN_ILK,
            address(mcd.daiJoin()),
            address(escrow),
            mcd.chainlog().getAddress("MCD_ROUTER_TELEPORT_FW_A"),
            address(OptimismDomain(address(guestDomain)).l1Messenger()),
            guestAddr
        );
        _host.file("glLift", 1_000_000);
        _host.file("glRectify", 1_000_000);
        _host.file("glCage", 1_000_000);
        _host.file("glExit", 1_000_000);
        _host.file("glDeposit", 1_000_000);
        _host.file("glInitializeRegisterMint", 1_000_000);
        _host.file("glInitializeSettle", 1_000_000);
        host = DomainHost(_host);

        // Remote domain
        guestDomain.selectFork();
        OptimismDomainGuest _guest = new OptimismDomainGuest(
            HOST_DOMAIN_ILK,
            address(rmcd.daiJoin()),
            address(claimToken),
            address(0),
            address(OptimismDomain(address(guestDomain)).l2Messenger()),
            address(host)
        );
        assertEq(address(_guest), guestAddr, "guest address mismatch");
        _guest.filegl("glRelease", 1_000_000);
        _guest.filegl("glPush", 1_000_000);
        _guest.filegl("glTell", 1_000_000);
        _guest.filegl("glWithdraw", 1_000_000);
        _guest.filegl("glFlush", 1_000_000);
        _guest.filegl("glInitializeRegisterMint", 1_000_000);
        _guest.filegl("glInitializeSettle", 1_000_000);
        guest = DomainGuest(_guest);

        // Set back to primary before returning control
        rootDomain.selectFork();
    }

    function hostLift(uint256 wad) internal virtual override {
        OptimismDomainHost(address(host)).lift(wad);
    }

    function hostRectify() internal virtual override {
        OptimismDomainHost(address(host)).rectify();
    }

    function hostCage() internal virtual override {
        OptimismDomainHost(address(host)).cage();
    }

    function hostExit(address usr, uint256 wad) internal virtual override {
        OptimismDomainHost(address(host)).exit(usr, wad);
    }

    function hostDeposit(address to, uint256 amount) internal virtual override {
        OptimismDomainHost(address(host)).deposit(to, amount);
    }

    function guestRelease() internal virtual override {
        OptimismDomainGuest(address(guest)).release();
    }

    function guestPush() internal virtual override {
        OptimismDomainGuest(address(guest)).push();
    }

    function guestTell() internal virtual override {
        OptimismDomainGuest(address(guest)).tell();
    }

    function guestWithdraw(address to, uint256 amount) internal virtual override {
        OptimismDomainGuest(address(guest)).withdraw(to, amount);
    }

}
