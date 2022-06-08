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

interface VatLike {
    function live() external view returns (uint256);
    function hope(address usr) external;
    function file(bytes32 what, uint256 data) external;
    function slip(bytes32 ilk, address usr, int256 wad) external;
    function frob(bytes32 i, address u, address v, address w, int dink, int dart) external;
    function suck(address u, address v, uint256 rad) external;
}

interface DaiJoinLike {
    function vat() external view returns (VatLike);
    function dai() external view returns (DaiLike);
    function join(address usr, uint256 wad) external;
    function exit(address usr, uint256 wad) external;
}

interface DaiLike {
    function balanceOf(address usr) external view returns (uint256);
    function transferFrom(address src, address dst, uint256 wad) external returns (bool);
    function approve(address usr, uint wad) external returns (bool);
}

interface RouterLike {
    function requestMint(
        TeleportGUID calldata teleportGUID,
        uint256 maxFeePercentage,
        uint256 operatorFee
    ) external returns (uint256 postFeeAmount, uint256 totalFee);
    function settle(bytes32 targetDomain, uint256 batchedDaiToFlush) external;
}

/// @title Support for xchain MCD, canonical DAI and Maker Teleport
/// @dev This is just the business logic which needs concrete message-passing implementation
abstract contract DomainHost {

    // --- Data ---
    mapping (address => uint256) public wards;

    bytes32     public immutable ilk;
    VatLike     public immutable vat;
    DaiJoinLike public immutable daiJoin;
    DaiLike     public immutable dai;
    address     public immutable escrow;
    RouterLike  public immutable router;

    address public vow;
    uint256 public line;        // Remove domain global debt ceiling [RAD]
    uint256 public grain;       // Keep track of the pre-minted DAI in the escrow [WAD]
    uint256 public cure;        // The amount of unused debt [RAD]
    bool public cureReported;   // Returns true if cure has been reported by the guest
    uint256 public live;

    uint256 constant RAY = 10 ** 27;

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, address data);
    event Lift(uint256 wad);
    event Release(uint256 wad);
    event Surplus(uint256 wad);
    event Deficit(uint256 wad);
    event Cage();
    event Tell(uint256 value);
    event Exit(address indexed usr, uint256 wad, uint256 claim);
    event Deposit(address indexed to, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event FinalizeTeleport(TeleportGUID teleport);
    event Flush(bytes32 targetDomain, uint256 daiToFlush);

    modifier auth {
        require(wards[msg.sender] == 1, "DomainHost/not-authorized");
        _;
    }

    modifier guestOnly {
        require(_isGuest(msg.sender), "DomainHost/not-guest");
        _;
    }

    modifier vatLive {
        require(vat.live() == 1, "DomainHost/vat-not-live");
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
        require((y = int256(x)) >= 0, "DomainHost/overflow");
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
    function lift(uint256 wad) external auth vatLive {
        uint256 rad = wad * RAY;
        uint256 minted;

        if (rad > line) {
            // We are issuing new pre-minted DAI
            minted = (rad - line) / RAY;                    // No precision loss as line is always a multiple of RAY
            vat.slip(ilk, address(this), int256(minted));   // No need for conversion check as amt is under a RAY of full size
            vat.frob(ilk, address(this), address(this), address(this), int256(minted), int256(minted));
            daiJoin.exit(escrow, minted);

            grain += minted;
        }

        line = rad;

        _lift(rad, minted);

        emit Lift(wad);
    }

    /// @notice Withdraw pre-mint DAI from the remote domain
    function release(uint256 wad) external guestOnly vatLive {
        int256 amt = -_int256(wad);

        require(dai.transferFrom(escrow, address(this), wad), "DomainHost/transfer-failed");
        daiJoin.join(address(this), wad);
        vat.frob(ilk, address(this), address(this), address(this), amt, amt);
        vat.slip(ilk, address(this), amt);

        grain -= wad;

        emit Release(wad);
    }

    /// @notice Merge DAI into surplus
    function surplus(uint256 wad) external guestOnly {
        dai.transferFrom(address(escrow), address(this), wad);
        daiJoin.join(address(vow), wad);

        emit Surplus(wad);
    }

    /// @notice Cover the remote domain's deficit by pulling debt from the surplus buffer
    function deficit(uint256 wad) external guestOnly vatLive {
        vat.suck(vow, address(this), wad * RAY);
        daiJoin.exit(address(escrow), wad);
        
        // Send ERC20 DAI to the remote DomainGuest
        _rectify(wad);

        emit Deficit(wad);
    }

    /// @notice Initiate shutdown for this domain
    /// @dev This will trigger the end module on the remote domain
    function cage() external {
        require(vat.live() == 0 || wards[msg.sender] == 1, "DomainHost/not-authorized");
        require(live == 1, "DomainHost/not-live");

        live = 0;

        _cage();

        emit Cage();
    }

    /// @notice Set this domain's cure value
    function tell(uint256 value) external guestOnly {
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
    function exit(address usr, uint256 wad) external {
        require(vat.live() == 0, "DomainHost/vat-live");
        vat.slip(ilk, msg.sender, -_int256(wad));

        // Convert to actual debt amount
        // Round against the user
        uint256 claim = wad * (grain - _divup(cure, RAY)) / grain;
        
        _mintClaim(usr, claim);

        emit Exit(usr, wad, claim);
    }

    // --- Canonical DAI Support ---

    /// @notice Deposit local DAI to mint remote canonical DAI
    /// @param to The address to send the DAI to on the remote domain
    /// @param amount The amount of DAI to deposit [WAD]
    function deposit(address to, uint256 amount) external {
        require(dai.transferFrom(msg.sender, escrow, amount), "DomainHost/transfer-failed");

        _deposit(to, amount);

        emit Deposit(to, amount);
    }

    /// @notice Withdraw local DAI by burning remote canonical DAI
    /// @param to The address to send the DAI to on the local domain
    /// @param amount The amount of DAI to withdraw [WAD]
    function withdraw(address to, uint256 amount) external guestOnly {
        require(dai.transferFrom(escrow, to, amount), "DomainHost/transfer-failed");

        emit Withdraw(to, amount);
    }

    // --- Maker Teleport Support ---

    /// @notice Finalize a teleport registration
    function finalizeTeleport(TeleportGUID calldata teleport) external guestOnly {
        router.requestMint(teleport, 0, 0);

        emit FinalizeTeleport(teleport);
    }

    /// @notice Flush any accumulated DAI
    function flush(bytes32 targetDomain, uint256 daiToFlush) external guestOnly {
        // Pull DAI from the escrow to this contract
        dai.transferFrom(escrow, address(this), daiToFlush);
        // The router will pull the DAI from this contract
        router.settle(targetDomain, daiToFlush);

        emit Flush(targetDomain, daiToFlush);
    }

    // Bridge-specific functions
    function _isGuest(address usr) internal virtual view returns (bool);
    function _lift(uint256 line, uint256 minted) internal virtual;
    function _rectify(uint256 wad) internal virtual;
    function _cage() internal virtual;
    function _mintClaim(address usr, uint256 claim) internal virtual;
    function _deposit(address to, uint256 amount) internal virtual;

}
