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

pragma solidity 0.8.13;

interface WormholeJoinLike {
  function file(
    bytes32 what,
    bytes32 domain,
    address data
  ) external;
}

contract FileJoinFeesSpell {
  WormholeJoinLike public immutable wormholeJoin;
  bytes32 public immutable domain;
  address public immutable fees;

  constructor(
    address _wormholeJoin,
    bytes32 _domain,
    address _fees
  ) {
    wormholeJoin = WormholeJoinLike(_wormholeJoin);
    domain = _domain;
    fees = _fees;
  }

  function execute() external {
    wormholeJoin.file("fees", domain, fees);
  }
}
