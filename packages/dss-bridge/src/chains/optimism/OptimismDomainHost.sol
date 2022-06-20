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
    uint32 public glMainClaim;
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
    function _lift(uint256 id, uint256 line, uint256 minted) internal override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSignature("lift(uint256,uint256,uint256)", id, line, minted),
            glLift
        );
    }
    function _rectify(uint256 wad) internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSignature("rectify(uint256)", wad),
            glRectify
        );
    }
    function _cage() internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSignature("cage()"),
            glCage
        );
    }
    function _mintClaim(address usr, uint256 claim) internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSignature("mintClaim(address,uint256)", usr, claim),
            glMainClaim
        );
    }
    function _deposit(address to, uint256 amount) internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSignature("deposit(address,uint256)", to, amount),
            glDeposit
        );
    }

}
