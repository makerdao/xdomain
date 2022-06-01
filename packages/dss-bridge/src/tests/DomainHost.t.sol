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
import { EscrowMock } from "./mocks/EscrowMock.sol";
import { VatMock } from "./mocks/VatMock.sol";
import { DomainHost } from "../DomainHost.sol";

contract EmptyDomainHost is DomainHost {

    uint256 public liftLine;
    uint256 public liftMinted;
    uint256 public rectify;
    bool public caged;
    address public claimUsr;
    uint256 public claimAmount;

    constructor(bytes32 _ilk, address _daiJoin, address _escrow, address _router) DomainHost(_ilk, _daiJoin, _escrow, _router) {}

    function _isGuest(address) internal override view returns (bool) {
        return true;
    }
    function _lift(uint256 _line, uint256 _minted) internal override {
        liftLine = _line;
        liftMinted = _minted;
    }
    function _rectify(uint256 wad) internal virtual override {
        rectify = wad;
    }
    function _cage() internal virtual override {
        caged = true;
    }
    function _mintClaim(address usr, uint256 claim) internal virtual override {
        claimUsr = usr;
        claimAmount = claim;
    }

}

contract DomainHostTest is DSSTest {

    VatMock vat;
    DaiJoinMock daiJoin;
    DaiMock dai;
    EscrowMock escrow;
    address vow;

    EmptyDomainHost host;

    bytes32 constant ILK = "SOME-DOMAIN-A";

    function postSetup() internal virtual override {
        vat = new VatMock();
        dai = new DaiMock();
        daiJoin = new DaiJoinMock(address(vat), address(dai));
        escrow = new EscrowMock();
        vow = address(123);

        // TODO - add mock router
        host = new EmptyDomainHost(ILK, address(daiJoin), address(escrow), address(0));
        host.file("vow", vow);

        escrow.approve(address(dai), address(host), type(uint256).max);
    }

    function testConstructor() public {
        assertEq(host.ilk(), ILK);
        assertEq(address(host.vat()), address(vat));
        assertEq(address(host.daiJoin()), address(daiJoin));
        assertEq(address(host.dai()), address(dai));
        assertEq(address(host.escrow()), address(escrow));
        assertEq(host.wards(address(this)), 1);
    }

    function testRelyDeny() public {
        checkAuth(address(host), "DomainHost");
    }

    function testFile() public {
        checkFileAddress(address(host), "DomainHost", ["vow"]);
    }

    function testLift() public {
        // Set DC to 100
        host.lift(100 ether);

        (uint256 ink, uint256 art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(host.grain(), 100 ether);
        assertEq(host.liftLine(), 100 * RAD);
        assertEq(host.liftMinted(), 100 ether);

        // Raise DC to 200
        host.lift(200 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 200 ether);
        assertEq(art, 200 ether);
        assertEq(dai.balanceOf(address(escrow)), 200 ether);
        assertEq(host.line(), 200 * RAD);
        assertEq(host.grain(), 200 ether);
        assertEq(host.liftLine(), 200 * RAD);
        assertEq(host.liftMinted(), 100 ether);

        // Lower DC back to 100 - should not remove escrowed DAI
        host.lift(100 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 200 ether);
        assertEq(art, 200 ether);
        assertEq(dai.balanceOf(address(escrow)), 200 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(host.grain(), 200 ether);
        assertEq(host.liftLine(), 100 * RAD);
        assertEq(host.liftMinted(), 0);
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
        assertEq(host.liftLine(), 100 * RAD);
        assertEq(host.liftMinted(), 100 ether);

        // Lower DC back to 50 - should not remove escrowed DAI
        host.lift(50 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 100 ether);
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);

        // Remote domain triggers release at a later time
        // Reports a used debt amount of 20
        host.release(50 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(dai.balanceOf(address(escrow)), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 50 ether);
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);
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
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);

        host.release(50 ether);   // First release comes in

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 75 ether);
        assertEq(art, 75 ether);
        assertEq(dai.balanceOf(address(escrow)), 75 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 75 ether);
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);

        host.release(25 ether);   // Second release comes in

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(dai.balanceOf(address(escrow)), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.grain(), 50 ether);
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);
    }

    function testReleaseNoDai() public {
        assertRevert(address(host), abi.encodeWithSelector(DomainHost.release.selector, uint256(1 ether), 0), "Dai/insufficient-balance");
    }

    function testSurplus() public {
        uint256 balance = dai.balanceOf(address(escrow));
        vat.hope(address(daiJoin));
        vat.suck(address(123), address(this), 100 * RAD);
        daiJoin.exit(address(escrow), 100 ether);

        assertEq(vat.dai(vow), 0);
        assertEq(dai.balanceOf(address(escrow)), balance + 100 ether);

        host.surplus(100 ether);

        assertEq(vat.dai(vow), 100 * RAD);
        assertEq(dai.balanceOf(address(escrow)), balance);
    }

    function testDeficit() public {
        assertEq(vat.sin(vow), 0);
        assertEq(dai.balanceOf(address(host)), 0);
        assertEq(host.rectify(), 0);

        host.deficit(100 ether);

        assertEq(vat.sin(vow), 100 * RAD);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.rectify(), 100 ether);
    }

    function testCage() public {
        assertTrue(!host.caged());

        // Cannot cage when vat is live
        assertRevert(address(host), abi.encodeWithSelector(DomainHost.cage.selector), "DomainHost/vat-live");

        // Cage the vat
        vat.cage();

        // Can cage now
        host.cage();

        assertTrue(host.caged());
    }

    function testTell() public {
        assertEq(host.cure(), 0);
        assertTrue(!host.cureReported());

        host.tell(123);

        assertEq(host.cure(), 123);
        assertTrue(host.cureReported());
    }

    function testExit() public {
        // Setup initial conditions
        host.lift(100 ether);       // DC raised to 100
        vat.cage();
        host.tell(70 * RAD);        // Guest later reports on 30 debt is actually used

        // Simulate user getting some gems for this ilk (normally handled by end)
        vat.slip(ILK, address(this), 50 ether);

        host.exit(address(123), 50 ether);

        assertEq(host.claimUsr(), address(123));
        assertEq(host.claimAmount(), 15 ether);     // 50% of 30 debt is 15
    }

}
