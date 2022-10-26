// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import { ArbitrumDomain } from "dss-test/domains/ArbitrumDomain.sol";

import "./IntegrationBase.t.sol";

import { ArbitrumDomainHost } from "../../domains/arbitrum/ArbitrumDomainHost.sol";
import { ArbitrumDomainGuest } from "../../domains/arbitrum/ArbitrumDomainGuest.sol";

contract ArbitrumIntegrationTest is IntegrationBaseTest {

    function setupGuestDomain() internal virtual override returns (BridgedDomain) {
        return new ArbitrumDomain(config, "arbitrum", rootDomain);
    }

    function setupGuestDai() internal virtual override returns (address) {
        // DAI is already deployed on this domain
        return 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1;
    }

    function setupDomains() internal virtual override {
        // Primary domain
        escrow = EscrowLike(mcd.chainlog().getAddress("ARBITRUM_ESCROW"));
        // Pre-calc the guest nonce
        address guestAddr = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), bytes1(0x10))))));
        ArbitrumDomainHost _host = new ArbitrumDomainHost(
            HOST_DOMAIN_ILK,
            address(mcd.daiJoin()),
            address(escrow),
            address(hostRouter),
            address(ArbitrumDomain(address(guestDomain)).inbox()),
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
        ArbitrumDomainGuest _guest = new ArbitrumDomainGuest(
            HOST_DOMAIN_ILK,
            address(rmcd.daiJoin()),
            address(claimToken),
            address(guestRouter),
            address(ArbitrumDomain(address(guestDomain)).arbSys()),
            address(host)
        );
        assertEq(address(_guest), guestAddr, "guest address mismatch");
        guest = DomainGuest(_guest);

        // Set back to primary before returning control
        rootDomain.selectFork();
    }

    function hostLift(uint256 wad) internal virtual override {
        ArbitrumDomainHost(address(host)).lift{value:1 ether}(wad, 1 ether, 0);
    }

    function hostRectify() internal virtual override {
        ArbitrumDomainHost(address(host)).rectify{value:1 ether}(1 ether, 0);
    }

    function hostCage() internal virtual override {
        ArbitrumDomainHost(address(host)).cage{value:1 ether}(1 ether, 0);
    }

    function hostExit(address usr, uint256 wad) internal virtual override {
        ArbitrumDomainHost(address(host)).exit{value:1 ether}(usr, wad, 1 ether, 0);
    }

    function hostDeposit(address to, uint256 amount) internal virtual override {
        ArbitrumDomainHost(address(host)).deposit{value:1 ether}(to, amount, 1 ether, 0);
    }

    function hostInitializeRegisterMint(TeleportGUID memory teleport) internal virtual override {
        ArbitrumDomainHost(address(host)).initializeRegisterMint{value:1 ether}(teleport, 1 ether, 0);
    }

    function hostInitializeSettle(uint256 index) internal virtual override {
        ArbitrumDomainHost(address(host)).initializeSettle{value:1 ether}(index, 1 ether, 0);
    }

    function guestRelease() internal virtual override {
        ArbitrumDomainGuest(address(guest)).release();
    }

    function guestPush() internal virtual override {
        ArbitrumDomainGuest(address(guest)).push();
    }

    function guestTell() internal virtual override {
        ArbitrumDomainGuest(address(guest)).tell();
    }

    function guestWithdraw(address to, uint256 amount) internal virtual override {
        ArbitrumDomainGuest(address(guest)).withdraw(to, amount);
    }

    function guestInitializeRegisterMint(TeleportGUID memory teleport) internal virtual override {
        ArbitrumDomainGuest(address(guest)).initializeRegisterMint(teleport);
    }

    function guestInitializeSettle(uint256 index) internal virtual override {
        ArbitrumDomainGuest(address(guest)).initializeSettle(index);
    }

}
