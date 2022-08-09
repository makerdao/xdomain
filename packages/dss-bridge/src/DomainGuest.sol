// SPDX-License-Identifier: AGPL-3.0-or-later

/// DomainGuest.sol -- xdomain guest dss manager

// Copyright (C) 2022 Dai Foundation
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

pragma solidity ^0.8.14;

import "./TeleportGUID.sol";
import {DomainHost} from "./DomainHost.sol";

interface VatLike {
    function hope(address usr) external;
    function debt() external view returns (uint256);
    function Line() external view returns (uint256);
    function file(bytes32 what, uint256 data) external;
    function dai(address usr) external view returns (uint256);
    function sin(address usr) external view returns (uint256);
    function heal(uint256 rad) external;
    function swell(address u, int256 rad) external;
}

interface TokenLike {
    function balanceOf(address usr) external view returns (uint256);
    function transferFrom(address src, address dst, uint256 wad) external returns (bool);
    function approve(address usr, uint wad) external returns (bool);
    function mint(address to, uint256 value) external;
}

interface DaiJoinLike {
    function vat() external view returns (VatLike);
    function dai() external view returns (TokenLike);
    function join(address usr, uint256 wad) external;
    function exit(address usr, uint256 wad) external;
}

interface EndLike {
    function cage() external;
}

/// @title Support for xchain MCD, canonical DAI and Maker Teleport - remote instance
/// @dev This is just the business logic which needs concrete message-passing implementation
abstract contract DomainGuest {
    
    // --- Data ---
    mapping (address => uint256) public wards;
    mapping (bytes32 => uint256) public validDomains;
    mapping (bytes32 => uint256) public batchedDaiToFlush;

    EndLike public end;
    uint256 public lid;         // Local ordering id
    uint256 public rid;         // Remote ordering id
    int256  public line;        // Keep track of changes in line
    uint256 public grain;       // Keep track of the pre-minted DAI in the remote escrow [WAD]
    uint256 public live;
    uint80  public nonce;

    bytes32     public immutable domain;
    VatLike     public immutable vat;
    DaiJoinLike public immutable daiJoin;
    TokenLike   public immutable dai;
    TokenLike   public immutable claimToken;

    uint256 constant RAY = 10 ** 27;

    string constant ARITHMETIC_ERROR = string(abi.encodeWithSignature("Panic(uint256)", 0x11));

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, address data);
    event File(bytes32 indexed what, bytes32 indexed domain, uint256 data);
    event Lift(int256 dline);
    event Release(uint256 burned);
    event Push(int256 surplus);
    event Rectify(uint256 wad);
    event Cage();
    event Tell(uint256 value);
    event MintClaim(address indexed usr, uint256 claim);
    event Deposit(address indexed to, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event InitiateTeleport(TeleportGUID teleport);
    event Flush(bytes32 indexed targetDomain, uint256 dai);

    modifier auth {
        require(wards[msg.sender] == 1, "DomainGuest/not-authorized");
        _;
    }

    function _isHost(address usr) internal virtual view returns (bool);
    modifier hostOnly {
        require(_isHost(msg.sender), "DomainGuest/not-host");
        _;
    }

    modifier isLive {
        require(live == 1, "DomainGuest/not-live");
        _;
    }

    modifier ordered(uint256 _lid) {
        require(lid++ == _lid, "DomainGuest/out-of-order");
        _;
    }

    constructor(bytes32 _domain, address _daiJoin, address _claimToken) {
        wards[msg.sender] = 1;
        emit Rely(msg.sender);

        domain = _domain;
        daiJoin = DaiJoinLike(_daiJoin);
        vat = daiJoin.vat();
        dai = daiJoin.dai();
        claimToken = TokenLike(_claimToken);

        vat.hope(_daiJoin);
        dai.approve(_daiJoin, type(uint256).max);

        live = 1;
    }

    // --- Math ---
    function _int256(uint256 x) internal pure returns (int256 y) {
        require((y = int256(x)) >= 0, ARITHMETIC_ERROR);
    }
    function _min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x <= y ? x : y;
    }
    function _max(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x >= y ? x : y;
    }
    function _divup(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = (x + y - 1) / y;
    }

    // --- Administration ---
    function rely(address usr) external auth {
        wards[usr] = 1;
        emit Rely(usr);
    }

    function deny(address usr) external auth {
        wards[usr] = 0;
        emit Deny(usr);
    }

    function file(bytes32 what, address data) external auth {
        if (what == "end") end = EndLike(data);
        else revert("DomainGuest/file-unrecognized-param");
        emit File(what, data);
    }

    function file(bytes32 what, bytes32 _domain, uint256 data) external auth {
        if (what == "validDomains") {
            require(data <= 1, "DomainGuest/invalid-data");

            validDomains[_domain] = data;
        } else {
            revert("DomainGuest/file-unrecognized-param");
        }
        emit File(what, _domain, data);
    }

    // --- MCD Support ---

    /// @notice Record changes in line and grain and update dss global debt ceiling if necessary
    /// @param _lid Local ordering id
    /// @param dline The change in the line [RAD]
    function lift(uint256 _lid, int256 dline) external hostOnly isLive ordered(_lid) {
        line += dline;
        if (dline > 0) grain += uint256(dline) / RAY;
        vat.file("Line", uint256(line));

        emit Lift(dline);
    }

    /// @notice Will release remote DAI from the escrow when it is safe to do so
    /// @dev    Should be run by keeper on a regular schedule.
    ///         This will also push the vat debt for informational purposes.
    function _release() internal isLive returns (bytes memory payload) {
        uint256 limit = _max(vat.Line() / RAY, _divup(vat.debt(), RAY));
        require(grain > limit, "DomainGuest/limit-too-high");
        uint256 burned = grain - limit;
        grain = limit;

        payload = abi.encodeWithSelector(DomainHost.release.selector, rid++, burned);

        emit Release(burned);
    }

    /// @notice Push surplus (or deficit) to the host dss
    /// @dev Should be run by keeper on a regular schedule
    function _push() internal isLive returns (bytes memory payload) {
        uint256 _dai = vat.dai(address(this));
        uint256 _sin = vat.sin(address(this));
        if (_dai > _sin) {
            // We have a surplus
            if (_sin > 0) vat.heal(_sin);

            uint256 wad = (_dai - _sin) / RAY;    // Leave the dust

            // Burn the DAI and unload on the other side
            vat.swell(address(this), -_int256(wad * RAY));
            payload = abi.encodeWithSelector(DomainHost.push.selector, rid++, _int256(wad));

            emit Push(int256(wad));
        } else if (_dai < _sin) {
            // We have a deficit
            if (_dai > 0) vat.heal(_dai);

            int256 deficit = -_int256(_divup(_sin - _dai, RAY));    // Round up to overcharge for deficit
            payload = abi.encodeWithSelector(DomainHost.push.selector, rid++, deficit);

            emit Push(deficit);
        }
    }

    /// @notice Merge DAI into surplus
    /// @param _lid Local ordering id
    /// @param wad The amount of DAI that has been sent to this domain [WAD]
    function rectify(uint256 _lid, uint256 wad) external hostOnly ordered(_lid) {
        vat.swell(address(this), _int256(wad * RAY));

        emit Rectify(wad);
    }

    /// @notice Trigger the end module
    /// @param _lid Local ordering id
    function cage(uint256 _lid) external hostOnly isLive ordered(_lid) {
        live = 0;
        end.cage();

        emit Cage();
    }

    /// @notice Set the cure value for the host
    /// @dev Triggered during shutdown
    /// @param value Cure value [RAD]
    function _tell(uint256 value) internal auth returns (bytes memory payload) {
        payload = abi.encodeWithSelector(DomainHost.tell.selector, rid++, value);

        emit Tell(value);
    }

    /// @notice Mint a claim token for the given user
    /// @dev    Claim amount is in units of local debt.
    /// @param usr The destination to send the claim tokens to
    /// @param claim The amount of claim tokens to mint
    function mintClaim(address usr, uint256 claim) external hostOnly {
        claimToken.mint(usr, claim);

        emit MintClaim(usr, claim);
    }

    function heal(uint256 amount) external {
        vat.heal(amount);
    }
    function heal() external {
        vat.heal(_min(vat.dai(address(this)), vat.sin(address(this))));
    }

    // --- Canonical DAI Support ---

    /// @notice Mint DAI and send to user
    /// @param to The address to send the DAI to on the local domain
    /// @param amount The amount of DAI to send [WAD]
    function deposit(address to, uint256 amount) external hostOnly {
        vat.swell(address(this), _int256(amount * RAY));
        daiJoin.exit(to, amount);

        emit Deposit(to, amount);
    }

    /// @notice Withdraw DAI by burning local canonical DAI
    /// @param to The address to send the DAI to on the remote domain
    /// @param amount The amount of DAI to withdraw [WAD]
    function _withdraw(address to, uint256 amount) internal returns (bytes memory payload) {
        require(dai.transferFrom(msg.sender, address(this), amount), "DomainGuest/transfer-failed");
        daiJoin.join(address(this), amount);
        vat.swell(address(this), -_int256(amount * RAY));

        payload = abi.encodeWithSelector(DomainHost.withdraw.selector, to, amount);

        emit Withdraw(to, amount);
    }

    // --- Maker Teleport Support ---
    function _initiateTeleport(
        bytes32 targetDomain,
        bytes32 receiver,
        uint128 amount,
        bytes32 operator
    ) internal returns (bytes memory payload) {
        // Disallow initiating new teleport transfer if targetDomain has not been whitelisted
        require(validDomains[targetDomain] == 1, "DomainGuest/invalid-domain");

        TeleportGUID memory teleport = TeleportGUID({
            sourceDomain: domain,
            targetDomain: targetDomain,
            receiver: receiver,
            operator: operator,
            amount: amount,
            nonce: nonce++,
            timestamp: uint48(block.timestamp)
        });

        batchedDaiToFlush[targetDomain] += amount;
        require(dai.transferFrom(msg.sender, address(this), amount), "DomainHost/transfer-failed");
        daiJoin.join(address(this), amount);
        vat.swell(address(this), -_int256(amount * RAY));

        payload = abi.encodeWithSelector(DomainHost.teleportSlowPath.selector, teleport);

        emit InitiateTeleport(teleport);
    }

    function _flush(bytes32 targetDomain) internal returns (bytes memory payload) {
        // We do not check for valid domain because previously valid domains still need their DAI flushed
        uint256 daiToFlush = batchedDaiToFlush[targetDomain];
        require(daiToFlush > 0, "DomainGuest/zero-dai-flush");

        batchedDaiToFlush[targetDomain] = 0;

        payload = abi.encodeWithSelector(DomainHost.flush.selector, targetDomain, daiToFlush);

        emit Flush(targetDomain, daiToFlush);
    }
    
}
