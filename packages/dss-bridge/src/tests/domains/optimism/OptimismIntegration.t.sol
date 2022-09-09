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
import "ds-value/value.sol";

import { DaiAbstract, EndAbstract } from "dss-interfaces/Interfaces.sol";

import { Cure } from "xdomain-dss/Cure.sol";
import { Dai } from "xdomain-dss/Dai.sol";
import { DaiJoin } from "xdomain-dss/DaiJoin.sol";
import { End } from "xdomain-dss/End.sol";
import { Pot } from "xdomain-dss/Pot.sol";
import { Jug } from "xdomain-dss/Jug.sol";
import { Spotter } from "xdomain-dss/Spotter.sol";
import { Vat } from "xdomain-dss/Vat.sol";

import { ClaimToken } from "../../../ClaimToken.sol";
import { DomainHost, TeleportGUID, TeleportGUIDHelper } from "../../../DomainHost.sol";
import { DomainGuest } from "../../../DomainGuest.sol";
import { BridgeOracle } from "../../../BridgeOracle.sol";
import { OptimismDomainHost } from "../../../domains/optimism/OptimismDomainHost.sol";
import { OptimismDomainGuest } from "../../../domains/optimism/OptimismDomainGuest.sol";

interface MessengerLike {
    function xDomainMessageSender() external view returns (address);
    function sendMessage(
        address _target,
        bytes memory _message,
        uint32 _gasLimit
    ) external;
    function relayMessage(
        address _target,
        address _sender,
        bytes memory _message,
        uint256 _messageNonce
    ) external;
}

interface CTCLike {
    function getQueueLength() external view returns (uint40);
}

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

// Need to insert an eavesdrop contract to grab values to relay to l2
contract MessageRelayEavesdrop {

    MessengerLike public messenger;
    address public target;
    address public sender;
    bytes public message;
    address internal xDomainMessageSenderOverride;

    constructor(address _messenger) {
        messenger = MessengerLike(_messenger);
    }

    function setXDomainMessageSender(address _xDomainMessageSender) public {
        xDomainMessageSenderOverride = _xDomainMessageSender;
    }

    function xDomainMessageSender() external view returns (address) {
        return xDomainMessageSenderOverride != address(0) ? xDomainMessageSenderOverride : messenger.xDomainMessageSender();
    }

    function relayMessage(
        address _target,
        bytes memory _message
    ) external {
        // Invoke the call
        bool success;
        (success,) = _target.call(_message);
        if (!success) {
            revert("Failed to call.");
        }
    }

    function sendMessage(
        address _target,
        bytes memory _message,
        uint32 _gasLimit
    ) external {
        target = _target;
        sender = msg.sender;
        message = _message;

        // Forward the message
        messenger.sendMessage(_target, _message, _gasLimit);
    }

}

contract OptimismIntegrationTest is DSSTest {

    using GodMode for *;

    // Ethereum-side contracts
    MessengerLike l1messenger;
    MessageRelayEavesdrop l1Eavesdrop;
    EscrowLike escrow;
    BridgeOracle pip;
    OptimismDomainHost host;
    CTCLike ctc;

    // Optimism-side contracts
    MessengerLike l2messenger;
    MessageRelayEavesdrop l2Eavesdrop;
    MCD rmcd;
    ClaimToken claimToken;
    OptimismDomainGuest guest;

    bytes32 constant DOMAIN_ILK = "SOME-DOMAIN-A";
    bytes32 constant REMOTE_COLL_ILK = "XCHAIN-COLLATERAL-A";

    uint256 mainnetFork;
    uint256 optimismFork;

    function setupEnv() internal virtual override returns (MCD) {
        return autoDetectEnv();
    }

    function postSetup() internal virtual override {
        mainnetFork = vm.createFork("mainnet");
        optimismFork = vm.createFork("optimism");

        // --- Setup mainnet contracts ---
        vm.selectFork(mainnetFork);

        escrow = EscrowLike(mcd.chainlog().getAddress("OPTIMISM_ESCROW"));
        l1messenger = MessengerLike(0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1);
        ctc = CTCLike(0x5E4e65926BA27467555EB562121fac00D24E9dD2);
        // TODO add support for Teleport router when it's available
        l1Eavesdrop = new MessageRelayEavesdrop(address(l1messenger));
        // Pre-calc the guest nonce
        address guestAddr = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), bytes1(0x09))))));
        host = new OptimismDomainHost(DOMAIN_ILK, address(mcd.daiJoin()), address(escrow), address(0), address(l1Eavesdrop), guestAddr);
        host.file("vow", address(mcd.vow()));
        host.rely(address(guest));
        mcd.giveAdminAccess();
        mcd.vat().rely(address(host));
        address(escrow).setWard(address(this), 1);
        escrow.approve(address(mcd.dai()), address(host), type(uint256).max);
        pip = new BridgeOracle(address(host));
        mcd.initIlk(DOMAIN_ILK, address(host), address(pip));
        mcd.vat().file(DOMAIN_ILK, "line", 1_000_000 * RAD);
        mcd.cure().lift(address(host));

        // Set gas
        host.file("glLift", 1_000_000);
        host.file("glRectify", 1_000_000);
        host.file("glCage", 1_000_000);
        host.file("glExit", 1_000_000);
        host.file("glDeposit", 1_000_000);

        // --- Setup optimism contracts ---
        vm.selectFork(optimismFork);

        l2messenger = MessengerLike(0x4200000000000000000000000000000000000007);
        l2Eavesdrop = new MessageRelayEavesdrop(address(l2messenger));
        Vat vat = new Vat();
        Dai dai = Dai(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);
        DaiJoin daiJoin = new DaiJoin(address(vat), address(dai));
        claimToken = new ClaimToken();
        guest = new OptimismDomainGuest(DOMAIN_ILK, address(daiJoin), address(claimToken), address(l2Eavesdrop), address(host));
        assertEq(address(guest), guestAddr);
        claimToken.rely(address(guest));
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
        guest.file("end", address(rmcd.end()));
        guest.rely(address(rmcd.end()));
        rmcd.vat().rely(address(guest));
        rmcd.end().rely(address(guest));

        // Default back to mainnet
        vm.selectFork(mainnetFork);
    }

    function relayLastMessageL1toL2() internal {
        address target = l1Eavesdrop.target();
        address sender = l1Eavesdrop.sender();
        bytes memory message = l1Eavesdrop.message();

        vm.selectFork(optimismFork);

        uint160 offset = uint160(0x1111000000000000000000000000000000001111);
        address malias;
        unchecked {
            malias = address(uint160(address(l1messenger)) + offset);
        }
        vm.startPrank(malias);
        // Wrap the message to send through the eavesdrop contract so the address is correct for the Guest
        l2messenger.relayMessage(address(l2Eavesdrop), sender, abi.encodeWithSelector(MessageRelayEavesdrop.relayMessage.selector, target, message), 1);
        vm.stopPrank();
    }

    function relayLastMessageL2toL1() internal {
        address target = l2Eavesdrop.target();
        address sender = l2Eavesdrop.sender();
        bytes memory message = l2Eavesdrop.message();

        vm.selectFork(mainnetFork);

        // TODO use the actual messege relayer with state inclusion proofs
        l1Eavesdrop.setXDomainMessageSender(sender);
        vm.startPrank(address(l1Eavesdrop));
        bool success;
        (success,) = target.call(message);
        if (!success) {
            revert("Failed to call.");
        }
        vm.stopPrank();
        l1Eavesdrop.setXDomainMessageSender(address(0));
    }

    function testRaiseDebtCeiling() public {
        uint40 ctclen = ctc.getQueueLength();
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);

        host.lift(100 ether);

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(l1Eavesdrop.target(), address(guest));    
        assertEq(l1Eavesdrop.sender(), address(host)); 
        assertEq(l1Eavesdrop.message(), abi.encodeWithSelector(DomainGuest.lift.selector, 0, int256(100 * RAD)));
        assertEq(ctc.getQueueLength(), ctclen + 1);  // Should queue up the CTC

        // Play the message on L2
        relayLastMessageL1toL2();

        assertEq(rmcd.vat().Line(), 100 * RAD);
    }

    function testRaiseLowerDebtCeiling() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        (uint256 ink, uint256 art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(host.grain(), 0);
        assertEq(host.line(), 0);

        host.lift(100 ether);

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 100 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        relayLastMessageL1toL2();
        assertEq(rmcd.vat().Line(), 100 * RAD);

        // Pre-mint DAI is not released here
        vm.selectFork(mainnetFork);
        host.lift(50 ether);

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(host.grain(), 100 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);

        relayLastMessageL1toL2();
        assertEq(rmcd.vat().Line(), 50 * RAD);

        // Notify the host that the DAI is safe to remove
        guest.release();

        assertEq(l2Eavesdrop.target(), address(host));    
        assertEq(l2Eavesdrop.sender(), address(guest)); 
        assertEq(l2Eavesdrop.message(), abi.encodeWithSelector(DomainHost.release.selector, 0, 50 * WAD));
        assertEq(rmcd.vat().Line(), 50 * RAD);
        assertEq(rmcd.vat().debt(), 0);

        relayLastMessageL2toL1();
        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 50 ether);
        assertEq(art, 50 ether);
        assertEq(host.grain(), 50 ether);
        assertEq(host.line(), 50 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 50 ether);

        // Add some debt to the guest instance, lower the DC and release some more pre-mint
        // This can only release pre-mint DAI up to the debt
        vm.selectFork(optimismFork);
        rmcd.vat().suck(address(guest), address(this), 40 * RAD);
        assertEq(rmcd.vat().Line(), 50 * RAD);
        assertEq(rmcd.vat().debt(), 40 * RAD);

        vm.selectFork(mainnetFork);
        host.lift(25 ether);
        relayLastMessageL1toL2();
        guest.release();
        relayLastMessageL2toL1();

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
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
        host.lift(100 ether);
        relayLastMessageL1toL2();
        rmcd.vat().suck(address(123), address(guest), 50 * RAD);
        rmcd.vat().suck(address(guest), address(123), 20 * RAD);

        assertEq(rmcd.vat().dai(address(guest)), 50 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 20 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);

        guest.push();
        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);
        assertEq(Vat(address(rmcd.vat())).surf(), -int256(30 * RAD));
        relayLastMessageL2toL1();

        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai + 30 * RAD);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 70 ether);
    }

    function testPushDeficit() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));
        uint256 vowDai = mcd.vat().dai(address(mcd.vow()));
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        // Set global DC and add 20 DAI surplus + 50 DAI debt to vow
        host.lift(100 ether);
        relayLastMessageL1toL2();
        rmcd.vat().suck(address(123), address(guest), 20 * RAD);
        rmcd.vat().suck(address(guest), address(123), 50 * RAD);

        assertEq(rmcd.vat().dai(address(guest)), 20 * RAD);
        assertEq(rmcd.vat().sin(address(guest)), 50 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);

        guest.push();
        relayLastMessageL2toL1();

        vm.selectFork(optimismFork);
        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 30 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        vm.selectFork(mainnetFork);

        host.rectify();
        assertEq(mcd.vat().dai(address(mcd.vow())), vowDai);
        assertEq(mcd.vat().sin(address(mcd.vow())), vowSin + 30 * RAD);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 130 ether);
        relayLastMessageL1toL2();

        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
        assertEq(rmcd.vat().dai(address(guest)), 30 * RAD);

        guest.heal();

        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);
        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
    }

    function testGlobalShutdown() public {
        assertEq(host.live(), 1);
        assertEq(mcd.vat().live(), 1);
        assertEq(pip.read(), bytes32(WAD));

        // Set up some debt in the guest instance
        host.lift(100 ether);
        relayLastMessageL1toL2();
        rmcd.initIlk(REMOTE_COLL_ILK);
        rmcd.vat().file(REMOTE_COLL_ILK, "line", 1_000_000 * RAD);
        rmcd.vat().slip(REMOTE_COLL_ILK, address(this), 40 ether);
        rmcd.vat().frob(REMOTE_COLL_ILK, address(this), address(this), address(this), 40 ether, 40 ether);

        assertEq(guest.live(), 1);
        assertEq(rmcd.vat().live(), 1);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (uint256 ink, uint256 art) = rmcd.vat().urns(REMOTE_COLL_ILK, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);

        vm.selectFork(mainnetFork);
        mcd.end().cage();
        host.deny(address(this));       // Confirm cage can be done permissionlessly
        host.cage();

        // Verify cannot cage the host ilk until a final cure is reported
        assertRevert(address(mcd.end()), abi.encodeWithSignature("cage(bytes32)", DOMAIN_ILK), "BridgeOracle/haz-not");

        assertEq(mcd.vat().live(), 0);
        assertEq(host.live(), 0);
        relayLastMessageL1toL2();
        assertEq(guest.live(), 0);
        assertEq(rmcd.vat().live(), 0);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (ink, art) = rmcd.vat().urns(REMOTE_COLL_ILK, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(rmcd.vat().gem(REMOTE_COLL_ILK, address(rmcd.end())), 0);
        assertEq(rmcd.vat().sin(address(guest)), 0);

        // --- Settle out the Guest instance ---

        rmcd.end().cage(REMOTE_COLL_ILK);
        rmcd.end().skim(REMOTE_COLL_ILK, address(this));

        (ink, art) = rmcd.vat().urns(REMOTE_COLL_ILK, address(this));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(rmcd.vat().gem(REMOTE_COLL_ILK, address(rmcd.end())), 40 ether);
        assertEq(rmcd.vat().sin(address(guest)), 40 * RAD);

        vm.warp(block.timestamp + rmcd.end().wait());

        rmcd.end().thaw();
        guest.tell();
        assertEq(guest.grain(), 100 ether);
        rmcd.end().flow(REMOTE_COLL_ILK);
        relayLastMessageL2toL1();
        assertEq(host.cure(), 60 * RAD);    // 60 pre-mint dai is unused

        // --- Settle out the Host instance ---

        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 100 ether);
        assertEq(art, 100 ether);
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(mcd.end())), 0);
        uint256 vowSin = mcd.vat().sin(address(mcd.vow()));

        mcd.end().cage(DOMAIN_ILK);

        assertEq(mcd.end().tag(DOMAIN_ILK), 25 * RAY / 10);   // Tag should be 2.5 (1 / $1 * 40% debt used)
        assertEq(mcd.end().gap(DOMAIN_ILK), 0);

        mcd.end().skim(DOMAIN_ILK, address(host));

        assertEq(mcd.end().gap(DOMAIN_ILK), 150 * WAD);
        (ink, art) = mcd.vat().urns(DOMAIN_ILK, address(host));
        assertEq(ink, 0);
        assertEq(art, 0);
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(mcd.end())), 100 ether);
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

        mcd.end().flow(DOMAIN_ILK);

        assertEq(mcd.end().fix(DOMAIN_ILK), (100 * RAD) / (mcd.end().debt() / RAY));

        // --- Do user redemption for remote domain collateral ---

        // Pretend you own 50% of all outstanding debt (should be a pro-rate claim on $20 for the remote domain)
        uint256 myDai = (mcd.end().debt() / 2) / RAY;
        mcd.vat().suck(address(123), address(this), myDai * RAY);
        mcd.vat().hope(address(mcd.end()));

        // Pack all your DAI
        assertEq(mcd.end().bag(address(this)), 0);
        mcd.end().pack(myDai);
        assertEq(mcd.end().bag(address(this)), myDai);

        // Should get 50 gems valued at $0.40 each
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(this)), 0);
        mcd.end().cash(DOMAIN_ILK, myDai);
        uint256 gems = mcd.vat().gem(DOMAIN_ILK, address(this));
        assertApproxEqRel(gems, 50 ether, WAD / 10000);

        // Exit to the remote domain
        host.exit(address(this), gems);
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(this)), 0);
        relayLastMessageL1toL2();
        uint256 tokens = claimToken.balanceOf(address(this));
        assertApproxEqAbs(tokens, 20 ether, WAD / 10000);

        // Can now get some collateral on the remote domain
        claimToken.approve(address(rmcd.end()), type(uint256).max);
        assertEq(rmcd.end().bag(address(this)), 0);
        rmcd.end().pack(tokens);
        assertEq(rmcd.end().bag(address(this)), tokens);

        // Should get some of the dummy collateral gems
        assertEq(rmcd.vat().gem(REMOTE_COLL_ILK, address(this)), 0);
        rmcd.end().cash(REMOTE_COLL_ILK, tokens);
        assertEq(rmcd.vat().gem(REMOTE_COLL_ILK, address(this)), tokens);

        // We can now exit through gem join or other standard exit function
    }

    function testDeposit() public {
        mcd.dai().mint(address(this), 100 ether);
        mcd.dai().approve(address(host), 100 ether);
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        host.deposit(address(123), 100 ether);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        relayLastMessageL1toL2();

        assertEq(Vat(address(rmcd.vat())).surf(), int256(100 * RAD));
        assertEq(rmcd.dai().balanceOf(address(123)), 100 ether);
    }

    function testWithdraw() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        mcd.dai().mint(address(this), 100 ether);
        mcd.dai().approve(address(host), 100 ether);
        host.deposit(address(this), 100 ether);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(mcd.dai().balanceOf(address(123)), 0);
        relayLastMessageL1toL2();

        rmcd.vat().hope(address(rmcd.daiJoin()));
        rmcd.dai().approve(address(guest), 100 ether);
        assertEq(Vat(address(rmcd.vat())).surf(), int256(100 * RAD));
        assertEq(rmcd.dai().balanceOf(address(this)), 100 ether);

        guest.withdraw(address(123), 100 ether);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        assertEq(rmcd.dai().balanceOf(address(this)), 0);
        relayLastMessageL2toL1();
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai);
        assertEq(mcd.dai().balanceOf(address(123)), 100 ether);
    }

}
