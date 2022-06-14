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

import "dss-test/DSSTest.sol";

import { DaiJoinMock } from "./mocks/DaiJoinMock.sol";
import { DaiMock } from "./mocks/DaiMock.sol";
import { EndMock } from "./mocks/EndMock.sol";
import { EscrowMock } from "./mocks/EscrowMock.sol";
import { VatMock } from "./mocks/VatMock.sol";
import { ClaimToken } from "../ClaimToken.sol";
import { DomainGuest, TeleportGUID, TeleportGUIDHelper } from "../DomainGuest.sol";

contract EmptyDomainGuest is DomainGuest {

    bool forceIsHost = true;
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

    function setIsHost(bool v) external {
        forceIsHost = v;
    }
    function _isHost(address) internal override view returns (bool) {
        return forceIsHost;
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

contract ClaimTokenMock {
    mapping (address => uint256) public balanceOf;
    function mint(address usr, uint256 amount) external {
        balanceOf[usr] += amount;
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

    event File(bytes32 indexed what, bytes32 indexed domain, uint256 data);
    event Lift(uint256 id, uint256 line, uint256 minted);
    event Release(uint256 burned);
    event Push(int256 surplus);
    event Rectify(uint256 wad);
    event Cage();
    event Tell(uint256 value);
    event MintClaim(address indexed usr, uint256 claim);
    event Deposit(address indexed to, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event InitiateTeleport(TeleportGUID teleport);
    event Flush(bytes32 indexed targetDomain, uint256 dai);

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
        guest.file("validDomains", TARGET_DOMAIN, 1);
        claimToken.rely(address(guest));
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

        // Also check the validDomains
        guest.file("validDomains", TARGET_DOMAIN, 0);
        assertEq(guest.validDomains(TARGET_DOMAIN), 0);

        vm.expectEmit(true, true, true, true);
        emit File("validDomains", TARGET_DOMAIN, 1);
        guest.file("validDomains", TARGET_DOMAIN, 1);
        assertEq(guest.validDomains(TARGET_DOMAIN), 1);

        // Invalid name
        vm.expectRevert("DomainGuest/file-unrecognized-param");
        guest.file("badWhat", TARGET_DOMAIN, 1);

        // Invalid value
        vm.expectRevert("DomainGuest/invalid-data");
        guest.file("validDomains", TARGET_DOMAIN, 2);

        // Not authed
        guest.deny(address(this));
        vm.expectRevert("DomainGuest/not-authorized");
        guest.file("validDomains", TARGET_DOMAIN, 1);
    }

    function testAuth() public {
        guest.deny(address(this));

        bytes[] memory funcs = new bytes[](1);
        funcs[0] = abi.encodeWithSelector(DomainGuest.tell.selector, 0);

        for (uint256 i = 0; i < funcs.length; i++) {
            assertRevert(address(guest), funcs[i], "DomainGuest/not-authorized");
        }
    }

    function testHostOnly() public {
        guest.setIsHost(false);

        bytes[] memory funcs = new bytes[](5);
        funcs[0] = abi.encodeWithSelector(DomainGuest.lift.selector, 0, 0, 0);
        funcs[1] = abi.encodeWithSelector(DomainGuest.rectify.selector, 0);
        funcs[2] = abi.encodeWithSelector(DomainGuest.cage.selector);
        funcs[3] = abi.encodeWithSelector(DomainGuest.mintClaim.selector, 0, 0);
        funcs[4] = abi.encodeWithSelector(DomainGuest.deposit.selector, address(0), 0);

        for (uint256 i = 0; i < funcs.length; i++) {
            assertRevert(address(guest), funcs[i], "DomainGuest/not-host");
        }
    }

    function testLive() public {
        guest.cage();

        bytes[] memory funcs = new bytes[](4);
        funcs[0] = abi.encodeWithSelector(DomainGuest.lift.selector, 0, 0, 0);
        funcs[1] = abi.encodeWithSelector(DomainGuest.release.selector);
        funcs[2] = abi.encodeWithSelector(DomainGuest.push.selector);
        funcs[3] = abi.encodeWithSelector(DomainGuest.cage.selector, 0, 0);

        for (uint256 i = 0; i < funcs.length; i++) {
            assertRevert(address(guest), funcs[i], "DomainGuest/not-live");
        }
    }

    function testLift() public {
        assertEq(guest.grain(), 0);
        assertEq(guest.liftId(), 0);
        assertEq(vat.Line(), 0);

        vm.expectEmit(true, true, true, true);
        emit Lift(1, 100 * RAD, 100 ether);
        guest.lift(1, 100 * RAD, 100 ether);

        assertEq(guest.grain(), 100 ether);
        assertEq(guest.liftId(), 1);
        assertEq(vat.Line(), 100 * RAD);
    }

    function testLiftSkipId() public {
        assertEq(guest.grain(), 0);
        assertEq(guest.liftId(), 0);
        assertEq(vat.Line(), 0);

        guest.lift(2, 100 * RAD, 100 ether);

        assertEq(guest.grain(), 100 ether);
        assertEq(guest.liftId(), 2);
        assertEq(vat.Line(), 100 * RAD);
    }

    function testLiftOutOfOrder() public {
        assertEq(guest.grain(), 0);
        assertEq(guest.liftId(), 0);
        assertEq(vat.Line(), 0);

        guest.lift(2, 100 * RAD, 50 ether);

        assertEq(guest.grain(), 50 ether);
        assertEq(guest.liftId(), 2);
        assertEq(vat.Line(), 100 * RAD);

        guest.lift(1, 50 * RAD, 50 ether);

        assertEq(guest.grain(), 100 ether);
        assertEq(guest.liftId(), 2);
        assertEq(vat.Line(), 100 * RAD);
    }

    function testRelease() public {
        // Set debt ceiling to 100 DAI
        guest.lift(1, 100 * RAD, 100 ether);

        assertEq(guest.grain(), 100 ether);
        assertEq(vat.Line(), 100 * RAD);
        assertEq(guest.releaseBurned(), 0);

        // Lower debt ceiling to 50 DAI
        guest.lift(2, 50 * RAD, 0);

        assertEq(guest.grain(), 100 ether);
        assertEq(vat.Line(), 50 * RAD);
        assertEq(guest.releaseBurned(), 0);

        // Should release 50 DAI because nothing has been minted
        vm.expectEmit(true, true, true, true);
        emit Release(50 ether);
        guest.release();

        assertEq(guest.grain(), 50 ether);
        assertEq(vat.Line(), 50 * RAD);
        assertEq(guest.releaseBurned(), 50 ether);
    }

    function testReleaseDebtTaken() public {
        // Set so that debt is larger than the global DC
        guest.lift(1, 100 * RAD, 100 ether);
        vat.suck(address(this), address(this), 50 * RAD);
        guest.lift(2, 0, 0);

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
        vm.expectEmit(true, true, true, true);
        emit Push(int256(100 ether));
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
        vm.expectEmit(true, true, true, true);
        emit Push(-int256(100 ether));
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

        vm.expectEmit(true, true, true, true);
        emit Rectify(100 ether);
        guest.rectify(100 ether);

        assertEq(vat.dai(address(guest)), 100 * RAD);
        assertEq(vat.surf(), int256(100 * RAD));
    }

    function testCage() public {
        assertEq(end.live(), 1);
        assertEq(vat.live(), 1);

        vm.expectEmit(true, true, true, true);
        emit Cage();
        guest.cage();

        assertEq(end.live(), 0);
        assertEq(vat.live(), 0);
    }

    function testTell() public {
        assertEq(guest.tellValue(), 0);

        vm.expectEmit(true, true, true, true);
        emit Tell(123);
        guest.tell(123);

        assertEq(guest.tellValue(), 123);
    }

    function testMintClaim() public {
        assertEq(claimToken.balanceOf(address(123)), 0);

        vm.expectEmit(true, true, true, true);
        emit MintClaim(address(123), 100 ether);
        guest.mintClaim(address(123), 100 ether);

        assertEq(claimToken.balanceOf(address(123)), 100 ether);
    }

    function testDeposit() public {
        assertEq(dai.balanceOf(address(123)), 0);
        assertEq(vat.surf(), 0);

        vm.expectEmit(true, true, true, true);
        emit Deposit(address(123), 100 ether);
        guest.deposit(address(123), 100 ether);

        assertEq(dai.balanceOf(address(123)), 100 ether);
        assertEq(vat.surf(), int256(100 * RAD));
    }

    function testWithdraw() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);

        assertEq(dai.balanceOf(address(this)), 100 ether);
        assertEq(vat.surf(), 0);

        vm.expectEmit(true, true, true, true);
        emit Withdraw(address(123), 100 ether);
        guest.withdraw(address(123), 100 ether);

        assertEq(dai.balanceOf(address(this)), 0);
        assertEq(vat.surf(), -int256(100 * RAD));
        assertEq(guest.withdrawTo(), address(123));
        assertEq(guest.withdrawAmount(), 100 ether);
    }

    function testInitiateTeleport() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);

        assertEq(dai.balanceOf(address(this)), 100 ether);
        assertEq(guest.batchedDaiToFlush(TARGET_DOMAIN), 0);
        assertEq(guest.nonce(), 0);
        assertEq(vat.surf(), 0);

        TeleportGUID memory teleport = TeleportGUID({
            sourceDomain: SOURCE_DOMAIN,
            targetDomain: TARGET_DOMAIN,
            receiver: TeleportGUIDHelper.addressToBytes32(address(123)),
            operator: TeleportGUIDHelper.addressToBytes32(address(0)),
            amount: 100 ether,
            nonce: 0,
            timestamp: uint48(block.timestamp)
        });

        vm.expectEmit(true, true, true, true);
        emit InitiateTeleport(teleport);
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

    function testInitiateTeleportInvalidDomain() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);
        guest.file("validDomains", TARGET_DOMAIN, 0);

        vm.expectRevert("DomainGuest/invalid-domain");
        guest.initiateTeleport(TARGET_DOMAIN, address(123), 100 ether);
    }

    function testFlush() public {
        // To batch some DAI
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);
        guest.initiateTeleport(TARGET_DOMAIN, address(123), 100 ether);

        assertEq(guest.batchedDaiToFlush(TARGET_DOMAIN), 100 ether);

        vm.expectEmit(true, true, true, true);
        emit Flush(TARGET_DOMAIN, 100 ether);
        guest.flush(TARGET_DOMAIN);

        assertEq(guest.batchedDaiToFlush(TARGET_DOMAIN), 0);
        assertEq(guest.flushTargetDomain(), TARGET_DOMAIN);
        assertEq(guest.flushDaiToFlush(), 100 ether);
    }

    function testFlushNoDaiToFlush() public {
        vm.expectRevert("DomainGuest/zero-dai-flush");
        guest.flush(TARGET_DOMAIN);
    }

}
