// SPDX-License-Identifier: AGPL-3.0-or-later

/// DomainGuest.sol -- xdomain guest dss manager

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
    function hope(address usr) external;
    function debt() external view returns (uint256);
    function Line() external view returns (uint256);
    function file(bytes32 what, uint256 data) external;
    function dai(address usr) external view returns (uint256);
    function sin(address usr) external view returns (uint256);
    function heal(uint256 rad) external;
}

interface TokenLike {
    function balanceOf(address usr) external view returns (uint256);
    function transferFrom(address src, address dst, uint256 wad) external returns (bool);
    function approve(address usr, uint wad) external returns (bool);
    function mint(address to, uint256 value) external;
}

interface DaiJoinLike {
    function vat() external view returns (VatLike);
    function dai() external view returns (TokenLike);
    function join(address usr, uint256 wad) external;
    function exit(address usr, uint256 wad) external;
}

interface EndLike {
    function cage() external;
}

/// @title Keeps track of local guest instance dss values and relays messages to DomainHost
abstract contract DomainGuest {
    
    // --- Data ---
    mapping (address => uint256) public wards;

    VatLike     public immutable vat;
    DaiJoinLike public immutable daiJoin;
    TokenLike   public immutable dai;
    TokenLike   public immutable claimToken;

    EndLike public end;
    uint256 public grain;       // Keep track of the pre-minted DAI in the remote escrow

    uint256 constant RAY = 10 ** 27;

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, address data);
    event Lift(uint256 line, uint256 minted);
    event Release(uint256 burned, uint256 totalDebt);
    event Push(int256 surplus);
    event Rectify(uint256 balance);
    event Cage();
    event Tell(uint256 value);
    event MintClaim(address indexed usr, uint256 claim);

    modifier auth {
        require(wards[msg.sender] == 1, "DomainGuest/not-authorized");
        _;
    }

    constructor(address _daiJoin, address _claimToken) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);

        daiJoin = DaiJoinLike(_daiJoin);
        vat = daiJoin.vat();
        dai = daiJoin.dai();
        claimToken = TokenLike(_claimToken);

        vat.hope(address(daiJoin));
        dai.approve(address(daiJoin), type(uint256).max);
    }

    // --- Math ---
    function _max(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x >= y ? x : y;
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
        if (what == "end") end = EndLike(data);
        else revert("DomainGuest/file-unrecognized-param");
        emit File(what, data);
    }

    /// @notice Set the global debt ceiling for the local dss
    /// @dev Should only be triggered from the DomainHost
    function lift(uint256 line, uint256 minted) external auth {
        vat.file("Line", line);
        grain += minted;

        emit Lift(line, minted);
    }

    /// @notice Will release remote DAI from the escrow when it is safe to do so
    /// @dev    Should be run by keeper on a regular schedule.
    ///         This will also push the vat debt for informational purposes.
    function release() external {
        uint256 totalDebt = vat.debt();
        uint256 limit = _max(vat.Line() / RAY, _divup(totalDebt, RAY));
        uint256 burned;
        if (grain > limit) {
            burned = grain - limit;
            grain = limit;
        }

        _release(burned, totalDebt);

        emit Release(burned, totalDebt);
    }

    /// @notice Push surplus (or deficit) to the host dss
    /// @dev Should be run by keeper on a regular schedule
    function push() external {
        uint256 _dai = vat.dai(address(this));
        uint256 _sin = vat.sin(address(this));
        if (_dai > _sin) {
            // We have a surplus
            if (_sin > 0) vat.heal(_sin);

            uint256 wad = (_dai - _sin) / RAY;    // Leave the dust
            daiJoin.exit(address(this), wad);

            // Send ERC20 DAI to the remote DomainHost
            _surplus(wad);

            require(wad < 2 ** 255, "DomainGuest/overflow");
            emit Push(int256(wad));
        } else if (_dai < _sin) {
            // We have a deficit
            if (_dai > 0) vat.heal(_dai);

            uint256 deficit = _divup(_sin - _dai, RAY);
            _deficit(deficit);   // Round up to overcharge for deficit

            require(deficit < 2 ** 255, "DomainGuest/overflow");
            emit Push(-int256(deficit));
        }
    }

    /// @notice Merge ERC20 DAI into surplus
    function rectify() external {
        uint256 balance = dai.balanceOf(address(this));
        daiJoin.join(address(this), balance);

        emit Rectify(balance);
    }

    /// @notice Trigger the end module
    /// @dev Should only be triggered by remote domain
    function cage() external auth {
        end.cage();

        emit Cage();
    }

    /// @notice Set the cure value for the host
    /// @dev Triggered during shutdown
    function tell(uint256 value) external auth {
        _tell(value);

        emit Tell(value);
    }

    /// @notice Mint a claim token for the given user
    /// @dev    Should only be triggered by remote domain.
    ///         Claim amount is in units of local debt.
    function mintClaim(address usr, uint256 claim) external auth {
        claimToken.mint(usr, claim);

        emit MintClaim(usr, claim);
    }

    // Bridge-specific functions
    function _release(uint256 burned, uint256 totalDebt) internal virtual;
    function _surplus(uint256 wad) internal virtual;
    function _deficit(uint256 wad) internal virtual;
    function _tell(uint256 value) internal virtual;
    
}
