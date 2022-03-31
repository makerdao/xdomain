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

interface VatLike {
    function slip(bytes32,address,int256) external;
}

// Extend a line of credit to domain

contract DomainJoin {
    // --- Data ---
    mapping (address => uint256) public wards;

    uint256 public live;  // Active Flag

    VatLike public immutable vat;   // CDP Engine
    bytes32 public immutable ilk;   // Collateral Type

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event Cage();
    event Join(address indexed usr, uint256 wad);
    event Exit(address indexed usr, uint256 wad);

    modifier auth {
        require(wards[msg.sender] == 1, "GemJoin/not-authorized");
        _;
    }

    constructor(address vat_, bytes32 ilk_, address gem_) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);
        
        live = 1;
        vat = VatLike(vat_);
        ilk = ilk_;
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

    function cage() external auth {
        live = 0;
        emit Cage();
    }

    // --- User's functions ---
    function join(address usr, uint256 wad) external {
        
    }
}
