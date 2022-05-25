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
import { Jug } from "xdomain-dss/Jug.sol";
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

// TODO use actual dog when ready
contract DogMock {
    function wards(address) external view returns (uint256) {
        return 1;
    }
    function file(bytes32,address) external {
        // Do nothing
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
    MCD rmcd;

    bytes32 constant DOMAIN_ILK = "SOME-DOMAIN-A";
    bytes32 constant REMOTE_COLL_ILK = "XCHAIN-COLLATERAL-A";

    function setupEnv() internal virtual override returns (MCD) {
        return autoDetectEnv();
    }

    function postSetup() internal virtual override {
        escrow = EscrowLike(mcd.chainlog().getAddress("OPTIMISM_ESCROW"));

        claimToken = new ClaimToken();
        host = new SimpleDomainHost(DOMAIN_ILK, address(mcd.daiJoin()), address(escrow));
        Vat vat = new Vat();
        Dai dai = new Dai();
        DaiJoin daiJoin = new DaiJoin(address(vat), address(dai));
        guest = new SimpleDomainGuest(address(daiJoin), address(claimToken), address(host));

        // Setup remote instance
        {
            DogMock dog = new DogMock();
            Spotter spotter = new Spotter(address(vat));
            Pot pot = new Pot(address(vat));
            Jug jug = new Jug(address(vat));
            Cure cure = new Cure();
            End end = new End();

            rmcd = new MCD();
            // FIXME this is prone to supplying args in the wrong order - want to improve
            rmcd.loadCore(
                address(vat),
                address(daiJoin),
                address(dai),
                address(guest),
                address(dog),
                address(pot),
                address(jug),
                address(spotter),
                address(end),
                address(cure)
            );
            rmcd.init();
        }
        rmcd.end().file("claim", address(claimToken));
        rmcd.end().file("wait", 1 hours);

        // Setup the bridge
        host.file("vow", address(mcd.vow()));
        host.setGuest(address(guest));
        host.rely(address(guest));
        guest.rely(address(host));
        guest.file("end", address(rmcd.end()));
        guest.rely(address(rmcd.end()));
        rmcd.vat().rely(address(guest));
        rmcd.end().rely(address(guest));

        // Setup host on MCD master instance
        mcd.giveAdminAccess();
        mcd.vat().rely(address(host));
        address(escrow).setWard(address(this), 1);
        escrow.approve(address(mcd.dai()), address(host), type(uint256).max);
        mcd.initIlk(DOMAIN_ILK, address(host));
        mcd.vat().file(DOMAIN_ILK, "line", 1_000_000 * RAD);
    }

    function testRaiseDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);
        assertEq(rmcd.vat().Line(), 0);

        host.lift(100 ether);

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(rmcd.vat().Line(), 100 * RAD);
    }

    function testRaiseLowerDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);
        assertEq(rmcd.vat().Line(), 0);

        host.lift(100 ether);

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(rmcd.vat().Line(), 100 * RAD);

        // Pre-mint DAI is not released here
        host.lift(50 ether);

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(rmcd.vat().Line(), 50 * RAD);

        // Notify the host that the DAI is safe to remove
        guest.release();

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(host.grain(), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 50 ether);
        assertEq(rmcd.vat().Line(), 50 * RAD);
        assertEq(rmcd.vat().debt(), 0);

        // Add some debt to the guest instance, lower the DC and release some more pre-mint
        // This can only release pre-mint DAI up to the debt
        rmcd.vat().suck(address(guest), address(this), 40 * RAD);
        host.lift(25 ether);
        guest.release();

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(host.grain(), 40 ether);
        assertEq(host.line(), 25 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 40 ether);
        assertEq(rmcd.vat().Line(), 25 * RAD);
        assertEq(rmcd.vat().debt(), 40 * RAD);
    }

    function testPushSurplus() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        // Set global DC and add 50 DAI surplus + 20 DAI debt to vow
        host.lift(100 ether);
        rmcd.vat().suck(address(123), address(guest), 50 * RAD);
        rmcd.vat().suck(address(guest), address(123), 20 * RAD);

        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        assertEq(rmcd.vat().dai(address(guest)), 50 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 20 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        guest.push();

        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);
        assertEq(Vat(address(rmcd.vat())).surf(), -int256(30 * RAD));
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai + 30 * RAD);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 70 ether);
    }

    function testPushDeficit() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        // Set global DC and add 20 DAI surplus + 50 DAI debt to vow
        host.lift(100 ether);
        rmcd.vat().suck(address(123), address(guest), 20 * RAD);
        rmcd.vat().suck(address(guest), address(123), 50 * RAD);

        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        assertEq(rmcd.vat().dai(address(guest)), 20 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 50 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        guest.push();

        assertEq(rmcd.vat().dai(address(guest)), 30 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 30 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 30 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 130 ether);

        guest.heal();

        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);
        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 30 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 130 ether);
    }

    function testGlobalShutdown() public {
        bytes32 ilk = REMOTE_COLL_ILK;
        EndAbstract hostEnd = EndAbstract(mcd.chainlog().getAddress("MCD_END"));

        // Set up some debt in the guest instance
        host.lift(100 ether);
        rmcd.initIlk(ilk);
        rmcd.vat().file(ilk, "line", 1_000_000 * RAD);
        rmcd.vat().slip(ilk, address(this), 40 ether);
        rmcd.vat().frob(ilk, address(this), address(this), address(this), 40 ether, 40 ether);

        assertEq(mcd.vat().live(), 1);
        assertEq(guest.live(), 1);
        assertEq(host.live(), 1);
        assertEq(rmcd.vat().live(), 1);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (uint256 ink, uint256 art) = rmcd.vat().urns(ilk, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);

        address(hostEnd).setWard(address(this), 1);
        hostEnd.cage();
        host.deny(address(this));       // Confirm cage can be done permissionlessly
        host.cage();

        assertEq(mcd.vat().live(), 0);
        assertEq(guest.live(), 0);
        assertEq(host.live(), 0);
        assertEq(rmcd.vat().live(), 0);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (ink, art) = rmcd.vat().urns(ilk, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(rmcd.vat().gem(ilk, address(rmcd.end())), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);

        // --- Settle out the Guest instance ---

        rmcd.end().cage(ilk);
        rmcd.end().skim(ilk, address(this));

        (ink, art) = rmcd.vat().urns(ilk, address(this));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(rmcd.vat().gem(ilk, address(rmcd.end())), 40 ether);
        assertEq(rmcd.vat().sin(address(guest)), 40 * RAD);

        GodMode.vm().warp(block.timestamp + rmcd.end().wait());

        rmcd.end().thaw();

        assertEq(guest.grain(), 100 ether);
        assertEq(host.cure(), 60 * RAD);    // 60 pre-mint dai is unused

        rmcd.end().flow(ilk);

        // --- Settle out the Host instance ---

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(hostEnd)), 0);
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        hostEnd.cage(DOMAIN_ILK);
        hostEnd.skim(DOMAIN_ILK, address(host));

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(hostEnd)), 100 ether);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 100 * RAD);

        GodMode.vm().warp(block.timestamp + hostEnd.wait());

        // Clear out any surplus if it exists
        uint256 vowDai = rmcd.vat().dai(address(mcd.vow()));
        rmcd.vat().suck(address(mcd.vow()), address(123), vowDai);
        mcd.vow().heal(vowDai);
        // TODO - need to take cure into account when it's live
        hostEnd.thaw();
        hostEnd.flow(DOMAIN_ILK);
    }

}
