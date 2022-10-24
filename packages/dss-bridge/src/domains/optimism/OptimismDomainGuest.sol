// SPDX-License-Identifier: AGPL-3.0-or-later

/// OptimismDomainGuest.sol -- DomainGuest for Optimism

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

import {DomainGuest,TeleportGUID} from "../../DomainGuest.sol";

interface L2MessengerLike {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}

contract OptimismDomainGuest is DomainGuest {

    // --- Data ---
    L2MessengerLike public immutable l2messenger;
    address public immutable host;

    uint32 public glRelease;
    uint32 public glPush;
    uint32 public glTell;
    uint32 public glWithdraw;
    uint32 public glFlush;
    uint32 public glInitializeRegisterMint;
    uint32 public glInitializeSettle;

    // --- Events ---
    event FileGL(bytes32 indexed what, uint32 data);

    constructor(
        bytes32 _domain,
        address _daiJoin,
        address _claimToken,
        address _router,
        address _l2messenger,
        address _host
    ) DomainGuest(_domain, _daiJoin, _claimToken, _router) {
        l2messenger = L2MessengerLike(_l2messenger);
        host = _host;
    }

    function filegl(bytes32 what, uint32 data) external auth {
        if (what == "glRelease") glRelease = data;
        else if (what == "glPush") glPush = data;
        else if (what == "glTell") glTell = data;
        else if (what == "glWithdraw") glWithdraw = data;
        else if (what == "glFlush") glFlush = data;
        else if (what == "glInitializeRegisterMint") glInitializeRegisterMint = data;
        else if (what == "glInitializeSettle") glInitializeSettle = data;
        else revert("OptimismDomainGuest/file-unrecognized-param");
        emit FileGL(what, data);
    }

    function _isHost(address usr) internal override view returns (bool) {
        return usr == address(l2messenger) && l2messenger.xDomainMessageSender() == host;
    }

    function release() external {
        l2messenger.sendMessage(
            host,
            _release(),
            glRelease
        );
    }
    function release(uint32 gasLimit) external {
        l2messenger.sendMessage(
            host,
            _release(),
            gasLimit
        );
    }

    function push() external {
        l2messenger.sendMessage(
            host,
            _push(),
            glPush
        );
    }
    function push(uint32 gasLimit) external {
        l2messenger.sendMessage(
            host,
            _push(),
            gasLimit
        );
    }

    function tell() external {
        l2messenger.sendMessage(
            host,
            _tell(),
            glTell
        );
    }
    function tell(uint32 gasLimit) external {
        l2messenger.sendMessage(
            host,
            _tell(),
            gasLimit
        );
    }

    function withdraw(address to, uint256 amount) external {
        l2messenger.sendMessage(
            host,
            _withdraw(to, amount),
            glWithdraw
        );
    }
    function withdraw(address to, uint256 amount, uint32 gasLimit) external {
        l2messenger.sendMessage(
            host,
            _withdraw(to, amount),
            gasLimit
        );
    }

    function initializeRegisterMint(TeleportGUID calldata teleport) external {
        l2messenger.sendMessage(
            host,
            _initializeRegisterMint(teleport),
            glInitializeRegisterMint
        );
    }
    function initializeRegisterMint(TeleportGUID calldata teleport, uint32 gasLimit) external {
        l2messenger.sendMessage(
            host,
            _initializeRegisterMint(teleport),
            gasLimit
        );
    }

    function initializeSettle(uint256 index) external {
        l2messenger.sendMessage(
            host,
            _initializeSettle(index),
            glInitializeSettle
        );
    }
    function initializeSettle(uint256 index, uint32 gasLimit) external {
        l2messenger.sendMessage(
            host,
            _initializeSettle(index),
            gasLimit
        );
    }

}
