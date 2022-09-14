pragma solidity ^0.8.0;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/* A 2-of-2 multisig contract account */
contract TestMultiSig {
  address public owner1;
  address public owner2;
  uint256 public nonce;

  bytes4 constant EIP1271_SUCCESS_RETURN_VALUE = 0x1626ba7e;

  constructor(address _owner1, address _owner2) {
    owner1 = _owner1;
    owner2 = _owner2;
  }

  function isValidSignature(bytes32 _hash, bytes calldata _signature) public view returns (bytes4) {
    // The signature is the concatenation of the ECDSA signatures of the owners
    // Each ECDSA signature is 65 bytes long. That means that the combined signature is 130 bytes long.
    require(_signature.length == 130, "TestMultiSig/invalid-sig-length");

    address recoveredAddr1 = ECDSA.recover(_hash, _signature[0:65]);
    address recoveredAddr2 = ECDSA.recover(_hash, _signature[65:130]);

    require(recoveredAddr1 == owner1, "TestMultiSig/invalid-owner1");
    require(recoveredAddr2 == owner2, "TestMultiSig/invalid-owner2");

    return EIP1271_SUCCESS_RETURN_VALUE;
  }

  function execute(
    address _to,
    uint256 _value,
    bytes calldata _data,
    bytes calldata _signatures
  ) external returns (bytes memory _result) {
    bytes32 signHash = keccak256(
      abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        keccak256(
          abi.encodePacked(bytes1(0x19), bytes1(0), address(this), _to, _value, _data, nonce)
        )
      )
    );
    isValidSignature(signHash, _signatures);

    nonce += 1;

    bool success;
    (success, _result) = _to.call{value: _value}(_data);
    if (!success) {
      // solhint-disable-next-line no-inline-assembly
      assembly {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }
}
