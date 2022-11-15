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

interface TokenLike {
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success);
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
    address public immutable l1Token;
    address public immutable l2Bridge;
    address public immutable l2Token;
    address public immutable escrow;
    IMailbox public immutable zkSyncMailbox;
    uint256 public isOpen = 1;
    uint256 public ergsLimit = 2097152; // ergs limit used for deposit messages. Set to its max possible value by default.

    mapping(uint256 => mapping(uint256 => bool)) public isWithdrawalFinalized;
    mapping(address => mapping(bytes32 => uint256)) depositAmount;

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

    function l2TokenAddress(address _l1Token) external view returns (address) {
        require(_l1Token == l1Token, "L1DAITokenBridge/token-not-dai");
        return l2Token;
    }

    function file(bytes32 what, uint256 data) external auth {
        if (what == "ergsLimit") {
            ergsLimit = data;
        } else {
            revert("L1DAITokenBridge/file-unrecognized-param");
        }
        emit File(what, data);
    }

    function close() external auth {
        isOpen = 0;

        emit Closed();
    }

    function deposit(
        address _l2Receiver,
        address _l1Token,
        uint256 _amount
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
            0, // l2Value is always 0
            l2TxCalldata,
            ergsLimit,
            new bytes[](0)
        );

        depositAmount[msg.sender][txHash] = _amount;

        emit DepositInitiated(msg.sender, _l2Receiver, _l1Token, _amount);
    }

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
            l2ShardId: 0,
            isService: true,
            txNumberInBlock: _l1BatchTxIndex,
            sender: BOOTLOADER_ADDRESS,
            key: _l2TxHash,
            value: bytes32(0)
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

    function _parseL2WithdrawalMessage(bytes memory _l2ToL1message)
        internal
        pure
        returns (address l1Receiver, uint256 amount)
    {
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
