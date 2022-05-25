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

pragma solidity ^0.8.13;

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

/// @title Extend a line of credit to a domain
abstract contract DomainHost {

    // --- Data ---
    mapping (address => uint256) public wards;

    bytes32     public immutable ilk;
    VatLike     public immutable vat;
    DaiJoinLike public immutable daiJoin;
    DaiLike     public immutable dai;
    address     public immutable escrow;

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

    modifier auth {
        require(wards[msg.sender] == 1, "DomainHost/not-authorized");
        _;
    }

    constructor(bytes32 _ilk, address _daiJoin, address _escrow) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);
        
        ilk = _ilk;
        daiJoin = DaiJoinLike(_daiJoin);
        vat = daiJoin.vat();
        dai = daiJoin.dai();
        escrow = _escrow;
        
        vat.hope(address(daiJoin));
        dai.approve(address(daiJoin), type(uint256).max);

        live = 1;
    }

    // --- Math ---
    function _int256(uint256 x) internal pure returns (int256 y) {
        require((y = int256(x)) >= 0);
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

    /// @notice Set the global debt ceiling for the remote domain
    /// @dev Please note that pre-mint DAI cannot be removed from the remote domain
    /// until the remote domain signals that it is safe to do so
    /// @param wad The new debt ceiling [WAD]
    function lift(uint256 wad) external auth {
        require(vat.live() == 1, "DomainHost/vat-not-live");
        
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
    /// @dev    Should only be triggered by remote domain when it is safe to do so.
    function release(uint256 wad) external auth {
        // Amounts are locked in during global shutdown
        require(vat.live() == 1, "DomainHost/vat-not-live");
        
        int256 amt = -_int256(wad);

        require(dai.transferFrom(escrow, address(this), wad), "DomainHost/transfer-failed");
        daiJoin.join(address(this), wad);
        vat.frob(ilk, address(this), address(this), address(this), amt, amt);
        vat.slip(ilk, address(this), amt);

        grain -= wad;

        emit Release(wad);
    }

    /// @notice Merge DAI into surplus
    /// @dev Should only be triggered by remote domain
    function surplus(uint256 wad) external auth {
        dai.transferFrom(address(escrow), address(this), wad);
        daiJoin.join(address(vow), wad);

        emit Surplus(wad);
    }

    /// @notice Cover the remote domain's deficit by pulling debt from the surplus buffer
    /// @dev Should only be triggered by remote domain
    function deficit(uint256 wad) external auth {
        // Amounts are locked in during global shutdown
        require(vat.live() == 1, "DomainHost/vat-not-live");
        
        vat.suck(vow, address(this), wad * RAY);
        daiJoin.exit(address(escrow), wad);
        
        // Send ERC20 DAI to the remote DomainGuest
        _rectify(wad);

        emit Deficit(wad);
    }

    /// @notice Initiate shutdown for this domain
    /// @dev This will trigger the end module on the remote domain
    function cage() external {
        require(vat.live() == 0, "DomainHost/vat-live");
        require(live == 1, "DomainHost/not-live");

        live = 0;

        _cage();

        emit Cage();
    }

    /// @notice Set this domain's cure value
    /// @dev Should only be triggered by remote domain
    function tell(uint256 value) external auth {
        require(!cureReported, "DomainHost/cure-reported");

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
        require(wad <= 2 ** 255, "DomainHost/overflow");
        vat.slip(ilk, msg.sender, -int256(wad));
        
        _mintClaim(usr, wad);

        emit Exit(usr, wad, wad);
    }

    // Bridge-specific functions
    function _lift(uint256 line, uint256 minted) internal virtual;
    function _rectify(uint256 wad) internal virtual;
    function _cage() internal virtual;
    function _mintClaim(address usr, uint256 claim) internal virtual;

}
