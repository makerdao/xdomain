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
import "ds-value/value.sol";

import { EndAbstract } from "dss-interfaces/Interfaces.sol";

import { Cure } from "xdomain-dss/Cure.sol";
import { Dai } from "xdomain-dss/Dai.sol";
import { DaiJoin } from "xdomain-dss/DaiJoin.sol";
import { End } from "xdomain-dss/End.sol";
import { Pot } from "xdomain-dss/Pot.sol";
import { Spotter } from "xdomain-dss/Spotter.sol";
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
    Spotter spot;
    Pot pot;
    End end;
    Cure cure;

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
        spot = new Spotter(address(vat));
        pot = new Pot(address(vat));
        vat.rely(address(spot));
        cure = new Cure();
        end = new End();
        end.file("vat", address(vat));
        end.file("pot", address(pot));
        end.file("spot", address(spot));
        end.file("cure", address(cure));
        end.file("claim", address(claimToken));
        end.file("wait", 1 hours);
        vat.rely(address(end));
        spot.rely(address(end));
        pot.rely(address(end));
        cure.rely(address(end));

        claimToken = new ClaimToken();
        host = new SimpleDomainHost(ILK, address(mcd.daiJoin()), address(escrow));
        guest = new SimpleDomainGuest(address(daiJoin), address(claimToken), address(host));
        host.file("vow", address(mcd.vow()));
        host.setGuest(address(guest));
        host.rely(address(guest));
        guest.rely(address(host));
        guest.file("end", address(end));
        end.file("vow", address(guest));
        guest.rely(address(end));

        mcd.vat().setWard(address(this), 1);
        address(mcd.spotter()).setWard(address(this), 1);
        mcd.vat().setWard(address(host), 1);
        address(escrow).setWard(address(this), 1);
        escrow.approve(address(mcd.dai()), address(host), type(uint256).max);
        mcd.vat().init(ILK);
        mcd.vat().file(ILK, "line", 1_000_000 * RAD);
        mcd.vat().file(ILK, "spot", RAY);
        DSValue pip = new DSValue();
        mcd.spotter().file(ILK, "pip", address(pip));
        mcd.spotter().file(ILK, "mat", RAY);
        pip.poke(bytes32(1 * WAD));
        mcd.spotter().poke(ILK);
        vat.rely(address(guest));
        end.rely(address(guest));
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

    function initCollateral(bytes32 name) internal {
        DSValue pip = new DSValue();
        spot.file(name, "pip", address(pip));
        spot.file(name, "mat", RAY);
        pip.poke(bytes32(1 * WAD));
        spot.poke(name);

        vat.init(name);
        vat.file(name, "line", 1_000_000 * RAD);
    }

    function testGlobalShutdown() public {
        bytes32 ilk = "test-ilk";
        EndAbstract hostEnd = EndAbstract(mcd.chainlog().getAddress("MCD_END"));

        // Set up some debt in the guest instance
        host.lift(100 ether);
        initCollateral(ilk);
        vat.slip(ilk, address(this), 40 ether);
        vat.frob(ilk, address(this), address(this), address(this), 40 ether, 40 ether);

        assertEq(mcd.vat().live(), 1);
        assertEq(guest.live(), 1);
        assertEq(host.live(), 1);
        assertEq(vat.live(), 1);
        assertEq(vat.debt(), 40 * RAD);
        (uint256 ink, uint256 art) = vat.urns(ilk, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);

        address(hostEnd).setWard(address(this), 1);
        hostEnd.cage();
        host.deny(address(this));       // Confirm cage can be done permissionlessly
        host.cage();

        assertEq(mcd.vat().live(), 0);
        assertEq(guest.live(), 0);
        assertEq(host.live(), 0);
        assertEq(vat.live(), 0);
        assertEq(vat.debt(), 40 * RAD);
        (ink, art) = vat.urns(ilk, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(vat.gem(ilk, address(end)), 0);
        assertEq(vat.sin(address(guest)), 0);

        // --- Settle out the Guest instance ---

        end.cage(ilk);
        end.skim(ilk, address(this));

        (ink, art) = vat.urns(ilk, address(this));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(vat.gem(ilk, address(end)), 40 ether);
        assertEq(vat.sin(address(guest)), 40 * RAD);

        GodMode.vm().warp(block.timestamp + end.wait());

        end.thaw();

        assertEq(guest.grain(), 100 ether);
        assertEq(host.cure(), 60 * RAD);    // 60 pre-mint dai is unused

        end.flow(ilk);

        // --- Settle out the Host instance ---

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(mcd.vat().gem(ILK, address(hostEnd)), 0);
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        hostEnd.cage(ILK);
        hostEnd.skim(ILK, address(host));

        (ink, art) = mcd.vat().urns(ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(mcd.vat().gem(ILK, address(hostEnd)), 100 ether);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 100 * RAD);

        GodMode.vm().warp(block.timestamp + hostEnd.wait());

        // Clear out any surplus if it exists
        uint256 vowDai = vat.dai(address(mcd.vow()));
        vat.suck(address(mcd.vow()), address(123), vowDai);
        mcd.vow().heal(vowDai);
        // TODO - need to take cure into account when it's live
        hostEnd.thaw();
        hostEnd.flow(ILK);
    }

}
