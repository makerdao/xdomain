// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
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

pragma solidity ^0.8.15;

// Relay a message from L1 to L2GovernanceRelay

interface L2GovernanceRelayLike {
    function relay(address target, bytes calldata targetData) external;
}

enum QueueType {
    Deque,
    HeapBuffer,
    Heap
}

uint256 constant RELAY_ERGS_LIMIT = 2097152;

interface IMailboxLike {
    function requestL2Transaction(
        address _contractAddressL2,
        uint256 _l2Value,
        bytes calldata _calldata,
        uint256 _ergsLimit,
        bytes[] calldata _factoryDeps
    ) external payable returns (bytes32 txHash);
}

contract L1GovernanceRelay {
    // --- Auth ---
    mapping(address => uint256) public wards;

    function rely(address usr) external auth {
        wards[usr] = 1;
        emit Rely(usr);
    }

    function deny(address usr) external auth {
        wards[usr] = 0;
        emit Deny(usr);
    }

    modifier auth() {
        require(wards[msg.sender] == 1, "L1GovernanceRelay/not-authorized");
        _;
    }

    address public immutable l2GovernanceRelay;
    IMailboxLike public immutable zkSyncMailbox;

    event Rely(address indexed usr);
    event Deny(address indexed usr);

    constructor(address _l2GovernanceRelay, IMailboxLike _mailbox) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);

        l2GovernanceRelay = _l2GovernanceRelay;
        zkSyncMailbox = _mailbox;
    }

    // Forward a call to be repeated on L2
    function relay(address target, bytes calldata targetData)
        external
        payable
        auth
        returns (bytes32 txHash)
    {
        bytes memory l2TxCalldata = abi.encodeWithSelector(
            L2GovernanceRelayLike.relay.selector,
            target,
            targetData
        );

        txHash = zkSyncMailbox.requestL2Transaction{value: msg.value}(
            l2GovernanceRelay,
            0, // l2Value is assumed to always be 0
            l2TxCalldata,
            RELAY_ERGS_LIMIT,
            new bytes[](0) // empty for transactions not deploying contracts
        );
    }
}
