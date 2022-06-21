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
    uint32 public glMainClaim;
    uint32 public glDeposit;

    bytes32 constant private MAGIC_MEM_LOC = keccak256("MAGIC MEMORY LOCATION");

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

    // Example of providing custom parameters to the bridge
    function lift(uint256 wad, uint32 gasLimit) external {
        // Stash extra args in a magic memory location
        bytes32 loc = MAGIC_MEM_LOC;
        assembly {
            mstore(loc, gasLimit)
        }

        lift(wad);
    }

    function _isGuest(address usr) internal override view returns (bool) {
        return usr == address(l1messenger) && l1messenger.xDomainMessageSender() == guest;
    }
    function _lift(uint256 id, uint256 line, uint256 minted) internal override {
        // Load extra args or use defaults if not present
        bytes32 loc = MAGIC_MEM_LOC;
        uint32 gasLimit;
        assembly {
            gasLimit := mload(loc)
        }
        if (gasLimit == 0) gasLimit = glLift;

        l1messenger.sendMessage(
            guest,
            abi.encodeWithSelector(DomainGuest.lift.selector, id, line, minted),
            glLift
        );
    }
    function _rectify(uint256 wad) internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSelector(DomainGuest.rectify.selector, wad),
            glRectify
        );
    }
    function _cage() internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSelector(DomainGuest.cage.selector),
            glCage
        );
    }
    function _mintClaim(address usr, uint256 claim) internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSelector(DomainGuest.mintClaim.selector, usr, claim),
            glMainClaim
        );
    }
    function _deposit(address to, uint256 amount) internal virtual override {
        l1messenger.sendMessage(
            guest,
            abi.encodeWithSelector(DomainGuest.deposit.selector, to, amount),
            glDeposit
        );
    }

}
