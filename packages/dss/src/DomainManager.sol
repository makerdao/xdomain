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
    function hope(address usr) external;
    function file(bytes32 what, uint256 data) external;
}

interface GovernanceRelayLike {
    function invoke(address target, bytes calldata targetData) external;
}

/// @title Keeps track of local slave-instance dss values and relays messages to DomainJoin
contract DomainManager {
    // --- Data ---
    mapping (address => uint256) public wards;

    GovernanceRelayLike public bridge;  // The local governance bridge for this domain

    VatLike public immutable vat;

    uint256 constant RAY = 10 ** 27;

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, address data);

    modifier auth {
        require(wards[msg.sender] == 1, "DomainManager/not-authorized");
        _;
    }

    constructor(address vat_) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);
        
        vat = VatLike(vat_);
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
        if (what == "bridge") bridge = GovernanceRelayLike(data);
        else revert("DomainManager/file-unrecognized-param");
        emit File(what, data);
    }

    /// @notice Set the global debt ceiling for the local dss
    /// @dev Should only be triggered from the DomainJoin
    function lift(uint256 wad) external auth {
        
    }

    /// @notice Will release remote DAI from the escrow when it is safe to do so.
    /// @dev Should be run by keeper on a regular schedule
    function release(uint256 wad) external {
        // TODO calculate difference between debt and debt ceiling and signal to L1
    }
}
