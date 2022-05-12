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

import { Dai } from "xdomain-dss/Dai.sol";
import { DaiJoin } from "xdomain-dss/DaiJoin.sol";
import { Vat } from "xdomain-dss/Vat.sol";

import { ClaimToken } from "../ClaimToken.sol";
import { DomainHost } from "../DomainHost.sol";
import { DomainGuest } from "../DomainGuest.sol";

interface EscrowLike {
    function approve(address token, address spender, uint256 value) external;
}

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
        guest.rectify(wad);
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

    function _release(uint256 burned) internal override {
        host.release(burned);
    }
    function _surplus(uint256 wad) internal virtual override {
        host.surplus(wad);
    }
    function _deficit(uint256 wad) internal virtual override {
        host.deficit(wad);
    }
    function _tell(uint256 value) internal virtual override {
       host.tell(value);
    }

}

contract IntegrationTest is DSSTest {

    using GodMode for *;

    // Bridge
    ClaimToken claimToken;
    SimpleDomainHost host;
    SimpleDomainGuest guest;

    // Local contracts
    EscrowLike escrow;

    // Remote domain MCD deploy
    Vat vat;
    Dai dai;
    DaiJoin daiJoin;

    bytes32 constant ILK = "SOME-DOMAIN-A";

    function setupEnv() internal virtual override returns (MCD) {
        return autoDetectEnv();
    }

    function postSetup() internal virtual override {
        escrow = EscrowLike(mcd.chainlog().getAddress("OPTIMISM_ESCROW"));

        vat = new Vat();
        dai = new Dai();
        daiJoin = new DaiJoin(address(vat), address(dai));
        dai.rely(address(daiJoin));

        claimToken = new ClaimToken();
        host = new SimpleDomainHost(ILK, address(mcd.daiJoin()), address(escrow));
        guest = new SimpleDomainGuest(address(daiJoin), address(claimToken), address(host));
        host.file("vow", address(mcd.vow()));
        host.setGuest(address(guest));
        host.rely(address(guest));
        guest.rely(address(host));
        //guest.file("end", address(end));  // TODO add this when end is merged

        mcd.vat().setWard(address(this), 1);
        mcd.vat().setWard(address(host), 1);
        address(escrow).setWard(address(this), 1);
        escrow.approve(address(mcd.dai()), address(host), type(uint256).max);
        mcd.vat().init(ILK);
        mcd.vat().file(ILK, "line", 1_000_000 * RAD);
        mcd.vat().file(ILK, "spot", RAY);
        vat.rely(address(guest));
    }

    function testRaiseDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);
        assertEq(vat.Line(), 0);

        host.lift(100 ether);

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(vat.Line(), 100 * RAD);
    }

    function testRaiseLowerDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);
        assertEq(vat.Line(), 0);

        host.lift(100 ether);

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(vat.Line(), 100 * RAD);

        // Pre-mint DAI is not released here
        host.lift(50 ether);

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(vat.Line(), 50 * RAD);

        // Notify the host that the DAI is safe to remove
        guest.release();

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(host.grain(), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 50 ether);
        assertEq(vat.Line(), 50 * RAD);
        assertEq(vat.debt(), 0);

        // Add some debt to the guest instance, lower the DC and release some more pre-mint
        // This can only release pre-mint DAI up to the debt
        vat.suck(address(guest), address(this), 40 * RAD);
        host.lift(25 ether);
        guest.release();

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(host.grain(), 40 ether);
        assertEq(host.line(), 25 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 40 ether);
        assertEq(vat.Line(), 25 * RAD);
        assertEq(vat.debt(), 40 * RAD);
    }

    function testPushSurplus() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        // Set global DC and add 50 DAI surplus + 20 DAI debt to vow
        host.lift(100 ether);
        vat.suck(address(123), address(guest), 50 * RAD);
        vat.suck(address(guest), address(123), 20 * RAD);

        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        assertEq(vat.dai(address(guest)), 50 * RAD);
        assertEq(vat.sin(address(guest)), 20 * RAD);
        assertEq(vat.surf(), 0);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        guest.push();

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 0);
        assertEq(vat.surf(), -int256(30 * RAD));
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai + 30 * RAD);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 70 ether);
    }

    function testPushDeficit() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        // Set global DC and add 20 DAI surplus + 50 DAI debt to vow
        host.lift(100 ether);
        vat.suck(address(123), address(guest), 20 * RAD);
        vat.suck(address(guest), address(123), 50 * RAD);

        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        assertEq(vat.dai(address(guest)), 20 * RAD);
        assertEq(vat.sin(address(guest)), 50 * RAD);
        assertEq(vat.surf(), 0);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        guest.push();

        assertEq(vat.dai(address(guest)), 30 * RAD);
        assertEq(vat.sin(address(guest)), 30 * RAD);
        assertEq(vat.surf(), int256(30 * RAD));
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 30 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 130 ether);

        guest.heal();

        assertEq(vat.dai(address(guest)), 0);
        assertEq(vat.sin(address(guest)), 0);
        assertEq(vat.surf(), int256(30 * RAD));
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 30 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 130 ether);
    }

}
