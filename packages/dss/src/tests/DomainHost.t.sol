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

    constructor(bytes32 _ilk, address _daiJoin, address _escrow) DomainHost(_ilk, _daiJoin, _escrow) {}

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

        host = new EmptyDomainHost(ILK, address(daiJoin), address(escrow));
        host.file("vow", vow);

        escrow.approve(address(dai), address(host), type(uint256).max);
    }

    function _tryRely(address usr) internal returns (bool ok) {
        (ok,) = address(host).call(abi.encodeWithSignature("rely(address)", usr));
    }

    function _tryDeny(address usr) internal returns (bool ok) {
        (ok,) = address(host).call(abi.encodeWithSignature("deny(address)", usr));
    }

    function _tryFile(bytes32 what, address data) internal returns (bool ok) {
        (ok,) = address(host).call(abi.encodeWithSignature("file(bytes32,address)", what, data));
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
        assertEq(host.wards(address(456)), 0);
        assertTrue(_tryRely(address(456)));
        assertEq(host.wards(address(456)), 1);
        assertTrue(_tryDeny(address(456)));
        assertEq(host.wards(address(456)), 0);

        host.deny(address(this));

        assertTrue(!_tryRely(address(456)));
        assertTrue(!_tryDeny(address(456)));
    }

    function testFile() public {
        assertEq(host.vow(), address(123));
        assertTrue(_tryFile("vow", address(888)));
        assertEq(host.vow(), address(888));

        host.deny(address(this));

        assertTrue(!_tryFile("vow", address(888)));
    }

    function testInvalidWhat() public {
       assertTrue(!_tryFile("meh", address(888)));
    }

    function testLift() public {
        // Set DC to 100
        host.lift(100 ether);

        (uint256 ink, uint256 art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(host.liftLine(), 100 * RAD);
        assertEq(host.liftMinted(), 100 ether);

        // Raise DC to 200
        host.lift(200 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 200 ether);
        assertEq(art, 200 ether);
        assertEq(dai.balanceOf(address(escrow)), 200 ether);
        assertEq(host.line(), 200 * RAD);
        assertEq(host.liftLine(), 200 * RAD);
        assertEq(host.liftMinted(), 100 ether);

        // Lower DC back to 100 - should not remove escrowed DAI
        host.lift(100 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 200 ether);
        assertEq(art, 200 ether);
        assertEq(dai.balanceOf(address(escrow)), 200 ether);
        assertEq(host.line(), 100 * RAD);
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
        assertEq(host.liftLine(), 100 * RAD);
        assertEq(host.liftMinted(), 100 ether);

        // Lower DC back to 50 - should not remove escrowed DAI
        host.lift(50 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);

        // Remote domain triggers release at a later time
        host.release(50 ether);

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(dai.balanceOf(address(escrow)), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(host.liftLine(), 50 * RAD);
        assertEq(host.liftMinted(), 0);
    }

    function testAsyncReordering() public {
        host.lift(100 ether);
        host.lift(50 ether);        // Trigger lowering
        host.lift(75 ether);        // Trigger raise before the release comes in

        (uint256 ink, uint256 art) = vat.urns(ILK, address(host));
        assertEq(ink, 125 ether);
        assertEq(art, 125 ether);
        assertEq(dai.balanceOf(address(escrow)), 125 ether);
        assertEq(host.line(), 75 * RAD);
        assertEq(host.liftLine(), 75 * RAD);
        assertEq(host.liftMinted(), 25 ether);

        host.release(25 ether);     // A partial release comes in

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(dai.balanceOf(address(escrow)), 100 ether);
        assertEq(host.line(), 75 * RAD);

        host.release(25 ether);     // The remainder release comes in

        (ink, art) = vat.urns(ILK, address(host));
        assertEq(ink, 75 ether);
        assertEq(art, 75 ether);
        assertEq(dai.balanceOf(address(escrow)), 75 ether);
        assertEq(host.line(), 75 * RAD);
    }

    function testReleaseNoDai() public {
        assertRevert(address(host), abi.encodeWithSelector(DomainHost.release.selector, uint256(1 ether)), "Dai/insufficient-balance");
    }

    function testSurplus() public {
        // Stick 100 DAI into the host
        // This is to simulate the remote bridge sending surplus DAI
        host.lift(100 ether);
        escrow.approve(address(dai), address(this), type(uint256).max);
        dai.transferFrom(address(escrow), address(host), 100 ether);

        assertEq(vat.dai(vow), 0);

        host.surplus();

        assertEq(vat.dai(vow), 100 * RAD);
    }

    function testDeficit() public {
        assertEq(vat.sin(vow), 0);
        assertEq(dai.balanceOf(address(host)), 0);
        assertEq(host.rectify(), 0);

        host.deficit(100 ether);

        assertEq(vat.sin(vow), 100 * RAD);
        assertEq(dai.balanceOf(address(host)), 100 ether);
        assertEq(host.rectify(), 100 ether);
    }

}
