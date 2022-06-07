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

import { DaiJoinMock } from "./mocks/DaiJoinMock.sol";
import { DaiMock } from "./mocks/DaiMock.sol";
import { EndMock } from "./mocks/EndMock.sol";
import { EscrowMock } from "./mocks/EscrowMock.sol";
import { VatMock } from "./mocks/VatMock.sol";
import { ClaimToken } from "../ClaimToken.sol";
import { DomainGuest, TeleportGUID } from "../DomainGuest.sol";

contract EmptyDomainGuest is DomainGuest {

    uint256 public releaseBurned;
    uint256 public surplus;
    uint256 public deficit;
    uint256 public tellValue;
    TeleportGUID public teleport;
    bytes32 public flushTargetDomain;
    uint256 public flushDaiToFlush;
    address public withdrawTo;
    uint256 public withdrawAmount;

    constructor(bytes32 _domain, address _daiJoin, address _claimToken) DomainGuest(_domain, _daiJoin, _claimToken) {}

    function _isHost(address) internal override pure returns (bool) {
        return true;
    }
    function _release(uint256 burned) internal override {
        releaseBurned = burned;
    }
    function _surplus(uint256 wad) internal virtual override {
        surplus = wad;
    }
    function _deficit(uint256 wad) internal virtual override {
       deficit = wad;
    }
    function _tell(uint256 value) internal virtual override {
       tellValue = value;
    }
    function _initiateTeleport(TeleportGUID memory _teleport) internal virtual override {
        teleport = _teleport;
    }
    function _flush(bytes32 targetDomain, uint256 daiToFlush) internal virtual override {
        flushTargetDomain = targetDomain;
        flushDaiToFlush = daiToFlush;
    }
    function _withdraw(address to, uint256 amount) internal virtual override {
        withdrawTo = to;
        withdrawAmount = amount;
    }

}

contract DomainGuestTest is DSSTest {

    VatMock vat;
    DaiJoinMock daiJoin;
    DaiMock dai;
    EndMock end;

    ClaimToken claimToken;
    EmptyDomainGuest guest;

    bytes32 constant SOURCE_DOMAIN = "SOME-DOMAIN-A";
    bytes32 constant TARGET_DOMAIN = "SOME-DOMAIN-B";

    function postSetup() internal virtual override {
        vat = new VatMock();
        dai = new DaiMock();
        daiJoin = new DaiJoinMock(address(vat), address(dai));
        end = new EndMock(address(vat));

        claimToken = new ClaimToken();
        guest = new EmptyDomainGuest(SOURCE_DOMAIN, address(daiJoin), address(claimToken));
        guest.file("end", address(end));

        vat.hope(address(daiJoin));
        dai.approve(address(guest), type(uint256).max);
    }

    function testConstructor() public {
        assertEq(guest.domain(), SOURCE_DOMAIN);
        assertEq(address(guest.vat()), address(vat));
        assertEq(address(guest.daiJoin()), address(daiJoin));
        assertEq(address(guest.dai()), address(dai));

        assertEq(vat.can(address(guest), address(daiJoin)), 1);
        assertEq(dai.allowance(address(guest), address(daiJoin)), type(uint256).max);
        assertEq(guest.wards(address(this)), 1);
        assertEq(guest.live(), 1);
    }

    function testRelyDeny() public {
        checkAuth(address(guest), "DomainGuest");
    }

    function testFile() public {
        checkFileAddress(address(guest), "DomainGuest", ["end"]);
    }

    function testLift() public {
        assertEq(guest.grain(), 0);
        assertEq(vat.Line(), 0);

        guest.lift(100 * RAD, 100 ether);

        assertEq(guest.grain(), 100 ether);
        assertEq(vat.Line(), 100 * RAD);
    }

    function testRelease() public {
        // Set debt ceiling to 100 DAI
        guest.lift(100 * RAD, 100 ether);

        assertEq(guest.grain(), 100 ether);
        assertEq(vat.Line(), 100 * RAD);
        assertEq(guest.releaseBurned(), 0);

        // Lower debt ceiling to 50 DAI
        guest.lift(50 * RAD, 0);

        assertEq(guest.grain(), 100 ether);
        assertEq(vat.Line(), 50 * RAD);
        assertEq(guest.releaseBurned(), 0);

        // Should release 50 DAI because nothing has been minted
        guest.release();

        assertEq(guest.grain(), 50 ether);
        assertEq(vat.Line(), 50 * RAD);
        assertEq(guest.releaseBurned(), 50 ether);
    }

    function testReleaseDebtTaken() public {
        // Set so that debt is larger than the global DC
        guest.lift(100 * RAD, 100 ether);
        vat.suck(address(this), address(this), 50 * RAD);
        guest.lift(0, 0);

        assertEq(vat.Line(), 0);
        assertEq(vat.debt(), 50 * RAD);
        assertEq(guest.grain(), 100 ether);
        assertEq(guest.releaseBurned(), 0);

        // Should only release 50 DAI
        guest.release();

        assertEq(vat.Line(), 0);
        assertEq(vat.debt(), 50 * RAD);
        assertEq(guest.grain(), 50 ether);
        assertEq(guest.releaseBurned(), 50 ether);

        // Repay the loan and release
        vat.heal(50 * RAD);
        guest.release();

        assertEq(vat.Line(), 0);
        assertEq(vat.debt(), 0);
        assertEq(guest.grain(), 0);
        assertEq(guest.releaseBurned(), 50 ether);
    }

    function testPushSurplus() public {
        vat.suck(address(this), address(guest), 100 * RAD);

        assertEq(vat.dai(address(guest)), 100 * RAD);
        assertEq(vat.sin(address(guest)), 0);
        assertEq(vat.surf(), 0);
        assertEq(guest.surplus(), 0);
        assertEq(guest.deficit(), 0);

        // Will push out a surplus of 100 DAI
        guest.push();

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 0);
        assertEq(vat.surf(), -int256(100 * RAD));
        assertEq(guest.surplus(), 100 ether);
        assertEq(guest.deficit(), 0);
    }

    function testPushSurplusPartial() public {
        vat.suck(address(this), address(this), 100 * RAD);
        vat.suck(address(guest), address(guest), 25 * RAD);
        vat.move(address(this), address(guest), 100 * RAD);

        assertEq(vat.dai(address(guest)), 125 * RAD);
        assertEq(vat.sin(address(guest)), 25 * RAD);
        assertEq(vat.surf(), 0);
        assertEq(guest.surplus(), 0);
        assertEq(guest.deficit(), 0);

        // Will push out a surplus of 100 DAI (125 - 25)
        guest.push();

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 0);
        assertEq(vat.surf(), -int256(100 * RAD));
        assertEq(guest.surplus(), 100 ether);
        assertEq(guest.deficit(), 0);
    }

    function testPushDeficit() public {
        vat.suck(address(guest), address(this), 100 * RAD);

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 100 * RAD);
        assertEq(guest.surplus(), 0);
        assertEq(guest.deficit(), 0);

        // Will push out a deficit of 100 DAI
        guest.push();

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 100 * RAD);
        assertEq(guest.surplus(), 0);
        assertEq(guest.deficit(), 100 ether);
    }

    function testPushDeficitPartial() public {
        vat.suck(address(guest), address(guest), 100 * RAD);
        vat.suck(address(guest), address(this), 25 * RAD);

        assertEq(vat.dai(address(guest)), 100 * RAD);
        assertEq(vat.sin(address(guest)), 125 * RAD);
        assertEq(guest.surplus(), 0);
        assertEq(guest.deficit(), 0);

        // Will push out a deficit of 25 DAI (125 - 100)
        guest.push();

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 25 * RAD);
        assertEq(guest.surplus(), 0);
        assertEq(guest.deficit(), 25 ether);
    }

    function testRectify() public {
        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.surf(), 0);

        guest.rectify(100 ether);

        assertEq(vat.dai(address(guest)), 100 * RAD);
        assertEq(vat.surf(), int256(100 * RAD));
    }

    function testCage() public {
        assertEq(end.live(), 1);
        assertEq(vat.live(), 1);

        guest.cage();

        assertEq(end.live(), 0);
        assertEq(vat.live(), 0);
    }

    function testTell() public {
        assertEq(guest.tellValue(), 0);

        guest.tell(123);

        assertEq(guest.tellValue(), 123);
    }

    function testMintClaim() public {
        assertEq(claimToken.balanceOf(address(123)), 0);

        claimToken.mint(address(123), 100 ether);

        assertEq(claimToken.balanceOf(address(123)), 100 ether);
    }

    function testDeposit() public {
        assertEq(dai.balanceOf(address(123)), 0);
        assertEq(vat.surf(), 0);

        guest.deposit(address(123), 100 ether);

        assertEq(dai.balanceOf(address(123)), 100 ether);
        assertEq(vat.surf(), int256(100 * RAD));
    }

    function testWithdraw() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);

        assertEq(dai.balanceOf(address(this)), 100 ether);
        assertEq(vat.surf(), 0);

        guest.withdraw(address(123), 100 ether);

        assertEq(dai.balanceOf(address(this)), 0);
        assertEq(vat.surf(), -int256(100 * RAD));
        assertEq(guest.withdrawTo(), address(123));
        assertEq(guest.withdrawAmount(), 100 ether);
    }

    function testInitiateTeleport() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);
        guest.file("validDomains", TARGET_DOMAIN, 1);

        assertEq(dai.balanceOf(address(this)), 100 ether);
        assertEq(guest.batchedDaiToFlush(TARGET_DOMAIN), 0);
        assertEq(guest.nonce(), 0);
        assertEq(vat.surf(), 0);

        guest.initiateTeleport(TARGET_DOMAIN, address(123), 100 ether);
        
        (
            bytes32 sourceDomain,
            bytes32 targetDomain,
            bytes32 receiver,
            bytes32 operator,
            uint128 amount,
            uint80 nonce,
            uint48 timestamp
        ) = guest.teleport();

        assertEq(dai.balanceOf(address(this)), 0);
        assertEq(guest.batchedDaiToFlush(TARGET_DOMAIN), 100 ether);
        assertEq(vat.surf(), -int256(100 * RAD));
        assertEq(guest.nonce(), 1);
        assertEq(sourceDomain, SOURCE_DOMAIN);
        assertEq(targetDomain, TARGET_DOMAIN);
        assertEq(receiver, bytes32(uint256(123)));
        assertEq(operator, bytes32(uint256(0)));
        assertEq(uint256(amount), 100 ether);
        assertEq(uint256(nonce), 0);
        assertEq(uint256(timestamp), block.timestamp);
    }

}
