// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
// @unsupported: ovm
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

import "@matterlabs/zksync-contracts/l1/contracts/zksync/interfaces/IZkSync.sol";
import "@matterlabs/zksync-contracts/l1/contracts/zksync/Operations.sol";

interface TokenLike {
  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  ) external returns (bool success);
}

interface L2DAITokenBridgeLike {
  function finalizeDeposit(
    address _l1Token,
    address _l2Token,
    address _from,
    address _to,
    uint256 _amount,
    bytes calldata _data
  ) external;
}

// Managed locked funds in L1Escrow and send / receive messages to L2DAITokenBridge counterpart
// Note: when bridge is closed it will still process in progress messages

contract L1DAITokenBridge {
  mapping(uint32 => mapping(uint256 => bool)) isWithdrawalProcessed;

  event ERC20DepositInitiated(
    address indexed _l1Token,
    address indexed _l2Token,
    address indexed _from,
    address _to,
    uint256 _amount,
    bytes _data
  );

  event WithdrawalFinalized(address indexed _recipient, uint256 _amount);

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
    require(wards[msg.sender] == 1, "L1DAITokenBridge/not-authorized");
    _;
  }

  event Rely(address indexed usr);
  event Deny(address indexed usr);

  address public immutable l1Token;
  address public immutable l2DAITokenBridge;
  address public immutable l2Token;
  address public immutable escrow;
  address public immutable zkSyncAddress;
  uint256 public isOpen = 1;

  event Closed();

  constructor(
    address _l1Token,
    address _l2DAITokenBridge,
    address _l2Token,
    address _escrow,
    address _zkSyncAddress
  ) {
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l1Token = _l1Token;
    l2DAITokenBridge = _l2DAITokenBridge;
    l2Token = _l2Token;
    escrow = _escrow;
    zkSyncAddress = _zkSyncAddress;
  }

  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  function depositERC20(
    address _l1Token,
    address _l2Token,
    uint256 _amount,
    uint32 _l2Gas,
    bytes calldata _data
  ) external payable {
    require(_l1Token == l1Token && _l2Token == l2Token, "L1DAITokenBridge/token-not-dai");

    _initiateERC20Deposit(msg.sender, msg.sender, _amount, _l2Gas, _data);
  }

  function depositERC20To(
    address _l1Token,
    address _l2Token,
    address _to,
    uint256 _amount,
    uint32 _l2Gas,
    bytes calldata _data
  ) external payable {
    require(_l1Token == l1Token && _l2Token == l2Token, "L1DAITokenBridge/token-not-dai");

    _initiateERC20Deposit(msg.sender, _to, _amount, _l2Gas, _data);
  }

  function _initiateERC20Deposit(
    address _from,
    address _to,
    uint256 _amount,
    uint64 ergsLimit,
    bytes calldata _data
  ) internal {
    // do not allow initiating new xchain messages if bridge is closed
    require(isOpen == 1, "L1DAITokenBridge/closed");

    TokenLike(l1Token).transferFrom(_from, escrow, _amount);

    bytes memory message = abi.encodeWithSelector(
      L2DAITokenBridgeLike.finalizeDeposit.selector,
      l1Token,
      l2Token,
      _from,
      _to,
      _amount,
      _data
    );

    _callZkSync(l2DAITokenBridge, message, ergsLimit);

    emit ERC20DepositInitiated(l1Token, l2Token, _from, _to, _amount, _data);
  }

  function _callZkSync(
    address contractAddr,
    bytes memory data,
    uint256 ergsLimit
  ) internal {
    IZkSync zksync = IZkSync(zkSyncAddress);
    zksync.requestL2Transaction{value: msg.value}(
      contractAddr,
      data,
      ergsLimit,
      new bytes[](0),
      QueueType.Deque
    );
  }

  // To withdraw, merkleproof must be presented by the user. This might be split
  // into two separate contracts - WithdrawRelayer and the Bridge

  function withdraw(
    uint32 _l2BlockNumber,
    uint256 _index,
    bytes calldata _message,
    bytes32[] calldata _proof,
    address l2Sender
  ) external {
    require(!isWithdrawalProcessed[_l2BlockNumber][_index]);

    IZkSync zksync = IZkSync(zkSyncAddress);
    L2Message memory message = L2Message({sender: l2Sender, data: _message});

    bool success = zksync.proveL2MessageInclusion(_l2BlockNumber, _index, message, _proof);
    require(success, "Failed to prove message inclusion");

    (address l1Recipient, uint256 amount) = abi.decode(_message, (address, uint256));

    // process message
    TokenLike(l1Token).transferFrom(escrow, l1Recipient, amount);

    isWithdrawalProcessed[_l2BlockNumber][_index] = true;

    emit WithdrawalFinalized(l1Recipient, amount);
  }
}
