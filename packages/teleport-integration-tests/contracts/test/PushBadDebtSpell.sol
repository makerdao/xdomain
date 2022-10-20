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
    function settle(bytes32 sourceDomain, uint256 batchedDaiToFlush) external;
}

interface VatLike {
    function can(address bit, address usr) external view returns (uint256);

    function hope(address usr) external;

    function suck(
        address u,
        address v,
        uint256 rad
    ) external;
}

interface DaiJoinLike {
    function exit(address usr, uint256 wad) external;
}

contract PushBadDebtSpell {
    uint256 public constant RAY = 10**27;

    TeleportJoinLike public immutable teleportJoin;
    VatLike public immutable vat;
    DaiJoinLike public immutable daiJoin;
    address public immutable vow;
    bytes32 public immutable sourceDomain;
    uint256 public immutable badDebt;

    constructor(
        TeleportJoinLike _teleportJoin,
        VatLike _vat,
        DaiJoinLike _daiJoin,
        address _vow,
        bytes32 _sourceDomain,
        uint256 _badDebt
    ) {
        teleportJoin = _teleportJoin;
        vat = _vat;
        daiJoin = _daiJoin;
        vow = _vow;
        sourceDomain = _sourceDomain;
        badDebt = _badDebt;
    }

    function execute() external {
        if (vat.can(address(this), address(daiJoin)) == 0) {
            vat.hope(address(daiJoin));
        }

        vat.suck(vow, address(this), badDebt * RAY);
        daiJoin.exit(address(teleportJoin), badDebt);
        teleportJoin.settle(sourceDomain, badDebt);
    }
}
