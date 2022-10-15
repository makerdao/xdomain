// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
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

pragma solidity 0.8.15;

interface TeleportJoinLike {
    function file(
        bytes32 what,
        bytes32 domain,
        uint256 data
    ) external;
}

contract FileJoinLineSpell {
    TeleportJoinLike public immutable teleportJoin;
    bytes32 public immutable domain;
    uint256 public immutable line;

    constructor(
        address _teleportJoin,
        bytes32 _domain,
        uint256 _line
    ) {
        teleportJoin = TeleportJoinLike(_teleportJoin);
        domain = _domain;
        line = _line;
    }

    function execute() external {
        teleportJoin.file("line", domain, line);
    }
}
