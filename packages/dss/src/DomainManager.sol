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
    function debt() external view returns (uint256);
    function Line() external view returns (uint256);
    function file(bytes32 what, uint256 data) external;
}

interface GovernanceRelayLike {
    function invoke(address target, bytes calldata targetData) external;
}

interface DomainJoinLike {
    function release(uint256 burned) external;
}

/// @title Keeps track of local slave-instance dss values and relays messages to DomainJoin
contract DomainManager {
    // --- Data ---
    mapping (address => uint256) public wards;

    VatLike             public vat;
    GovernanceRelayLike public bridge;  // The local governance bridge for this domain
    address             public join;    // The remote DomainJoin
    uint256             public grain;   // Keep track of the pre-minted DAI in the remote escrow

    uint256 constant RAY = 10 ** 27;

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, address data);

    modifier auth {
        require(wards[msg.sender] == 1, "DomainManager/not-authorized");
        _;
    }

    constructor() {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);
    }

    // --- Math ---
    function _min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x <= y ? x : y;
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
        if (what == "vat") vat = VatLike(data);
        else if (what == "bridge") bridge = GovernanceRelayLike(data);
        else if (what == "join") join = data;
        else revert("DomainManager/file-unrecognized-param");
        emit File(what, data);
    }

    /// @notice Set the global debt ceiling for the local dss
    /// @dev Should only be triggered from the DomainJoin
    function lift(uint256 line, uint256 minted) external auth {
        vat.file("Line", line);
        grain += minted;
    }

    /// @notice Will release remote DAI from the escrow when it is safe to do so.
    /// @dev Should be run by keeper on a regular schedule
    function release() external {
        uint256 limit = _min(vat.Line() / RAY, _divup(vat.debt(), RAY));
        require(grain > limit, "DomainManager/no-extra-to-release");
        uint256 burned = grain - limit;
        grain = limit;

        // TODO - deal with different gas designs
        bridge.invoke(join, abi.encodeWithSelector(
            DomainJoinLike.release.selector,
            burned
        ));
    }
}
