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

import "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IL1Messenger.sol";
import "@matterlabs/zksync-contracts/l1/contracts/bridge/interfaces/IL1Bridge.sol";
import "@matterlabs/zksync-contracts/l2/contracts/bridge/interfaces/IL2Bridge.sol";

// The following constants are copied from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
// We refrain from importing this file directly as it contains a large number of imports,
// including some cyclic dependencies causing issues with flattening tools
uint160 constant SYSTEM_CONTRACTS_OFFSET = 0x8000; // 2^15
IL1Messenger constant L1_MESSENGER_CONTRACT = IL1Messenger(address(SYSTEM_CONTRACTS_OFFSET + 0x08));

interface Mintable {
  function mint(address usr, uint256 wad) external;

  function burn(address usr, uint256 wad) external;
}

// Mint tokens on L2 after locking funds on L1.
// Burn tokens on L1 and send a message to unlock tokens on L1 to L1 counterpart
// Note: when bridge is closed it will still process in progress messages

contract L2DAITokenBridge is IL2Bridge {
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

  address public immutable l2Token; // the address of L2 Dai
  address public immutable l1Token; // the address of L1 Dai
  address public immutable l1Bridge; // the counterpart bridge contract on L1
  uint256 public isOpen = 1; // flag indicating if the bridge is open to withdrawals

  event Rely(address indexed usr);
  event Deny(address indexed usr);
  event Closed();

  constructor(address _l2Token, address _l1Token, address _l1Bridge) {
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l2Token = _l2Token;
    l1Token = _l1Token;
    l1Bridge = _l1Bridge;
  }

  /**
   * @notice Returns the L2 Dai token address. This is not used by this contract but is included here so that
   * this contract fully implements the IL2Bridge interface used by zkSync standard token bridge (L2ERC20Bridge).
   */
  function l2TokenAddress(address _l1Token) external view returns (address) {
    require(_l1Token == l1Token, "L2DAITokenBridge/token-not-dai");
    return l2Token;
  }

  /**
   * @notice Returns the L1 Dai token address. This is not used by this contract but is included here so that
   * this contract fully implements the IL2Bridge interface used by zkSync standard token bridge (L2ERC20Bridge).
   */
  function l1TokenAddress(address _l2Token) external view returns (address) {
    require(_l2Token == l2Token, "L2DAITokenBridge/token-not-dai");
    return l1Token;
  }

  /**
   * @notice Close the L2 side of the bridge, preventing future withdrawals
   */
  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  /**
   * @notice Withdraw Dai from zkSync L2 to Ethereum L1
   * @param _l1Receiver The recipient address on L1
   * @param _l2Token The address of the Dai token on L2
   * @param _amount The amount of Dai to withdraw (in WAD)
   */
  function withdraw(address _l1Receiver, address _l2Token, uint256 _amount) external {
    require(_l2Token == l2Token, "L2DAITokenBridge/token-not-dai");

    _initiateWithdrawal(_l1Receiver, _amount);

    emit WithdrawalInitiated(msg.sender, _l1Receiver, _l2Token, _amount);
  }

  // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2 usage.
  function _initiateWithdrawal(address _to, uint256 _amount) internal {
    // do not allow initiating new xchain messages if bridge is closed
    require(isOpen == 1, "L2DAITokenBridge/closed");

    Mintable(l2Token).burn(msg.sender, _amount);

    bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

    L1_MESSENGER_CONTRACT.sendToL1(message);
  }

  /**
   * @notice Finalize an L1 > L2 Dai deposit. This credits the L2 account with the same amount of tokens as deposited on L1.
   * @param _l1Sender The L1 account that deposited the L1 Dai
   * @param _l2Receiver The L2 account that receives the L2 Dai
   * @param _l1Token The address of the Dai token on L1
   * @param _amount The amount of Dai to credit (in WAD)
   */
  function finalizeDeposit(
    address _l1Sender,
    address _l2Receiver,
    address _l1Token,
    uint256 _amount,
    bytes calldata /* _data */
  ) external {
    require(msg.sender == l1Bridge, "L2DAITokenBridge/sender-not-l1-bridge"); // only L1 bridge can call

    require(_l1Token == l1Token, "L2DAITokenBridge/token-not-dai");

    Mintable(l2Token).mint(_l2Receiver, _amount);

    emit FinalizeDeposit(_l1Sender, _l2Receiver, l2Token, _amount);
  }
}
