// SPDX-License-Identifier: AGPL-3.0-or-later

/// DomainHost.sol -- xdomain host dss credit faciility

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

import "./TeleportGUID.sol";
import {DomainGuest} from "./DomainGuest.sol";

interface VatLike {
    function live() external view returns (uint256);
    function hope(address usr) external;
    function file(bytes32 what, uint256 data) external;
    function slip(bytes32 ilk, address usr, int256 wad) external;
    function frob(bytes32 i, address u, address v, address w, int dink, int dart) external;
    function suck(address u, address v, uint256 rad) external;
    function urns(bytes32, address) external view returns (uint256, uint256);
    function grab(bytes32, address, address, address, int256, int256) external;
}

interface DaiJoinLike {
    function vat() external view returns (VatLike);
    function dai() external view returns (DaiLike);
    function join(address usr, uint256 wad) external;
    function exit(address usr, uint256 wad) external;
}

interface DaiLike {
    function balanceOf(address usr) external view returns (uint256);
    function transfer(address dst, uint256 wad) external returns (bool);
    function transferFrom(address src, address dst, uint256 wad) external returns (bool);
    function approve(address usr, uint wad) external returns (bool);
}

interface RouterLike {
    function settle(bytes32 sourceDomain, bytes32 targetDomain, uint256 amount) external;
    function registerMint(TeleportGUID calldata teleport) external;
}

struct Settlement {
    bytes32 sourceDomain;
    bytes32 targetDomain;
    uint256 amount;
    bool    sent;
}

/// @title Support for xchain MCD, canonical DAI and Maker Teleport
/// @dev This is just the business logic which needs concrete message-passing implementation
abstract contract DomainHost {

    // --- Data ---
    mapping (address => uint256) public wards;
    mapping (bytes32 => bool)    public teleports;
    Settlement[]                 public settlementQueue;

    bytes32     public immutable ilk;
    VatLike     public immutable vat;
    DaiJoinLike public immutable daiJoin;
    DaiLike     public immutable dai;
    address     public immutable escrow;
    RouterLike  public immutable router;

    address public vow;
    uint256 public lid;         // Local ordering id
    uint256 public rid;         // Remote ordering id
    uint256 public line;        // Remote domain global debt ceiling [RAD]
    uint256 public grain;       // Keep track of the pre-minted DAI in the escrow [WAD]
    uint256 public sin;         // A running total of how much is required to re-capitalize the remote domain [WAD]
    uint256 public cure;        // The amount of unused debt [RAD]
    bool public cureReported;   // Returns true if cure has been reported by the guest
    uint256 public live;

    uint256 constant RAY = 10 ** 27;

    string constant ARITHMETIC_ERROR = string(abi.encodeWithSignature("Panic(uint256)", 0x11));

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, address data);
    event Lift(uint256 wad);
    event Release(uint256 wad);
    event Push(int256 wad);
    event Rectify(uint256 wad);
    event Cage();
    event Tell(uint256 value);
    event Exit(address indexed usr, uint256 wad, uint256 claim);
    event UndoExit(address indexed originalSender, uint256 wad);
    event Deposit(address indexed to, uint256 amount);
    event UndoDeposit(address indexed originalSender, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event RegisterMint(TeleportGUID teleport);
    event InitializeRegisterMint(TeleportGUID teleport);
    event FinalizeRegisterMint(TeleportGUID teleport);
    event Settle(bytes32 sourceDomain, bytes32 targetDomain, uint256 amount);
    event InitializeSettle(bytes32 sourceDomain, bytes32 targetDomain, uint256 amount);
    event FinalizeSettle(bytes32 sourceDomain, bytes32 targetDomain, uint256 amount);

    modifier auth {
        require(wards[msg.sender] == 1, "DomainHost/not-authorized");
        _;
    }

    function _isGuest(address usr) internal virtual view returns (bool);
    modifier guestOnly {
        require(_isGuest(msg.sender), "DomainHost/not-guest");
        _;
    }

    modifier vatLive {
        require(vat.live() == 1, "DomainHost/vat-not-live");
        _;
    }

    modifier ordered(uint256 _lid) {
        require(lid++ == _lid, "DomainHost/out-of-order");
        _;
    }

    constructor(bytes32 _ilk, address _daiJoin, address _escrow, address _router) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);
        
        ilk = _ilk;
        daiJoin = DaiJoinLike(_daiJoin);
        vat = daiJoin.vat();
        dai = daiJoin.dai();
        escrow = _escrow;
        router = RouterLike(_router);
        
        vat.hope(_daiJoin);
        dai.approve(_daiJoin, type(uint256).max);
        dai.approve(_router, type(uint256).max);

        live = 1;
    }

    // --- Math ---
    function _int256(uint256 x) internal pure returns (int256 y) {
        require((y = int256(x)) >= 0, ARITHMETIC_ERROR);
    }
    function _divup(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = (x + y - 1) / y;
    }

    // --- Administration ---
    function rely(address usr) external auth {
        wards[usr] = 1;
        emit Rely(usr);
    }

    function deny(address usr) external auth {
        wards[usr] = 0;
        emit Deny(usr);
    }

    function file(bytes32 what, address data) external auth {
        if (what == "vow") vow = data;
        else revert("DomainHost/file-unrecognized-param");
        emit File(what, data);
    }

    // --- MCD Support ---

    /// @notice Set the global debt ceiling for the remote domain
    /// @dev Please note that pre-mint DAI cannot be removed from the remote domain
    /// until the remote domain signals that it is safe to do so
    /// @param wad The new debt ceiling [WAD]
    function _lift(uint256 wad) internal auth vatLive returns (bytes memory payload) {
        uint256 rad = wad * RAY;
        uint256 minted;
        int256 dline = _int256(rad) - _int256(line);

        if (rad > line) {
            // We are issuing new pre-minted DAI
            minted = (rad - line) / RAY;                    // No precision loss as line is always a multiple of RAY
            vat.slip(ilk, address(this), int256(minted));   // No need for conversion check as amt is under a RAY of full size
            vat.frob(ilk, address(this), address(this), address(this), int256(minted), int256(minted));
            daiJoin.exit(escrow, minted);

            grain += minted;
        }

        line = rad;

        payload = abi.encodeWithSelector(DomainGuest.lift.selector, rid++, dline);

        emit Lift(wad);
    }

    /// @notice Withdraw pre-mint DAI from the remote domain
    /// @param _lid Local ordering id
    /// @param wad The amount of DAI to release [WAD]
    function release(uint256 _lid, uint256 wad) external guestOnly vatLive ordered(_lid) {
        int256 amt = -_int256(wad);

        // Fix any permissionless repays that may have occurred
        (uint256 ink, uint256 art) = vat.urns(ilk, address(this));
        if (art < ink) {
            address _vow = vow;
            uint256 diff = ink - art;
            vat.suck(_vow, _vow, diff * RAY); // This needs to be done to make sure we can deduct sin[vow] and vice in the next call
            vat.grab(ilk, address(this), address(this), _vow, 0, _int256(diff));
        }

        require(dai.transferFrom(escrow, address(this), wad), "DomainHost/transfer-failed");
        daiJoin.join(address(this), wad);
        vat.frob(ilk, address(this), address(this), address(this), amt, amt);
        vat.slip(ilk, address(this), amt);

        grain -= wad;

        emit Release(wad);
    }

    /// @notice Guest is pushing a surplus (or deficit)
    /// @param _lid Local ordering id
    /// @param wad The amount of DAI to push (or pull) [WAD]
    function push(uint256 _lid, int256 wad) external guestOnly ordered(_lid) {
        if (wad >= 0) {
            dai.transferFrom(address(escrow), address(this), uint256(wad));
            daiJoin.join(address(vow), uint256(wad));
        } else {
            sin += uint256(-wad);
        }

        emit Push(wad);
    }

    /// @notice Move bad debt from the remote domain into the local vow
    /// @dev This is a potentially dangerous operation as a malicious domain can drain the entire surplus buffer
    /// Because of this we require an authed party to perform this operation
    function _rectify() internal auth vatLive returns (bytes memory payload) {
        uint256 wad = sin;
        require(sin > 0, "DomainHost/no-sin");
        vat.suck(vow, address(this), wad * RAY);
        daiJoin.exit(address(escrow), wad);
        sin = 0;
        
        // Send ERC20 DAI to the remote DomainGuest
        payload = abi.encodeWithSelector(DomainGuest.rectify.selector, rid++, wad);

        emit Rectify(wad);
    }

    /// @notice Initiate shutdown for this domain
    /// @dev This will trigger the end module on the remote domain
    function _cage() internal returns (bytes memory payload) {
        require(vat.live() == 0 || wards[msg.sender] == 1, "DomainHost/not-authorized");
        require(live == 1, "DomainHost/not-live");

        live = 0;

        payload = abi.encodeWithSelector(DomainGuest.cage.selector, rid++);

        emit Cage();
    }

    /// @notice Set this domain's cure value
    /// @param _lid Local ordering id
    /// @param value The value of the cure [RAD]
    function tell(uint256 _lid, uint256 value) external guestOnly ordered(_lid) {
        require(live == 0, "DomainHost/live");
        require(!cureReported, "DomainHost/cure-reported");
        require(_divup(value, RAY) <= grain, "DomainHost/cure-bad-value");

        cureReported = true;
        cure = value;

        emit Tell(value);
    }

    /// @notice Allow DAI holders to exit during global settlement
    /// @dev    This will mint a pro-rata claim token on the remote domain.
    ///         Gem amount is scaled by the actual debt of the remote domain.
    ///         `usr` is the address for the mint on the remote domain.
    /// @param usr The address to send the claim token to
    /// @param wad The amount of gems to exit [WAD]
    function _exit(address usr, uint256 wad) internal returns (bytes memory payload) {
        require(vat.live() == 0, "DomainHost/vat-live");
        vat.slip(ilk, msg.sender, -_int256(wad));

        // Convert to actual debt amount
        // Round against the user
        uint256 claimAmount = wad * (grain - _divup(cure, RAY)) / grain;
        
        payload = abi.encodeWithSelector(DomainGuest.exit.selector, usr, claimAmount);

        emit Exit(usr, wad, claimAmount);
    }

    /// @notice Undo an exit
    /// @dev    Some chains do not guarantee inclusion of a transaction.
    ///         This function allows the user to undo an exit if it is not relayed
    ///         to the other side.
    ///         It is up to the implementation to ensure this message was not relayed
    ///         otherwise you open yourself up to double spends.
    /// @param originalSender The msg.sender from the _exit() call
    /// @param wad The amount of gems that was attempted to exit [WAD]
    function _undoExit(address originalSender, uint256 wad) internal {
        vat.slip(ilk, originalSender, _int256(wad));

        emit UndoExit(originalSender, wad);
    }

    // --- Canonical DAI Support ---

    /// @notice Deposit local DAI to mint remote canonical DAI
    /// @param to The address to send the DAI to on the remote domain
    /// @param amount The amount of DAI to deposit [WAD]
    function _deposit(address to, uint256 amount) internal returns (bytes memory payload) {
        require(dai.transferFrom(msg.sender, escrow, amount), "DomainHost/transfer-failed");

        payload = abi.encodeWithSelector(DomainGuest.deposit.selector, to, amount);

        emit Deposit(to, amount);
    }

    /// @notice Undo a deposit
    /// @dev    Some chains do not guarantee inclusion of a transaction.
    ///         This function allows the user to undo an exit if it is not relayed
    ///         to the other side.
    ///         It is up to the implementation to ensure this message was not relayed
    ///         otherwise you open yourself up to double spends.
    /// @param originalSender The msg.sender from the _deposit() call
    /// @param amount The amount of DAI that was attempted to deposit [WAD]
    function _undoDeposit(address originalSender, uint256 amount) internal {
        require(dai.transferFrom(escrow, originalSender, amount), "DomainHost/transfer-failed");

        emit UndoDeposit(originalSender, amount);
    }

    /// @notice Withdraw local DAI by burning remote canonical DAI
    /// @param to The address to send the DAI to on the local domain
    /// @param amount The amount of DAI to withdraw [WAD]
    function withdraw(address to, uint256 amount) external guestOnly {
        require(dai.transferFrom(escrow, to, amount), "DomainHost/transfer-failed");

        emit Withdraw(to, amount);
    }

    // --- Maker Teleport Support ---

    /// @notice Finalize a teleport registration via the slow path
    function registerMint(TeleportGUID calldata teleport) external auth {
        teleports[getGUIDHash(teleport)] = true;

        emit RegisterMint(teleport);
    }
    function _initializeRegisterMint(TeleportGUID calldata teleport) internal returns (bytes memory payload) {
        // There is no issue with resending these messages as the end TeleportJoin will enforce only-once execution
        require(teleports[getGUIDHash(teleport)], "DomainHost/teleport-not-registered");

        payload = abi.encodeWithSelector(DomainGuest.finalizeRegisterMint.selector, teleport);

        emit InitializeRegisterMint(teleport);
    }
    function finalizeRegisterMint(TeleportGUID calldata teleport) external guestOnly {
        router.registerMint(teleport);

        emit FinalizeRegisterMint(teleport);
    }

    function settle(bytes32 sourceDomain, bytes32 targetDomain, uint256 amount) external auth {
        require(dai.transfer(escrow, amount), "DomainHost/transfer-failed");
        settlementQueue.push(Settlement({
            sourceDomain: sourceDomain,
            targetDomain: targetDomain,
            amount: amount,
            sent: false
        }));

        emit Settle(sourceDomain, targetDomain, amount);
    }
    function _initializeSettle(uint256 index) internal returns (bytes memory payload) {
        require(index < settlementQueue.length, "DomainHost/settlement-not-found");
        Settlement memory settlement = settlementQueue[index];
        require(!settlement.sent, "DomainHost/settlement-already-sent");
        settlementQueue[index].sent = true;

        payload = abi.encodeWithSelector(DomainGuest.finalizeSettle.selector, settlement.sourceDomain, settlement.targetDomain, settlement.amount);

        emit InitializeSettle(settlement.sourceDomain, settlement.targetDomain, settlement.amount);
    }
    function finalizeSettle(bytes32 sourceDomain, bytes32 targetDomain, uint256 amount) external guestOnly {
        require(dai.transferFrom(escrow, address(this), amount), "DomainHost/transfer-failed");
        router.settle(sourceDomain, targetDomain, amount);

        emit FinalizeSettle(sourceDomain, targetDomain, amount);
    }

    function settlementQueueCount() external view returns (uint256) {
        return settlementQueue.length;
    }

}
