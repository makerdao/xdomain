// SPDX-License-Identifier: AGPL-3.0-or-later

/// ArbitrumDomainHost.sol -- DomainHost for Arbitrum

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

import {DomainHost,TeleportGUID} from "../../DomainHost.sol";

interface InboxLike {
    function createRetryableTicket(
        address destAddr,
        uint256 arbTxCallValue,
        uint256 maxSubmissionCost,
        address submissionRefundAddress,
        address valueRefundAddress,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) external payable returns (uint256);
    function bridge() external view returns (address);
}

interface BridgeLike {
    function activeOutbox() external view returns (address);
}

interface OutboxLike {
    function l2ToL1Sender() external view returns (address);
}

contract ArbitrumDomainHost is DomainHost {

    // --- Data ---
    InboxLike public immutable inbox;
    address public immutable guest;

    uint256 public glLift;
    uint256 public glRectify;
    uint256 public glCage;
    uint256 public glExit;
    uint256 public glDeposit;
    uint256 public glInitializeRegisterMint;
    uint256 public glInitializeSettle;

    // --- Events ---
    event File(bytes32 indexed what, uint256 data);

    constructor(
        bytes32 _ilk,
        address _daiJoin,
        address _escrow,
        address _router,
        address _inbox,
        address _guest
    ) DomainHost(_ilk, _daiJoin, _escrow, _router) {
        inbox = InboxLike(_inbox);
        guest = _guest;
    }

    function file(bytes32 what, uint256 data) external auth {
        if (what == "glLift") glLift = data;
        else if (what == "glRectify") glRectify = data;
        else if (what == "glCage") glCage = data;
        else if (what == "glExit") glExit = data;
        else if (what == "glDeposit") glDeposit = data;
        else if (what == "glInitializeRegisterMint") glInitializeRegisterMint = data;
        else if (what == "glInitializeSettle") glInitializeSettle = data;
        else revert("ArbitrumDomainHost/file-unrecognized-param");
        emit File(what, data);
    }

    function _isGuest(address usr) internal override view returns (bool) {
        address bridge = inbox.bridge();
        return usr == bridge && guest == OutboxLike(BridgeLike(bridge).activeOutbox()).l2ToL1Sender();
    }

    function lift(
        uint256 wad,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _lift(wad)
        );
    }
    function lift(
        uint256 wad,
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        lift(
            wad,
            maxSubmissionCost,
            glLift,
            gasPriceBid
        );
    }

    function rectify(
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _rectify()
        );
    }
    function rectify(
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        rectify(
            maxSubmissionCost,
            glLift,
            gasPriceBid
        );
    }

    function cage(
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _cage()
        );
    }
    function cage(
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        cage(
            maxSubmissionCost,
            glCage,
            gasPriceBid
        );
    }

    function exit(
        address usr,
        uint256 wad,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _exit(usr, wad)
        );
    }
    function exit(
        address usr,
        uint256 wad,
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        exit(
            usr,
            wad,
            maxSubmissionCost,
            glExit,
            gasPriceBid
        );
    }

    function deposit(
        address to,
        uint256 amount,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _deposit(to, amount)
        );
    }
    function deposit(
        address to,
        uint256 amount,
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        deposit(
            to,
            amount,
            maxSubmissionCost,
            glDeposit,
            gasPriceBid
        );
    }

    function initializeRegisterMint(
        TeleportGUID calldata teleport,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _initializeRegisterMint(teleport)
        );
    }
    function initializeRegisterMint(
        TeleportGUID calldata teleport,
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        initializeRegisterMint(
            teleport,
            maxSubmissionCost,
            glInitializeRegisterMint,
            gasPriceBid
        );
    }

    function initializeSettle(
        uint256 index,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable {
        inbox.createRetryableTicket{value: msg.value}(
            guest,
            0, // we always assume that l2CallValue = 0
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            _initializeSettle(index)
        );
    }
    function initializeSettle(
        uint256 index,
        uint256 maxSubmissionCost,
        uint256 gasPriceBid
    ) external payable {
        initializeSettle(
            index,
            maxSubmissionCost,
            glDeposit,
            gasPriceBid
        );
    }

}
