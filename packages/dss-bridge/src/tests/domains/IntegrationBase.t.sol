// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import "dss-test/DSSTest.sol";
import "ds-value/value.sol";

import { DaiAbstract, EndAbstract } from "dss-interfaces/Interfaces.sol";
import { BridgedDomain } from "dss-test/domains/BridgedDomain.sol";
import { RootDomain } from "dss-test/domains/RootDomain.sol";
import { Cure } from "xdomain-dss/Cure.sol";
import { Dai } from "xdomain-dss/Dai.sol";
import { DaiJoin } from "xdomain-dss/DaiJoin.sol";
import { End } from "xdomain-dss/End.sol";
import { Pot } from "xdomain-dss/Pot.sol";
import { Jug } from "xdomain-dss/Jug.sol";
import { Spotter } from "xdomain-dss/Spotter.sol";
import { Vat } from "xdomain-dss/Vat.sol";

import { ClaimToken } from "../../ClaimToken.sol";
import { DomainHost, TeleportGUID } from "../../DomainHost.sol";
import { DomainGuest } from "../../DomainGuest.sol";
import { BridgeOracle } from "../../BridgeOracle.sol";
import { RouterMock } from "../mocks/RouterMock.sol";

interface EscrowLike {
    function approve(address token, address spender, uint256 value) external;
}

// TODO use actual dog when ready
contract DogMock {
    function wards(address) external pure returns (uint256) {
        return 1;
    }
    function file(bytes32,address) external {
        // Do nothing
    }
}

abstract contract IntegrationBaseTest is DSSTest {

    using GodMode for *;

    string config;
    RootDomain rootDomain;
    BridgedDomain guestDomain;

    // Host-side contracts
    MCD mcd;
    EscrowLike escrow;
    BridgeOracle pip;
    DomainHost host;
    RouterMock hostRouter;

    // Guest-side contracts
    MCD rmcd;
    ClaimToken claimToken;
    DomainGuest guest;
    RouterMock guestRouter;

    bytes32 constant HOST_DOMAIN_ILK = "SOME-DOMAIN-A";
    bytes32 constant GUEST_COLL_ILK = "XCHAIN-COLLATERAL-A";

    event FinalizeRegisterMint(TeleportGUID teleport);

    function setupEnv() internal virtual override {
        config = readInput("integration");

        rootDomain = new RootDomain(config, "root");
        rootDomain.selectFork();
        rootDomain.loadMCDFromChainlog();
        mcd = rootDomain.mcd(); // For ease of access
    }

    function setupGuestDomain() internal virtual returns (BridgedDomain);
    function setupGuestDai() internal virtual returns (address);
    function setupDomains() internal virtual;

    function postSetup() internal virtual override {
        guestDomain = setupGuestDomain();

        // Do all the pre-setup required for the inheriting test setup
        guestDomain.selectFork();
        claimToken = new ClaimToken();
        {
            Vat vat = new Vat();
            Dai dai = Dai(setupGuestDai());
            DaiJoin daiJoin = new DaiJoin(address(vat), address(dai));
            DogMock dog = new DogMock();
            Spotter spotter = new Spotter(address(vat));
            Pot pot = new Pot(address(vat));
            Jug jug = new Jug(address(vat));
            Cure cure = new Cure();
            End end = new End();
            guestRouter = new RouterMock(address(dai));

            rmcd = new MCD();
            rmcd.loadCore({
                _vat: address(vat),
                _dai: address(dai),
                _daiJoin: address(daiJoin),
                _vow: address(0),
                _dog: address(dog),
                _pot: address(pot),
                _jug: address(jug),
                _spotter: address(spotter),
                _end: address(end),
                _cure: address(cure)
            });
            rmcd.init();
        }
        rootDomain.selectFork();
        hostRouter = new RouterMock(address(mcd.dai()));

        setupDomains();

        // --- Setup host contracts ---
        host.file("vow", address(mcd.vow()));
        host.rely(address(guest));
        mcd.giveAdminAccess();
        mcd.vat().rely(address(host));
        address(escrow).setWard(address(this), 1);
        escrow.approve(address(mcd.dai()), address(host), type(uint256).max);
        pip = new BridgeOracle(address(host));
        mcd.initIlk(HOST_DOMAIN_ILK, address(host), address(pip));
        mcd.vat().file(HOST_DOMAIN_ILK, "line", 1_000_000 * RAD);
        mcd.cure().lift(address(host));

        // --- Setup guest contracts ---
        guestDomain.selectFork();

        // Update the vow - this should be available as a function though
        vm.store(
            address(rmcd),
            keccak256(abi.encode(uint256(4))),
            bytes32(uint256(uint160(address(guest))))
        );
        claimToken.rely(address(guest));
        rmcd.end().file("claim", address(claimToken));
        rmcd.end().file("wait", 1 hours);
        rmcd.end().file("vow", address(guest));
        guest.file("end", address(rmcd.end()));
        guest.rely(address(rmcd.end()));
        rmcd.vat().rely(address(guest));
        rmcd.end().rely(address(guest));

        // Default back to mainnet
        rootDomain.selectFork();
    }

    function hostLift(uint256 wad) internal virtual;
    function hostRectify() internal virtual;
    function hostCage() internal virtual;
    function hostExit(address usr, uint256 wad) internal virtual;
    function hostDeposit(address to, uint256 amount) internal virtual;
    function hostInitializeRegisterMint(TeleportGUID memory teleport) internal virtual;
    function hostInitializeSettle(uint256 index) internal virtual;
    function guestRelease() internal virtual;
    function guestPush() internal virtual;
    function guestTell() internal virtual;
    function guestWithdraw(address to, uint256 amount) internal virtual;
    function guestInitializeRegisterMint(TeleportGUID memory teleport) internal virtual;
    function guestInitializeSettle(uint256 index) internal virtual;

    function testRaiseDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);

        hostLift(100 ether);

        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        // Play the message on L2
        guestDomain.relayFromHost(true);

        assertEq(rmcd.vat().Line(), 100 * RAD);
    }

    function testRaiseLowerDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);

        hostLift(100 ether);

        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        guestDomain.relayFromHost(true);
        assertEq(rmcd.vat().Line(), 100 * RAD);

        // Pre-mint DAI is not released here
        rootDomain.selectFork();
        hostLift(50 ether);

        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        guestDomain.relayFromHost(true);
        assertEq(rmcd.vat().Line(), 50 * RAD);

        // Notify the host that the DAI is safe to remove
        guestRelease();

        assertEq(rmcd.vat().Line(), 50 * RAD);
        assertEq(rmcd.vat().debt(), 0);

        guestDomain.relayToHost(true);
        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(host.grain(), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 50 ether);

        // Add some debt to the guest instance, lower the DC and release some more pre-mint
        // This can only release pre-mint DAI up to the debt
        guestDomain.selectFork();
        rmcd.vat().suck(address(guest), address(this), 40 * RAD);
        assertEq(rmcd.vat().Line(), 50 * RAD);
        assertEq(rmcd.vat().debt(), 40 * RAD);

        rootDomain.selectFork();
        hostLift(25 ether);
        guestDomain.relayFromHost(true);
        guestRelease();
        guestDomain.relayToHost(true);

        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(host.grain(), 40 ether);
        assertEq(host.line(), 25 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 40 ether);
    }

    function testPushSurplus() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        // Set global DC and add 50 DAI surplus + 20 DAI debt to vow
        hostLift(100 ether);
        guestDomain.relayFromHost(true);
        rmcd.vat().suck(address(123), address(guest), 50 * RAD);
        rmcd.vat().suck(address(guest), address(123), 20 * RAD);

        assertEq(rmcd.vat().dai(address(guest)), 50 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 20 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);

        guestPush();
        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);
        assertEq(Vat(address(rmcd.vat())).surf(), -int256(30 * RAD));
        guestDomain.relayToHost(true);

        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai + 30 * RAD);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 70 ether);
    }

    function testPushDeficit() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        // Set global DC and add 20 DAI surplus + 50 DAI debt to vow
        hostLift(100 ether);
        guestDomain.relayFromHost(true);
        rmcd.vat().suck(address(123), address(guest), 20 * RAD);
        rmcd.vat().suck(address(guest), address(123), 50 * RAD);

        assertEq(rmcd.vat().dai(address(guest)), 20 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 50 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);

        guestPush();
        guestDomain.relayToHost(true);

        guestDomain.selectFork();
        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 30 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        rootDomain.selectFork();

        hostRectify();
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 30 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 130 ether);
        guestDomain.relayFromHost(true);

        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
        assertEq(rmcd.vat().dai(address(guest)), 30 * RAD);

        guest.heal();

        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);
        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
    }

    function testGlobalShutdown2() public {
        assertEq(host.live(), 1);
        assertEq(mcd.vat().live(), 1);
        assertEq(pip.read(), bytes32(WAD));

        // Set up some debt in the guest instance
        hostLift(100 ether);
        guestDomain.relayFromHost(true);
        rmcd.initIlk(GUEST_COLL_ILK);
        rmcd.vat().file(GUEST_COLL_ILK, "line", 1_000_000 * RAD);
        rmcd.vat().slip(GUEST_COLL_ILK, address(this), 40 ether);
        rmcd.vat().frob(GUEST_COLL_ILK, address(this), address(this), address(this), 40 ether, 40 ether);

        assertEq(guest.live(), 1);
        assertEq(rmcd.vat().live(), 1);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (uint256 ink, uint256 art) = rmcd.vat().urns(GUEST_COLL_ILK, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);

        rootDomain.selectFork();
        mcd.end().cage();
        host.deny(address(this));       // Confirm cage can be done permissionlessly
        hostCage();

        // Verify cannot cage the host ilk until a final cure is reported
        assertRevert(address(mcd.end()), abi.encodeWithSignature("cage(bytes32)", HOST_DOMAIN_ILK), "BridgeOracle/haz-not");

        assertEq(mcd.vat().live(), 0);
        assertEq(host.live(), 0);
        guestDomain.relayFromHost(true);
        assertEq(guest.live(), 0);
        assertEq(rmcd.vat().live(), 0);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (ink, art) = rmcd.vat().urns(GUEST_COLL_ILK, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(rmcd.vat().gem(GUEST_COLL_ILK, address(rmcd.end())), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);

        // --- Settle out the Guest instance ---

        rmcd.end().cage(GUEST_COLL_ILK);
        rmcd.end().skim(GUEST_COLL_ILK, address(this));

        (ink, art) = rmcd.vat().urns(GUEST_COLL_ILK, address(this));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(rmcd.vat().gem(GUEST_COLL_ILK, address(rmcd.end())), 40 ether);
        assertEq(rmcd.vat().sin(address(guest)), 40 * RAD);

        vm.warp(block.timestamp + rmcd.end().wait());

        rmcd.end().thaw();
        guestTell();
        assertEq(guest.grain(), 100 ether);
        rmcd.end().flow(GUEST_COLL_ILK);
        guestDomain.relayToHost(true);
        assertEq(host.cure(), 60 * RAD);    // 60 pre-mint dai is unused

        // --- Settle out the Host instance ---

        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(mcd.vat().gem(HOST_DOMAIN_ILK, address(mcd.end())), 0);
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        mcd.end().cage(HOST_DOMAIN_ILK);

        assertEq(mcd.end().tag(HOST_DOMAIN_ILK), 25 * RAY / 10);   // Tag should be 2.5 (1 / $1 * 40% debt used)
        assertEq(mcd.end().gap(HOST_DOMAIN_ILK), 0);

        mcd.end().skim(HOST_DOMAIN_ILK, address(host));

        assertEq(mcd.end().gap(HOST_DOMAIN_ILK), 150 * WAD);
        (ink, art) = mcd.vat().urns(HOST_DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(mcd.vat().gem(HOST_DOMAIN_ILK, address(mcd.end())), 100 ether);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 100 * RAD);

        vm.warp(block.timestamp + mcd.end().wait());

        // Clear out any surplus if it exists
        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        mcd.vat().suck(address(mcd.vow()), address(123), vowDai);
        mcd.vow().heal(vowDai);
        
        // Check debt is deducted properly
        uint256 debt = mcd.vat().debt();
        mcd.cure().load(address(host));
        mcd.end().thaw();

        assertEq(mcd.end().debt(), debt - 60 * RAD);

        mcd.end().flow(HOST_DOMAIN_ILK);

        assertEq(mcd.end().fix(HOST_DOMAIN_ILK), (100 * RAD) / (mcd.end().debt() / RAY));

        // --- Do user redemption for guest domain collateral ---

        // Pretend you own 50% of all outstanding debt (should be a pro-rate claim on $20 for the guest domain)
        uint256 myDai = (mcd.end().debt() / 2) / RAY;
        mcd.vat().suck(address(123), address(this), myDai * RAY);
        mcd.vat().hope(address(mcd.end()));

        // Pack all your DAI
        assertEq(mcd.end().bag(address(this)), 0);
        mcd.end().pack(myDai);
        assertEq(mcd.end().bag(address(this)), myDai);

        // Should get 50 gems valued at $0.40 each
        assertEq(mcd.vat().gem(HOST_DOMAIN_ILK, address(this)), 0);
        mcd.end().cash(HOST_DOMAIN_ILK, myDai);
        uint256 gems = mcd.vat().gem(HOST_DOMAIN_ILK, address(this));
        assertApproxEqRel(gems, 50 ether, WAD / 10000);

        // Exit to the guest domain
        hostExit(address(this), gems);
        assertEq(mcd.vat().gem(HOST_DOMAIN_ILK, address(this)), 0);
        guestDomain.relayFromHost(true);
        uint256 tokens = claimToken.balanceOf(address(this));
        assertApproxEqAbs(tokens, 20 ether, WAD / 10000);

        // Can now get some collateral on the guest domain
        claimToken.approve(address(rmcd.end()), type(uint256).max);
        assertEq(rmcd.end().bag(address(this)), 0);
        rmcd.end().pack(tokens);
        assertEq(rmcd.end().bag(address(this)), tokens);

        // Should get some of the dummy collateral gems
        assertEq(rmcd.vat().gem(GUEST_COLL_ILK, address(this)), 0);
        rmcd.end().cash(GUEST_COLL_ILK, tokens);
        assertEq(rmcd.vat().gem(GUEST_COLL_ILK, address(this)), tokens);

        // We can now exit through gem join or other standard exit function
    }

    function testDeposit() public {
        mcd.dai().mint(address(this), 100 ether);
        mcd.dai().approve(address(host), 100 ether);
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        hostDeposit(address(123), 100 ether);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        guestDomain.relayFromHost(true);

        assertEq(Vat(address(rmcd.vat())).surf(), int256(100 * RAD));
        assertEq(rmcd.dai().balanceOf(address(123)), 100 ether);
    }

    function testWithdraw() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        mcd.dai().mint(address(this), 100 ether);
        mcd.dai().approve(address(host), 100 ether);
        hostDeposit(address(this), 100 ether);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(mcd.dai().balanceOf(address(123)), 0);
        guestDomain.relayFromHost(true);

        rmcd.vat().hope(address(rmcd.daiJoin()));
        rmcd.dai().approve(address(guest), 100 ether);
        assertEq(Vat(address(rmcd.vat())).surf(), int256(100 * RAD));
        assertEq(rmcd.dai().balanceOf(address(this)), 100 ether);

        guestWithdraw(address(123), 100 ether);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        assertEq(rmcd.dai().balanceOf(address(this)), 0);
        guestDomain.relayToHost(true);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai);
        assertEq(mcd.dai().balanceOf(address(123)), 100 ether);
    }

    function testRegisterMint() public {
        TeleportGUID memory teleport = TeleportGUID({
            sourceDomain: "host-domain",
            targetDomain: "guest-domain",
            receiver: bytes32(0),
            operator: bytes32(0),
            amount: 100 ether,
            nonce: 0,
            timestamp: uint48(block.timestamp)
        });

        // Host -> Guest
        host.registerMint(teleport);
        hostInitializeRegisterMint(teleport);
        vm.expectEmit(true, true, true, true);
        emit FinalizeRegisterMint(teleport);
        guestDomain.relayFromHost(true);

        // Guest -> Host
        guest.registerMint(teleport);
        guestInitializeRegisterMint(teleport);
        vm.expectEmit(true, true, true, true);
        emit FinalizeRegisterMint(teleport);
        guestDomain.relayToHost(true);
    }

    function testSettle() public {
        // Host -> Guest
        mcd.dai().mint(address(host), 100 ether);
        host.settle("host-domain", "guest-domain", 100 ether);
        hostInitializeSettle(0);
        guestDomain.relayFromHost(true);
        assertEq(rmcd.dai().balanceOf(address(guestRouter)), 100 ether);

        // Guest -> Host
        rmcd.dai().setBalance(address(guest), 50 ether);
        guest.settle("guest-domain", "host-domain", 50 ether);
        guestInitializeSettle(0);
        guestDomain.relayToHost(true);
        assertEq(mcd.dai().balanceOf(address(hostRouter)), 50 ether);
    }

}
