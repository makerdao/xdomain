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
import {DomainHost} from "../../DomainHost.sol";

interface L2MessengerLike {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}

contract OptimismDomainGuest is DomainGuest {

    L2MessengerLike public immutable l2messenger;
    address public immutable host;

    // TODO make these fileable
    uint32 public glRelease;
    uint32 public glSurplus;
    uint32 public glDeficit;
    uint32 public glTell;
    uint32 public glInitiateTeleport;
    uint32 public glFlush;
    uint32 public glWithdraw;

    constructor(
        bytes32 _domain,
        address _daiJoin,
        address _claimToken,
        address _l2messenger,
        address _host
    ) DomainGuest(_domain, _daiJoin, _claimToken) {
        l2messenger = L2MessengerLike(_l2messenger);
        host = _host;
    }

    function _isHost(address usr) internal override view returns (bool) {
        return usr == address(l2messenger) && l2messenger.xDomainMessageSender() == host;
    }
    function _release(uint256 burned) internal override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.release.selector, burned),
            glRelease
        );
    }
    function _surplus(uint256 wad) internal virtual override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.surplus.selector, wad),
            glSurplus
        );
    }
    function _deficit(uint256 wad) internal virtual override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.deficit.selector, wad),
            glDeficit
        );
    }
    function _tell(uint256 value) internal virtual override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.tell.selector, value),
            glTell
        );
    }
    function _initiateTeleport(TeleportGUID memory teleport) internal virtual override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.teleportSlowPath.selector, teleport),
            glInitiateTeleport
        );
    }
    function _flush(bytes32 targetDomain, uint256 daiToFlush) internal virtual override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.flush.selector, targetDomain, daiToFlush),
            glFlush
        );
    }
    function _withdraw(address to, uint256 amount) internal virtual override {
        l2messenger.sendMessage(
            host,
            abi.encodeWithSelector(DomainHost.withdraw.selector, to, amount),
            glWithdraw
        );
    }

}
