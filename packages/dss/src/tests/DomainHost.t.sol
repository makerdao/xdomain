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

    EmptyDomainHost host;

    bytes32 constant ILK = "SOME-DOMAIN-A";

    function postSetup() internal virtual override {
        vat = new VatMock();
        dai = new DaiMock();
        daiJoin = new DaiJoinMock(address(vat), address(dai));
        escrow = new EscrowMock();

        host = new EmptyDomainHost(ILK, address(daiJoin), address(escrow));
        host.file("vow", address(this));

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
        assertEq(host.vow(), address(this));
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

}
