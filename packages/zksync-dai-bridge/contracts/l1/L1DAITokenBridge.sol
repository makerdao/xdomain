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
import "@matterlabs/zksync-contracts/l1/contracts/bridge/interfaces/IL1Bridge.sol";
import "@matterlabs/zksync-contracts/l2/contracts/bridge/interfaces/IL2Bridge.sol";
import "@matterlabs/zksync-contracts/l1/contracts/vendor/AddressAliasHelper.sol";

interface TokenLike {
  function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
}

// Managed locked funds in L1Escrow and send / receive messages to L2DAITokenBridge counterpart
// Note: when bridge is closed it will still process in progress messages

contract L1DAITokenBridge is IL1Bridge {
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

  address constant BOOTLOADER_ADDRESS = 0x0000000000000000000000000000000000008001; // address(SYSTEM_CONTRACTS_OFFSET + 0x01);

  // prettier-ignore
  address public immutable l1Token; // the address of L1 Dai
  address public immutable l2Bridge; // the counterpart bridge contract on L2
  address public immutable l2Token; // the address of L2 Dai
  address public immutable escrow; // contract holding all deposited L1 Dai
  IMailbox public immutable zkSyncMailbox; // zkSync main contract on L1
  uint256 public isOpen = 1; // flag indicating if the bridge is open to deposits

  mapping(uint256 => mapping(uint256 => bool)) public isWithdrawalFinalized; // flag used to mark a pending withdrawal as finalized and prevent it from being double-spent
  mapping(address => mapping(bytes32 => uint256)) public depositAmount; // the amount of Dai deposited for a given depositer and L2 transaction hash (used for deposit cancellation).

  event Rely(address indexed usr);
  event Deny(address indexed usr);
  event File(bytes32 indexed what, uint256 data);
  event Closed();

  constructor(
    address _l1Token,
    address _l2Bridge,
    address _l2Token,
    address _escrow,
    IMailbox _mailbox
  ) {
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l1Token = _l1Token;
    l2Bridge = _l2Bridge;
    l2Token = _l2Token;
    escrow = _escrow;
    zkSyncMailbox = _mailbox;
  }

  /**
   * @notice Returns the L2 Dai token address. This is not used by this contract but is included here so that
   * this contract fully implements the IL1Bridge interface used by zkSync standard token bridge (L1ERC20Bridge).
   */
  function l2TokenAddress(address _l1Token) external view returns (address) {
    require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");
    return l2Token;
  }

  /**
   * @notice Close the L1 side of the bridge, preventing future deposits
   */
  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  /**
   * @notice Deposit Dai from Ethereum L1 to zkSync L2
   * @param _l2Receiver The recipient address on L2
   * @param _l1Token The address of the Dai token on L1
   * @param _amount The amount of Dai to deposit (in WAD)
   * @param _l2TxGasLimit The L2 gas limit to be used in the corresponding L2 transaction
   * @param _l2TxGasPerPubdataByte The gasPerPubdataByteLimit to be used in the corresponding L2 transaction
   */
  function deposit(
    address _l2Receiver,
    address _l1Token,
    uint256 _amount,
    uint256 _l2TxGasLimit,
    uint256 _l2TxGasPerPubdataByte
  ) external payable returns (bytes32 txHash) {
    require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");
    require(isOpen == 1, "L1DAITokenBridge/closed");

    TokenLike(l1Token).transferFrom(msg.sender, escrow, _amount);

    bytes memory l2TxCalldata = abi.encodeWithSelector(
      IL2Bridge.finalizeDeposit.selector,
      msg.sender,
      _l2Receiver,
      _l1Token,
      _amount,
      "" // _data is not used in this bridge but still kept as an argument of finalizeDeposit for consistency with ZkSync's standard ERC20 bridge
    );

    txHash = zkSyncMailbox.requestL2Transaction{value: msg.value}(
      l2Bridge,
      0, // l2Value is the amount of ETH sent to the L2 method. As the L2 method is non-payable, this is always 0
      l2TxCalldata,
      _l2TxGasLimit,
      _l2TxGasPerPubdataByte,
      new bytes[](0), // array of L2 bytecodes that will be marked as known on L2. This is only required when deploying an L2 contract, so is left empty here
      msg.sender != tx.origin ? AddressAliasHelper.applyL1ToL2Alias(msg.sender) : msg.sender // The address on L2 that will receive the refund for the transaction
    );

    depositAmount[msg.sender][txHash] = _amount;

    emit DepositInitiated(msg.sender, _l2Receiver, _l1Token, _amount);
  }

  /**
   * @notice Recover the L1 Dai sent to the escrow when the L1 > L2 deposit message failed to
   * be executed on L2 (for example because of the amount of ETH sent with the deposit transaction was not
   * large enough to cover the cost of the L2 transaction).
   * @param _depositSender The address of the account that sent the L1 Dai
   * @param _l1Token The address of the Dai token on L1
   * @param _l2TxHash The transaction hash of the failed L2 transaction
   * @param _l1BatchNumber The number of the L1 batch that includes the failed L2 transaction
   * @param _l2MessageIndex The position of the L2 log (corresponding to the failed L2 transaction) in the L2 logs Merkle tree
   * @param _l1BatchTxIndex The position of the failed L2 transaction in the L1 batch
   * @param _merkleProof Merkle proof of inclusion of the L2 log (corresponding to the failed L2 transaction)
   */
  function claimFailedDeposit(
    address _depositSender,
    address _l1Token,
    bytes32 _l2TxHash,
    uint256 _l1BatchNumber,
    uint256 _l2MessageIndex,
    uint16 _l1BatchTxIndex,
    bytes32[] calldata _merkleProof
  ) external {
    require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");

    L2Log memory l2Log = L2Log({
      l2ShardId: 0, // the shard identifier, 0 - rollup, 1 - porter.
      isService: true, // boolean flag that is part of the log along with `key`, `value`, and `sender` address. This field is required formally but does not have any special meaning.
      txNumberInBlock: _l1BatchTxIndex,
      sender: BOOTLOADER_ADDRESS, // the L2 address which sent the log
      key: _l2TxHash,
      value: bytes32(0) // a zero value indicates a failed L2 transaction
    });
    bool success = zkSyncMailbox.proveL2LogInclusion(
      _l1BatchNumber,
      _l2MessageIndex,
      l2Log,
      _merkleProof
    );
    require(success, "L1DAITokenBridge/wrong-proof");

    uint256 amount = depositAmount[_depositSender][_l2TxHash];
    require(amount > 0, "L1DAITokenBridge/not-deposited");

    depositAmount[_depositSender][_l2TxHash] = 0;
    TokenLike(l1Token).transferFrom(escrow, _depositSender, amount);

    emit ClaimedFailedDeposit(_depositSender, _l1Token, amount);
  }

  /**
   * @notice Finalize an L2 > L1 Dai withdrawal
   * @param _l1BatchNumber The number of the L1 batch that includes the withdrawal transaction on L2
   * @param _l2MessageIndex The position of the L2 log (corresponding to the withdrawal transaction on L2) in the L2 logs Merkle tree
   * @param _l1BatchTxIndex The position of the withdrawal L2 transaction in the L1 batch
   * @param _message The withdrawal message encoded as `abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount)`
   * @param _merkleProof Merkle proof of inclusion of the L2 log (corresponding to the withdrawal transaction on L2)
   */
  function finalizeWithdrawal(
    uint256 _l1BatchNumber,
    uint256 _l2MessageIndex,
    uint16 _l1BatchTxIndex,
    bytes calldata _message,
    bytes32[] calldata _merkleProof
  ) external {
    require(
      !isWithdrawalFinalized[_l1BatchNumber][_l2MessageIndex],
      "L1DAITokenBridge/was-withdrawn"
    );
    L2Message memory l2ToL1Message = L2Message({
      txNumberInBlock: _l1BatchTxIndex,
      sender: l2Bridge,
      data: _message
    });

    (address l1Receiver, uint256 amount) = _parseL2WithdrawalMessage(l2ToL1Message.data);
    bool success = zkSyncMailbox.proveL2MessageInclusion(
      _l1BatchNumber,
      _l2MessageIndex,
      l2ToL1Message,
      _merkleProof
    );
    require(success, "L1DAITokenBridge/invalid-proof");

    isWithdrawalFinalized[_l1BatchNumber][_l2MessageIndex] = true;

    TokenLike(l1Token).transferFrom(escrow, l1Receiver, amount);

    emit WithdrawalFinalized(l1Receiver, l1Token, amount);
  }

  function _parseL2WithdrawalMessage(
    bytes memory _l2ToL1message
  ) internal pure returns (address l1Receiver, uint256 amount) {
    // _l2ToL1message = {size:32}{funSig:4}{l1Receiver:20}{amount:32} => _l2ToL1message.length = 4 + 20 + 32 = 56 (bytes).
    require(_l2ToL1message.length == 56, "L1DAITokenBridge/bad-msg-length");

    uint32 funSig;
    assembly {
      funSig := mload(add(_l2ToL1message, 4))
    }
    require(bytes4(funSig) == this.finalizeWithdrawal.selector, "L1DAITokenBridge/bad-msg-sig");

    assembly {
      l1Receiver := mload(add(_l2ToL1message, 24))
      amount := mload(add(_l2ToL1message, 56))
    }
  }
}
