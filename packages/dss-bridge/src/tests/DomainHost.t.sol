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
import { EscrowMock } from "./mocks/EscrowMock.sol";
import { RouterMock } from "./mocks/RouterMock.sol";
import { VatMock } from "./mocks/VatMock.sol";
import { DomainHost, DomainGuest } from "../DomainHost.sol";
import "../TeleportGUID.sol";

contract EmptyDomainHost is DomainHost {

    bool forceIsGuest = true;
    bytes public lastPayload;

    constructor(bytes32 _ilk, address _daiJoin, address _escrow, address _router) DomainHost(_ilk, _daiJoin, _escrow, _router) {}

    function setIsGuest(bool v) external {
        forceIsGuest = v;
    }
    function _isGuest(address) internal override view returns (bool) {
        return forceIsGuest;
    }

    function lift(uint256 wad) external {
        lastPayload = _lift(wad);
    }
    function rectify() external {
        lastPayload = _rectify();
    }
    function cage() external {
        lastPayload = _cage();
    }
    function exit(address usr, uint256 wad) external {
        lastPayload = _exit(usr, wad);
    }
    function deposit(address to, uint256 amount) external {
        lastPayload = _deposit(to, amount);
    }

}

contract DomainHostTest is DSSTest {

    VatMock vat;
    DaiJoinMock daiJoin;
    DaiMock dai;
    EscrowMock escrow;
    RouterMock router;
    address vow;

    EmptyDomainHost host;

    bytes32 constant ILK = "SOME-DOMAIN-A";

    event Lift(uint256 wad);
    event Release(uint256 wad);
    event Push(int256 wad);
    event Rectify(uint256 wad);
    event Cage();
    event Tell(uint256 value);
    event Exit(address indexed usr, uint256 wad, uint256 claim);
    event Deposit(address indexed to, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event TeleportSlowPath(TeleportGUID teleport);
    event Flush(bytes32 targetDomain, uint256 daiToFlush);

    function postSetup() internal virtual override {
        vat = new VatMock();
        dai = new DaiMock();
        daiJoin = new DaiJoinMock(address(vat), address(dai));
        escrow = new EscrowMock();
        vow = address(123);
        router = new RouterMock(address(dai));

        host = new EmptyDomainHost(ILK, address(daiJoin), address(escrow), address(router));
        host.file("vow", vow);

        escrow.approve(address(dai), address(host), type(uint256).max);
        vat.hope(address(daiJoin));
    }

    function testConstructor() public {
        assertEq(host.ilk(), ILK);
        assertEq(address(host.vat()), address(vat));
        assertEq(address(host.daiJoin()), address(daiJoin));
        assertEq(address(host.dai()), address(dai));
        assertEq(address(host.escrow()), address(escrow));
        assertEq(address(host.router()), address(router));

        assertEq(vat.can(address(host), address(daiJoin)), 1);
        assertEq(dai.allowance(address(host), address(daiJoin)), type(uint256).max);
        assertEq(dai.allowance(address(host), address(router)), type(uint256).max);
        assertEq(host.wards(address(this)), 1);
        assertEq(host.live(), 1);
    }

    function testRelyDeny() public {
        checkAuth(address(host), "DomainHost");
    }

    function testFile() public {
        checkFileAddress(address(host), "DomainHost", ["vow"]);
    }

    function testAuth() public {
        host.deny(address(this));

        bytes[] memory funcs = new bytes[](1);
        funcs[0] = abi.encodeWithSelector(EmptyDomainHost.lift.selector, 0);

        for (uint256 i = 0; i < funcs.length; i++) {
            assertRevert(address(host), funcs[i], "DomainHost/not-authorized");
        }
    }

    function testGuestOnly() public {
        host.setIsGuest(false);

        bytes[] memory funcs = new bytes[](6);
        funcs[0] = abi.encodeWithSelector(DomainHost.release.selector, 0);
        funcs[1] = abi.encodeWithSelector(DomainHost.push.selector, 0);
        funcs[2] = abi.encodeWithSelector(DomainHost.tell.selector, 0);
        funcs[3] = abi.encodeWithSelector(DomainHost.withdraw.selector, address(0), 0);
        TeleportGUID memory teleport = TeleportGUID({
            sourceDomain: "l2network",
            targetDomain: "ethereum",
            receiver: TeleportGUIDHelper.addressToBytes32(address(123)),
            operator: TeleportGUIDHelper.addressToBytes32(address(this)),
            amount: 100 ether,
            nonce: 5,
            timestamp: uint48(block.timestamp)
        });
        funcs[4] = abi.encodeWithSelector(DomainHost.teleportSlowPath.selector, teleport);
        funcs[5] = abi.encodeWithSelector(DomainHost.flush.selector, bytes32(0), 0);

        for (uint256 i = 0; i < funcs.length; i++) {
            assertRevert(address(host), funcs[i], "DomainHost/not-guest");
        }
    }

    function testVatLive() public {
        vat.cage();

        bytes[] memory funcs = new bytes[](3);
        funcs[0] = abi.encodeWithSelector(EmptyDomainHost.lift.selector, 0);
        funcs[1] = abi.encodeWithSelector(DomainHost.release.selector, 0);
        funcs[2] = abi.encodeWithSelector(EmptyDomainHost.rectify.selector, 0);

        for (uint256 i = 0; i < funcs.length; i++) {
            assertRevert(address(host), funcs[i], "DomainHost/vat-not-live");
        }
    }

    function testLift() public {
        // Set DC to 100
        vm.expectEmit(true, true, true, true);
        emit Lift(100 ether);
        host.lift(100 ether);

        (uint256 ink, uint256 art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(host.grain(), 100 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, int256(100 * RAD)));

        // Raise DC to 200
        host.lift(200 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 200 ether);
        assertEq(art, 200 ether);
        assertEq(dai.balanceOf(address(escrow)), 200 ether);
        assertEq(host.line(), 200 * RAD);
        assertEq(host.grain(), 200 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, int256(100 * RAD)));

        // Lower DC back to 100 - should not remove escrowed DAI
        host.lift(100 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 200 ether);
        assertEq(art, 200 ether);
        assertEq(dai.balanceOf(address(escrow)), 200 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(host.grain(), 200 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, -int256(100 * RAD)));
    }

    function testRelease() public {
        // Set DC to 100
        host.lift(100 ether);

        (uint256 ink, uint256 art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(host.grain(), 100 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, int256(100 * RAD)));

        // Lower DC back to 50 - should not remove escrowed DAI
        host.lift(50 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 100 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, -int256(50 * RAD)));

        // Remote domain triggers release at a later time
        vm.expectEmit(true, true, true, true);
        emit Release(50 ether);
        host.release(50 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(dai.balanceOf(address(escrow)), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 50 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, -int256(50 * RAD)));
    }

    function testAsyncReordering() public {
        host.lift(100 ether);
        host.lift(50 ether);        // Trigger lowering
        host.lift(75 ether);        // Trigger raise before the release comes in
        host.lift(50 ether);        // Trigger another lowering

        (uint256 ink, uint256 art) = vat.urns(ILK, address(host));
        assertEq(ink, 125 ether);
        assertEq(art, 125 ether);
        assertEq(dai.balanceOf(address(escrow)), 125 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 125 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, -int256(25 * RAD)));

        host.release(50 ether);   // First release comes in

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 75 ether);
        assertEq(art, 75 ether);
        assertEq(dai.balanceOf(address(escrow)), 75 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 75 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, -int256(25 * RAD)));

        host.release(25 ether);   // Second release comes in

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(dai.balanceOf(address(escrow)), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 50 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.lift.selector, -int256(25 * RAD)));
    }

    function testPushSurplus() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(escrow), 100 ether);

        assertEq(vat.dai(vow), 0);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.sin(), 0);

        vm.expectEmit(true, true, true, true);
        emit Push(int256(100 ether));
        host.push(int256(100 ether));

        assertEq(vat.dai(vow), 100 * RAD);
        assertEq(dai.balanceOf(address(escrow)), 0);
        assertEq(host.sin(), 0);
    }

    function testPushDeficit() public {
        assertEq(host.sin(), 0);

        vm.expectEmit(true, true, true, true);
        emit Push(-int256(100 ether));
        host.push(-int256(100 ether));

        assertEq(host.sin(), 100 ether);
    }

    function testRectify() public {
        host.push(-int256(100 ether));

        assertEq(vat.sin(vow), 0);
        assertEq(dai.balanceOf(address(escrow)), 0);
        assertEq(host.sin(), 100 ether);

        vm.expectEmit(true, true, true, true);
        emit Rectify(100 ether);
        host.rectify();

        assertEq(vat.sin(vow), 100 * RAD);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.rectify.selector, 100 ether));
    }

    function testRectifyNoSin() public {
        vm.expectRevert("DomainHost/no-sin");
        host.rectify();
    }

    function testCage() public {
        // Can cage now
        vm.expectEmit(true, true, true, true);
        emit Cage();
        host.cage();

        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.cage.selector));
    }

    function testCagePermissionlessly() public {
        host.deny(address(this));

        // Cannot cage when vat is live
        vm.expectRevert("DomainHost/not-authorized");
        host.cage();

        // Cage the vat
        vat.cage();

        // Can cage now
        vm.expectEmit(true, true, true, true);
        emit Cage();
        host.cage();

        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.cage.selector));
    }

    function testCageTwice() public {
        host.cage();

        vm.expectRevert("DomainHost/not-live");
        host.cage();
    }

    function testTell() public {
        host.lift(100 ether);
        host.cage();

        assertEq(host.cure(), 0);
        assertTrue(!host.cureReported());

        vm.expectEmit(true, true, true, true);
        emit Tell(100 * RAD);
        host.tell(100 * RAD);

        assertEq(host.cure(), 100 * RAD);
        assertTrue(host.cureReported());
    }

    function testTellNotCaged() public {
        host.lift(100 ether);

        vm.expectRevert("DomainHost/live");
        host.tell(100 * RAD);
    }

    function testTellCureBadValue() public {
        host.lift(50 ether);
        host.cage();

        vm.expectRevert("DomainHost/cure-bad-value");
        host.tell(100 * RAD);
    }

    function testTellTwice() public {
        host.lift(100 ether);
        host.cage();
        host.tell(100 * RAD);

        vm.expectRevert("DomainHost/cure-reported");
        host.tell(50 * RAD);
    }

    function testExit() public {
        // Setup initial conditions
        host.lift(100 ether);       // DC raised to 100
        vat.cage();
        host.cage();
        host.tell(70 * RAD);        // Guest later reports on 30 debt is actually used

        // Simulate user getting some gems for this ilk (normally handled by end)
        vat.slip(ILK, address(this), 50 ether);

        vm.expectEmit(true, true, true, true);
        emit Exit(address(123), 50 ether, 15 ether);
        host.exit(address(123), 50 ether);

        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.mintClaim.selector, address(123), 15 ether));     // 50% of 30 debt is 15
    }

    function testDeposit() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(this), 100 ether);
        dai.approve(address(host), 100 ether);

        assertEq(dai.balanceOf(address(this)), 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 0);

        vm.expectEmit(true, true, true, true);
        emit Deposit(address(123), 100 ether);
        host.deposit(address(123), 100 ether);

        assertEq(dai.balanceOf(address(this)), 0);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.lastPayload(), abi.encodeWithSelector(DomainGuest.deposit.selector, address(123), 100 ether));
    }

    function testWithdraw() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(escrow), 100 ether);

        assertEq(dai.balanceOf(address(123)), 0);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);

        vm.expectEmit(true, true, true, true);
        emit Withdraw(address(123), 100 ether);
        host.withdraw(address(123), 100 ether);

        assertEq(dai.balanceOf(address(123)), 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 0);
    }

    function testTeleportSlowPath() public {
        TeleportGUID memory guid = TeleportGUID({
            sourceDomain: "l2network",
            targetDomain: "ethereum",
            receiver: TeleportGUIDHelper.addressToBytes32(address(123)),
            operator: TeleportGUIDHelper.addressToBytes32(address(this)),
            amount: 100 ether,
            nonce: 5,
            timestamp: uint48(block.timestamp)
        });

        assertEq(dai.balanceOf(address(123)), 0);

        vm.expectEmit(true, true, true, true);
        emit TeleportSlowPath(guid);
        host.teleportSlowPath(guid);

        assertEq(dai.balanceOf(address(123)), 100 ether);
    }

    function testFlush() public {
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(escrow), 100 ether);

        assertEq(dai.balanceOf(address(router)), 0);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);

        vm.expectEmit(true, true, true, true);
        emit Flush("ethereum", 100 ether);
        host.flush("ethereum", 100 ether);

        assertEq(dai.balanceOf(address(router)), 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 0);
    }

}
