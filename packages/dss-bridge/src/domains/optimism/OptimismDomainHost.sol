// SPDX-License-Identifier: AGPL-3.0-or-later

/// OptimismDomainHost.sol -- DomainHost for Optimism

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

interface L1MessengerLike {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}

contract OptimismDomainHost is DomainHost {

    // --- Data ---
    L1MessengerLike public immutable l1messenger;
    address public immutable guest;

    uint32 public glLift;
    uint32 public glRectify;
    uint32 public glCage;
    uint32 public glExit;
    uint32 public glDeposit;
    uint32 public glInitializeRegisterMint;
    uint32 public glInitializeSettle;

    // --- Events ---
    event File(bytes32 indexed what, uint32 data);

    constructor(
        bytes32 _ilk,
        address _daiJoin,
        address _escrow,
        address _router,
        address _l1messenger,
        address _guest
    ) DomainHost(_ilk, _daiJoin, _escrow, _router) {
        l1messenger = L1MessengerLike(_l1messenger);
        guest = _guest;
    }

    function file(bytes32 what, uint32 data) external auth {
        if (what == "glLift") glLift = data;
        else if (what == "glRectify") glRectify = data;
        else if (what == "glCage") glCage = data;
        else if (what == "glExit") glExit = data;
        else if (what == "glDeposit") glDeposit = data;
        else if (what == "glInitializeRegisterMint") glInitializeRegisterMint = data;
        else if (what == "glInitializeSettle") glInitializeSettle = data;
        else revert("OptimismDomainHost/file-unrecognized-param");
        emit File(what, data);
    }

    function _isGuest(address usr) internal override view returns (bool) {
        return usr == address(l1messenger) && l1messenger.xDomainMessageSender() == guest;
    }

    function lift(uint256 wad) external {
        l1messenger.sendMessage(
            guest,
            _lift(wad),
            glLift
        );
    }
    function lift(uint256 wad, uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _lift(wad),
            gasLimit
        );
    }

    function rectify() external {
        l1messenger.sendMessage(
            guest,
            _rectify(),
            glRectify
        );
    }
    function rectify(uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _rectify(),
            gasLimit
        );
    }

    function cage() external {
        l1messenger.sendMessage(
            guest,
            _cage(),
            glCage
        );
    }
    function cage(uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _cage(),
            gasLimit
        );
    }

    function exit(address usr, uint256 wad) external {
        l1messenger.sendMessage(
            guest,
            _exit(usr, wad),
            glExit
        );
    }
    function exit(address usr, uint256 wad, uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _exit(usr, wad),
            gasLimit
        );
    }

    function deposit(address to, uint256 amount) external {
        l1messenger.sendMessage(
            guest,
            _deposit(to, amount),
            glDeposit
        );
    }
    function deposit(address to, uint256 amount, uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _deposit(to, amount),
            gasLimit
        );
    }

    function initializeRegisterMint(TeleportGUID calldata teleport) external {
        l1messenger.sendMessage(
            guest,
            _initializeRegisterMint(teleport),
            glInitializeRegisterMint
        );
    }
    function initializeRegisterMint(TeleportGUID calldata teleport, uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _initializeRegisterMint(teleport),
            gasLimit
        );
    }

    function initializeSettle(uint256 index) external {
        l1messenger.sendMessage(
            guest,
            _initializeSettle(index),
            glInitializeSettle
        );
    }
    function initializeSettle(uint256 index, uint32 gasLimit) external {
        l1messenger.sendMessage(
            guest,
            _initializeSettle(index),
            gasLimit
        );
    }

}
