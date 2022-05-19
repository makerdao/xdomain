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

pragma solidity >=0.7.6;
pragma abicoder v2;

import {iOVM_L1ERC20Bridge} from "@eth-optimism/contracts/iOVM/bridge/tokens/iOVM_L1ERC20Bridge.sol";
import {iOVM_L2ERC20Bridge} from "@eth-optimism/contracts/iOVM/bridge/tokens/iOVM_L2ERC20Bridge.sol";
import {OVM_CrossDomainEnabled} from "@eth-optimism/contracts/libraries/bridge/OVM_CrossDomainEnabled.sol";
import {OVM_L2CrossDomainMessenger} from "@eth-optimism/contracts/OVM/bridge/messaging/OVM_L2CrossDomainMessenger.sol";
import {TeleportGUID, addressToBytes32} from "../common/TeleportGUID.sol";
import {IL1TeleportGateway, IL2TeleportGateway} from "../common/TeleportInterfaces.sol";

interface Mintable {
  function mint(address usr, uint256 wad) external;

  function burn(address usr, uint256 wad) external;
}

contract L2DaiTeleportGateway is OVM_CrossDomainEnabled, IL2TeleportGateway {
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
    require(wards[msg.sender] == 1, "L2DaiTeleportGateway/not-authorized");
    _;
  }

  address public immutable override l2Token;
  address public immutable override l1TeleportGateway;
  bytes32 public immutable override domain;
  uint256 public isOpen = 1;
  mapping(bytes32 => uint256) public validDomains;
  mapping(bytes32 => uint256) public batchedDaiToFlush;

  event Closed();
  event Rely(address indexed usr);
  event Deny(address indexed usr);
  event File(bytes32 indexed what, bytes32 indexed domain, uint256 data);

  constructor(
    address _l2CrossDomainMessenger,
    address _l2Token,
    address _l1TeleportGateway,
    bytes32 _domain
  ) OVM_CrossDomainEnabled(_l2CrossDomainMessenger) {
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l2Token = _l2Token;
    l1TeleportGateway = _l1TeleportGateway;
    domain = _domain;
  }

  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  function file(
    bytes32 what,
    bytes32 domain,
    uint256 data
  ) external auth {
    if (what == "validDomains") {
      require(data <= 1, "L2DaiTeleportGateway/invalid-data");

      validDomains[domain] = data;
    } else {
      revert("L2DaiTeleportGateway/file-unrecognized-param");
    }
    emit File(what, domain, data);
  }

  function initiateTeleport(
    bytes32 targetDomain,
    address receiver,
    uint128 amount
  ) external override {
    return _initiateTeleport(targetDomain, addressToBytes32(receiver), amount, 0);
  }

  function initiateTeleport(
    bytes32 targetDomain,
    address receiver,
    uint128 amount,
    address operator
  ) external override {
    return
      _initiateTeleport(
        targetDomain,
        addressToBytes32(receiver),
        amount,
        addressToBytes32(operator)
      );
  }

  function initiateTeleport(
    bytes32 targetDomain,
    bytes32 receiver,
    uint128 amount,
    bytes32 operator
  ) external override {
    return _initiateTeleport(targetDomain, receiver, amount, operator);
  }

  function _initiateTeleport(
    bytes32 targetDomain,
    bytes32 receiver,
    uint128 amount,
    bytes32 operator
  ) private {
    // Disallow initiating new teleport transfer if gateway is closed
    require(isOpen == 1, "L2DaiTeleportGateway/closed");

    // Disallow initiating new teleport transfer if targetDomain has not been whitelisted
    require(validDomains[targetDomain] == 1, "L2DaiTeleportGateway/invalid-domain");

    TeleportGUID memory teleport = TeleportGUID({
      sourceDomain: domain,
      targetDomain: targetDomain,
      receiver: receiver,
      operator: operator,
      amount: amount,
      nonce: uint80(OVM_L2CrossDomainMessenger(address(getCrossDomainMessenger())).messageNonce()), // gas optimization, we don't need to maintain our own nonce
      timestamp: uint48(block.timestamp)
    });

    batchedDaiToFlush[targetDomain] += amount;
    Mintable(l2Token).burn(msg.sender, amount);

    bytes memory message = abi.encodeWithSelector(
      IL1TeleportGateway.finalizeRegisterTeleport.selector,
      teleport
    );
    sendCrossDomainMessage(l1TeleportGateway, 0, message);

    emit TeleportInitialized(teleport);
  }

  function flush(bytes32 targetDomain) external override {
    // We do not check for valid domain because previously valid domains still need their DAI flushed
    uint256 daiToFlush = batchedDaiToFlush[targetDomain];
    require(daiToFlush > 0, "L2DaiTeleportGateway/zero-dai-flush");

    batchedDaiToFlush[targetDomain] = 0;

    bytes memory message = abi.encodeWithSelector(
      IL1TeleportGateway.finalizeFlush.selector,
      targetDomain,
      daiToFlush
    );
    sendCrossDomainMessage(l1TeleportGateway, 0, message);

    emit Flushed(targetDomain, daiToFlush);
  }
}
