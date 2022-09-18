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

import "@matterlabs/zksync-contracts/l1/contracts/zksync/interfaces/IMailbox.sol";

interface IL1Bridge {
  function deposit(
    address _l2Receiver,
    address _l1Token,
    uint256 _amount
  ) external payable returns (bytes32 txHash);

  function claimFailedDeposit(
    address _depositSender,
    address _l1Token,
    bytes32 _l2TxHash,
    uint256 _l2BlockNumber,
    uint256 _l2MessageIndex,
    bytes32[] calldata _merkleProof
  ) external;

  function finalizeWithdrawal(
    uint256 _l2BlockNumber,
    uint256 _l2MessageIndex,
    bytes calldata _message,
    bytes32[] calldata _merkleProof
  ) external;

  function l2TokenAddress(address _l1Token) external view returns (address);
}

interface TokenLike {
  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  ) external returns (bool success);
}

interface L2DAITokenBridgeLike {
  function finalizeDeposit(
    address _from,
    address _to,
    address _l1Token,
    uint256 _amount,
    bytes calldata _data
  ) external;
}

interface IMailboxLike {
  function proveL2LogInclusion(
    uint256 _blockNumber,
    uint256 _index,
    L2Log memory _log,
    bytes32[] calldata _proof
  ) external view returns (bool);

  function proveL2MessageInclusion(
    uint256 _blockNumber,
    uint256 _index,
    L2Message calldata _message,
    bytes32[] calldata _proof
  ) external view returns (bool);

  function requestL2Transaction(
    address _contractAddressL2,
    uint256 _l2Value,
    bytes calldata _calldata,
    uint256 _ergsLimit,
    bytes[] calldata _factoryDeps
  ) external payable returns (bytes32 txHash);
}

enum QueueType {
  Deque,
  HeapBuffer,
  Heap
}

//struct L2Log {
//  address sender;
//  bytes32 key;
//  bytes32 value;
//}

//struct L2Message {
//  address sender;
//  bytes data;
//}

uint160 constant SYSTEM_CONTRACTS_OFFSET = 0x8000; // 2^15
address constant BOOTLOADER_ADDRESS = address(SYSTEM_CONTRACTS_OFFSET + 0x01);

// Managed locked funds in L1Escrow and send / receive messages to L2DAITokenBridge counterpart
// Note: when bridge is closed it will still process in progress messages

contract L1DAITokenBridge is IL1Bridge {
  // TODO: evaluate constant
  uint256 constant DEPOSIT_ERGS_LIMIT = 2097152;

  // TODO: evaluate constant
  uint256 constant DEPLOY_L2_BRIDGE_COUNTERPART_ERGS_LIMIT = 2097152;
  mapping(uint256 => mapping(uint256 => bool)) isWithdrawalProcessed;
  mapping(address => mapping(bytes32 => uint256)) depositAmount; //TODO: do we need that ?

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
  IMailboxLike public immutable zkSyncMailbox;
  uint256 public isOpen = 1;

  event Closed();

  constructor(
    address _l1Token,
    address _l2DAITokenBridge,
    address _l2Token,
    address _escrow,
    IMailboxLike _mailbox
  ) {
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l1Token = _l1Token;
    l2DAITokenBridge = _l2DAITokenBridge;
    l2Token = _l2Token;
    escrow = _escrow;
    zkSyncMailbox = _mailbox;
  }

  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  //TODO: Check if reentrancy guard is needed for all these methods
  function deposit(
    address _l2Receiver,
    address _l1Token,
    uint256 _amount
  ) external payable returns (bytes32 txHash) {
    require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");
    require(isOpen == 1, "L1DAITokenBridge/closed");
    require(_amount > 0, "1T");
    // empty deposit amount  TODO: do we need that check ?

    TokenLike(l1Token).transferFrom(msg.sender, escrow, _amount);
    //bytes memory emptyBytes = "";
    bytes memory l2TxCalldata = abi.encodeWithSelector(
      L2DAITokenBridgeLike.finalizeDeposit.selector,
      msg.sender,
      _l2Receiver,
      _l1Token,
      _amount,
      "" // TODO: Do we pass empty bytes here ?
    );

    txHash = zkSyncMailbox.requestL2Transaction{value: msg.value}(
      l2DAITokenBridge,
      0, // l2Value is always 0
      l2TxCalldata,
      DEPOSIT_ERGS_LIMIT,
      new bytes[](0)
    );

    depositAmount[msg.sender][txHash] = _amount; // TODO: do we need that ?
  }

  function claimFailedDeposit(
    address _depositSender,
    address _l1Token,
    bytes32 _l2TxHash,
    uint256 _l2BlockNumber,
    uint256 _l2MessageIndex,
    bytes32[] calldata _merkleProof
  ) external {
    require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");

    L2Log memory l2Log = L2Log({sender: BOOTLOADER_ADDRESS, key: _l2TxHash, value: bytes32(0)});
    bool success = zkSyncMailbox.proveL2LogInclusion(
      _l2BlockNumber,
      _l2MessageIndex,
      l2Log,
      _merkleProof
    );
    require(success, "Wrong proof");

    uint256 amount = depositAmount[_depositSender][_l2TxHash];
    require(amount > 0, "Claiming non-deposited DAI");

    depositAmount[_depositSender][_l2TxHash] = 0;
    TokenLike(l1Token).transferFrom(escrow, _depositSender, amount);
  }

  // To withdraw, merkleproof must be presented by the user. This might be split
  // into two separate contracts - WithdrawRelayer and the Bridge

  function finalizeWithdrawal(
    uint256 _l2BlockNumber,
    uint256 _l2MessageIndex,
    bytes calldata _message,
    bytes32[] calldata _merkleProof
  ) external {
    require(
      !isWithdrawalProcessed[_l2BlockNumber][_l2MessageIndex],
      "Withdrawal already processed"
    );
    L2Message memory l2ToL1Message = L2Message({sender: l2DAITokenBridge, data: _message});

    (address l1Receiver, uint256 amount) = _parseL2WithdrawalMessage(l2ToL1Message.data);
    bool success = zkSyncMailbox.proveL2MessageInclusion(
      _l2BlockNumber,
      _l2MessageIndex,
      l2ToL1Message,
      _merkleProof
    );
    require(success, "nq");

    isWithdrawalProcessed[_l2BlockNumber][_l2MessageIndex] = true;

    TokenLike(l1Token).transferFrom(escrow, l1Receiver, amount);
  }

  function readUint32(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (uint32 result, uint256 offset)
  {
    assembly {
      offset := add(_start, 4)
      result := mload(add(_bytes, offset))
    }
  }

  function readUint256(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (uint256 result, uint256 offset)
  {
    assembly {
      offset := add(_start, 32)
      result := mload(add(_bytes, offset))
    }
  }

  function readAddress(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (address result, uint256 offset)
  {
    assembly {
      offset := add(_start, 20)
      result := mload(add(_bytes, offset))
    }
  }

  function _parseL2WithdrawalMessage(bytes memory _l2ToL1message)
    internal
    pure
    returns (address l1Receiver, uint256 amount)
  {
    // Check that message length is correct.
    // It should be equal to the length of the function signature + address  + uint256 = 4 + 20 + + 32 = 56 (bytes).
    require(_l2ToL1message.length == 56, "kk");

    (uint32 functionSignature, uint256 offset) = readUint32(_l2ToL1message, 0);
    require(bytes4(functionSignature) == this.finalizeWithdrawal.selector, "nt");

    (l1Receiver, offset) = readAddress(_l2ToL1message, offset);
    (amount, offset) = readUint256(_l2ToL1message, offset);
  }

  function l2TokenAddress(address _l1Token) public view returns (address) {
    require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");

    return l2Token;
  }
}
