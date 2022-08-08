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

pragma solidity 0.8.14;

interface VatLike {
  function rely(address usr) external;

  function init(bytes32 ilk) external;

  function file(
    bytes32 ilk,
    bytes32 what,
    uint256 data
  ) external;
}

interface TeleportJoinLike {
  function file(bytes32 what, address val) external;

  function ilk() external returns (bytes32);
}

interface OracleAuthLike {
  function file(bytes32 what, uint256 data) external;

  function addSigners(address[] calldata signers_) external;
}

interface RouterLike {
  function file(
    bytes32 what,
    bytes32 domain,
    address data
  ) external;
}

contract L1ConfigureTeleportSpell {
  uint256 public constant RAY = 10**27;

  bytes32 public immutable masterDomain;

  TeleportJoinLike public immutable teleportJoin;
  address public immutable vow;

  VatLike public immutable vat;
  uint256 public immutable line;

  RouterLike public immutable router;

  OracleAuthLike public immutable oracleAuth;
  address public immutable oracle1;
  address public immutable oracle2;
  address public immutable oracle3;

  constructor(
    bytes32 _masterDomain,
    TeleportJoinLike _teleportJoin,
    address _vow,
    VatLike _vat,
    uint256 _line,
    RouterLike _router,
    OracleAuthLike _oracleAuth,
    address _oracle1,
    address _oracle2,
    address _oracle3
  ) {
    masterDomain = _masterDomain;
    teleportJoin = _teleportJoin;
    vow = _vow;
    vat = _vat;
    line = _line;
    router = _router;
    oracleAuth = _oracleAuth;
    oracle1 = _oracle1;
    oracle2 = _oracle2;
    oracle3 = _oracle3;
  }

  function execute() external {
    teleportJoin.file(bytes32("vow"), vow);
    router.file(bytes32("gateway"), masterDomain, address(teleportJoin));

    vat.rely(address(teleportJoin));
    bytes32 ilk = teleportJoin.ilk();
    vat.init(ilk);
    vat.file(ilk, bytes32("spot"), RAY);
    vat.file(ilk, bytes32("line"), line);

    oracleAuth.file(bytes32("threshold"), 3);
    address[] memory transactionArray = new address[](3);
    transactionArray[0] = oracle1;
    transactionArray[1] = oracle2;
    transactionArray[2] = oracle3;
    oracleAuth.addSigners(transactionArray);
  }
}
