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

import {DomainHost} from "../../DomainHost.sol";
import {DomainGuest} from "../../DomainGuest.sol";

interface L1MessengerLike {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}

contract OptimismDomainHost is DomainHost {

    L1MessengerLike public immutable l1messenger;
    address public immutable guest;

    // TODO make these fileable
    uint32 public glLift;
    uint32 public glRectify;
    uint32 public glCage;
    uint32 public glExit;
    uint32 public glDeposit;

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

}
