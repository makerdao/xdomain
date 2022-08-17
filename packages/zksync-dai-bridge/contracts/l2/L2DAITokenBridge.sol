// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
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

pragma solidity ^0.8.15;

import "../../node_modules/@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

interface Mintable {
  function mint(address usr, uint256 wad) external;

  function burn(address usr, uint256 wad) external;
}

// Mint tokens on L2 after locking funds on L1.
// Burn tokens on L1 and send a message to unlock tokens on L1 to L1 counterpart
// Note: when bridge is closed it will still process in progress messages

contract L2DAITokenBridge {
  event WithdrawalInitiated(
    address indexed _l1Token,
    address indexed _l2Token,
    address indexed _from,
    address _to,
    uint256 _amount,
    bytes _data
  );

  event DepositFinalized(
    address indexed _l1Token,
    address indexed _l2Token,
    address indexed _from,
    address _to,
    uint256 _amount,
    bytes _data
  );

  // --- Auth ---
  mapping(address => uint256) public wards;

  function rely(address usr) external auth {
    wards[usr] = 1;
    emit Rely(usr);
  }

  function deny(address usr) external auth {
    wards[usr] = 0;
    emit Deny(usr);
  }

  modifier auth() {
    require(wards[msg.sender] == 1, "L2DAITokenBridge/not-authorized");
    _;
  }

  event Rely(address indexed usr);
  event Deny(address indexed usr);

  address public immutable l1Token;
  address public immutable l2Token;
  address public immutable l1DAITokenBridge;
  uint256 public isOpen = 1;

  event Closed();

  constructor(
    address _l2Token,
    address _l1Token,
    address _l1DAITokenBridge
  ) {
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l2Token = _l2Token;
    l1Token = _l1Token;
    l1DAITokenBridge = _l1DAITokenBridge;
  }

  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  function withdrawTo(
    address _l2Token,
    address _to,
    uint256 _amount,
    bytes calldata _data
  ) external {
    require(_l2Token == l2Token, "L2DAITokenBridge/token-not-dai");

    _initiateWithdrawal(msg.sender, _to, _amount, _data);
  }

  // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2 usage.
  function _initiateWithdrawal(
    address _from,
    address _to,
    uint256 _amount,
    bytes calldata _data
  ) internal {
    // do not allow initiaitng new xchain messages if bridge is closed
    require(isOpen == 1, "L2DAITokenBridge/closed");

    Mintable(l2Token).burn(msg.sender, _amount);

    bytes memory message = abi.encode(l1Token, l2Token, _from, _to, _amount, _data);

    L1_MESSENGER_CONTRACT.sendToL1(message);

    emit WithdrawalInitiated(l1Token, l2Token, msg.sender, _to, _amount, _data);
  }

  // When a deposit is finalized, we credit the account on L2 with the same amount of tokens.
  // TODO: need to check who can call this

  function finalizeDeposit(
    address _l1Token,
    address _l2Token,
    address _from,
    address _to,
    uint256 _amount,
    bytes calldata _data
  ) external {
    require(_l1Token == l1Token && _l2Token == l2Token, "L2DAITokenBridge/token-not-dai");

    Mintable(l2Token).mint(_to, _amount);

    emit DepositFinalized(_l1Token, _l2Token, _from, _to, _amount, _data);
  }
}
