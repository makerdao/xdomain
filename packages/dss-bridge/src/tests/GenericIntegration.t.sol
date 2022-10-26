// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import "dss-test/DSSTest.sol";
import "ds-value/value.sol";

import { EndAbstract, ChainlogAbstract } from "dss-interfaces/Interfaces.sol";

import { Cure } from "xdomain-dss/Cure.sol";
import { Dai } from "xdomain-dss/Dai.sol";
import { DaiJoin } from "xdomain-dss/DaiJoin.sol";
import { End } from "xdomain-dss/End.sol";
import { Pot } from "xdomain-dss/Pot.sol";
import { Jug } from "xdomain-dss/Jug.sol";
import { Spotter } from "xdomain-dss/Spotter.sol";
import { Vat } from "xdomain-dss/Vat.sol";

import { ClaimToken } from "../ClaimToken.sol";
import { DomainHost, TeleportGUID } from "../DomainHost.sol";
import { DomainGuest } from "../DomainGuest.sol";
import { BridgeOracle } from "../BridgeOracle.sol";

interface EscrowLike {
    function approve(address token, address spender, uint256 value) external;
}

contract SimpleDomainHost is DomainHost {

    DomainGuest guest;

    constructor(bytes32 _ilk, address _daiJoin, address _escrow, address _router) DomainHost(_ilk, _daiJoin, _escrow, _router) {}

    function setGuest(address _guest) external {
        guest = DomainGuest(_guest);
    }
    function _isGuest(address usr) internal override view returns (bool) {
        return usr == address(guest);
    }

    function revertNoSuccess(bool success, bytes memory response) internal pure {
        if (!success) {
            string memory message;
            assembly {
                let size := mload(add(response, 0x44))
                message := mload(0x40)
                mstore(message, size)
                mstore(0x40, add(message, and(add(add(size, 0x20), 0x1f), not(0x1f))))
                returndatacopy(add(message, 0x20), 0x44, size)
            }
            revert(string(message));
        }
    }

    function lift(uint256 wad) external {
        (bool success, bytes memory response) = address(guest).call(_lift(wad));
        revertNoSuccess(success, response);
    }
    function rectify() external {
        (bool success, bytes memory response) = address(guest).call(_rectify());
        revertNoSuccess(success, response);
    }
    function cage() external {
        (bool success, bytes memory response) = address(guest).call(_cage());
        revertNoSuccess(success, response);
    }
    function exit(address usr, uint256 wad) external {
        (bool success, bytes memory response) = address(guest).call(_exit(usr, wad));
        revertNoSuccess(success, response);
    }
    function deposit(address to, uint256 amount) external {
        (bool success, bytes memory response) = address(guest).call(_deposit(to, amount));
        revertNoSuccess(success, response);
    }
    function initializeRegisterMint(TeleportGUID calldata teleport) external {
        (bool success, bytes memory response) = address(guest).call(_initializeRegisterMint(teleport));
        revertNoSuccess(success, response);
    }
    function initializeSettle(uint256 index) external {
        (bool success, bytes memory response) = address(guest).call(_initializeSettle(index));
        revertNoSuccess(success, response);
    }

}

contract SimpleDomainGuest is DomainGuest {

    DomainHost host;

    constructor(bytes32 _domain, address _daiJoin, address _claimToken, address _host, address _router) DomainGuest(_domain, _daiJoin, _claimToken, _router) {
        host = DomainHost(_host);
    }

    function _isHost(address usr) internal override view returns (bool) {
        return usr == address(host);
    }

    function revertNoSuccess(bool success, bytes memory response) internal pure {
        if (!success) {
            string memory message;
            assembly {
                let size := mload(add(response, 0x44))
                message := mload(0x40)
                mstore(message, size)
                mstore(0x40, add(message, and(add(add(size, 0x20), 0x1f), not(0x1f))))
                returndatacopy(add(message, 0x20), 0x44, size)
            }
            revert(string(message));
        }
    }

    function release() external {
        (bool success, bytes memory response) = address(host).call(_release());
        revertNoSuccess(success, response);
    }
    function push() external {
        (bool success, bytes memory response) = address(host).call(_push());
        revertNoSuccess(success, response);
    }
    function tell() external {
        (bool success, bytes memory response) = address(host).call(_tell());
        revertNoSuccess(success, response);
    }
    function withdraw(address to, uint256 amount) external {
        (bool success, bytes memory response) = address(host).call(_withdraw(to, amount));
        revertNoSuccess(success, response);
    }
    function initializeRegisterMint(TeleportGUID calldata teleport) external {
        (bool success, bytes memory response) = address(host).call(_initializeRegisterMint(teleport));
        revertNoSuccess(success, response);
    }
    function initializeSettle(uint256 index) external {
        (bool success, bytes memory response) = address(host).call(_initializeSettle(index));
        revertNoSuccess(success, response);
    }

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

contract GenericIntegrationTest is DSSTest {

    using GodMode for *;

    MCD mcd;

    // Bridge
    ClaimToken claimToken;
    SimpleDomainHost host;
    SimpleDomainGuest guest;
    BridgeOracle pip;

    // Local contracts
    EscrowLike escrow;

    // Remote domain MCD deploy
    MCD rmcd;

    bytes32 constant DOMAIN_ILK = "SOME-DOMAIN-A";
    bytes32 constant REMOTE_COLL_ILK = "XCHAIN-COLLATERAL-A";

    function setupEnv() internal virtual override {
        mcd = new MCD();
        mcd.loadFromChainlog(ChainlogAbstract(0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F));
    }

    function postSetup() internal virtual override {
        escrow = EscrowLike(mcd.chainlog().getAddress("OPTIMISM_ESCROW"));

        claimToken = new ClaimToken();
        // TODO add support for Teleport router when it's available
        host = new SimpleDomainHost(DOMAIN_ILK, address(mcd.daiJoin()), address(escrow), address(0));
        Vat vat = new Vat();
        Dai dai = new Dai();
        DaiJoin daiJoin = new DaiJoin(address(vat), address(dai));
        guest = new SimpleDomainGuest(DOMAIN_ILK, address(daiJoin), address(claimToken), address(host), address(0));
        pip = new BridgeOracle(address(host));
        claimToken.rely(address(guest));

        // Setup remote instance
        {
            DogMock dog = new DogMock();
            Spotter spotter = new Spotter(address(vat));
            Pot pot = new Pot(address(vat));
            Jug jug = new Jug(address(vat));
            Cure cure = new Cure();
            End end = new End();

            rmcd = new MCD();
            rmcd.loadCore({
                _vat: address(vat),
                _dai: address(dai),
                _daiJoin: address(daiJoin),
                _vow: address(guest),
                _dog: address(dog),
                _pot: address(pot),
                _jug: address(jug),
                _spotter: address(spotter),
                _end: address(end),
                _cure: address(cure)
            });
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
        mcd.initIlk(DOMAIN_ILK, address(host), address(pip));
        mcd.vat().file(DOMAIN_ILK, "line", 1_000_000 * RAD);
        mcd.cure().lift(address(host));
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

        assertEq(rmcd.vat().dai(address(guest)), 0);
        assertEq(rmcd.vat().sin(address(guest)), 30 * RAD);
        assertEq(Vat(address(rmcd.vat())).surf(), 0);

        host.rectify();

        assertEq(Vat(address(rmcd.vat())).surf(), int256(30 * RAD));
        assertEq(rmcd.vat().dai(address(guest)), 30 * RAD);
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
        // Set up some debt in the guest instance
        host.lift(100 ether);
        rmcd.initIlk(REMOTE_COLL_ILK);
        rmcd.vat().file(REMOTE_COLL_ILK, "line", 1_000_000 * RAD);
        rmcd.vat().slip(REMOTE_COLL_ILK, address(this), 40 ether);
        rmcd.vat().frob(REMOTE_COLL_ILK, address(this), address(this), address(this), 40 ether, 40 ether);

        assertEq(mcd.vat().live(), 1);
        assertEq(guest.live(), 1);
        assertEq(host.live(), 1);
        assertEq(rmcd.vat().live(), 1);
        assertEq(rmcd.vat().debt(), 40 * RAD);
        (uint256 ink, uint256 art) = rmcd.vat().urns(REMOTE_COLL_ILK, address(this));
        assertEq(ink, 40 ether);
        assertEq(art, 40 ether);
        assertEq(pip.read(), bytes32(WAD));

        mcd.end().cage();
        host.deny(address(this));       // Confirm cage can be done permissionlessly
        host.cage();

        // Verify cannot cage the host ilk until a final cure is reported
        assertRevert(address(mcd.end()), abi.encodeWithSignature("cage(bytes32)", DOMAIN_ILK), "BridgeOracle/haz-not");

        assertEq(mcd.vat().live(), 0);
        assertEq(guest.live(), 0);
        assertEq(host.live(), 0);
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
        assertEq(host.cure(), 60 * RAD);    // 60 pre-mint dai is unused

        rmcd.end().flow(REMOTE_COLL_ILK);

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
        assertEq(claimToken.balanceOf(address(this)), 0);
        host.exit(address(this), gems);
        assertEq(mcd.vat().gem(DOMAIN_ILK, address(this)), 0);
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

        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        assertEq(rmcd.dai().balanceOf(address(123)), 0);

        host.deposit(address(123), 100 ether);

        assertEq(Vat(address(rmcd.vat())).surf(), int256(100 * RAD));
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(rmcd.dai().balanceOf(address(123)), 100 ether);
    }

    function testWithdraw() public {
        uint256 escrowDai = mcd.dai().balanceOf(address(escrow));

        mcd.dai().mint(address(this), 100 ether);
        mcd.dai().approve(address(host), 100 ether);
        host.deposit(address(this), 100 ether);
        rmcd.vat().hope(address(rmcd.daiJoin()));
        rmcd.dai().approve(address(guest), 100 ether);

        assertEq(Vat(address(rmcd.vat())).surf(), int256(100 * RAD));
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai + 100 ether);
        assertEq(mcd.dai().balanceOf(address(123)), 0);
        assertEq(rmcd.dai().balanceOf(address(this)), 100 ether);

        guest.withdraw(address(123), 100 ether);

        assertEq(Vat(address(rmcd.vat())).surf(), 0);
        assertEq(mcd.dai().balanceOf(address(escrow)), escrowDai);
        assertEq(mcd.dai().balanceOf(address(123)), 100 ether);
        assertEq(rmcd.dai().balanceOf(address(this)), 0);
    }

}
