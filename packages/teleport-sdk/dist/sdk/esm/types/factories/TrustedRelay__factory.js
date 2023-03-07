/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, utils } from "ethers";
const _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_oracleAuth",
                type: "address",
            },
            {
                internalType: "address",
                name: "_daiJoin",
                type: "address",
            },
            {
                internalType: "address",
                name: "_ethPriceOracle",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "Deny",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "Dissed",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "what",
                type: "bytes32",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "data",
                type: "uint256",
            },
        ],
        name: "File",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "Kissed",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "Rely",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address[]",
                name: "signers",
                type: "address[]",
            },
        ],
        name: "SignersAdded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address[]",
                name: "signers",
                type: "address[]",
            },
        ],
        name: "SignersRemoved",
        type: "event",
    },
    {
        inputs: [],
        name: "WAD_BPS",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "signers_",
                type: "address[]",
            },
        ],
        name: "addSigners",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "buds",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "dai",
        outputs: [
            {
                internalType: "contract TokenLike",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "daiJoin",
        outputs: [
            {
                internalType: "contract DaiJoinLike",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "deny",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "diss",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "ethPriceOracle",
        outputs: [
            {
                internalType: "contract DsValueLike",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "what",
                type: "bytes32",
            },
            {
                internalType: "uint256",
                name: "data",
                type: "uint256",
            },
        ],
        name: "file",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "gasMargin",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "kiss",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "oracleAuth",
        outputs: [
            {
                internalType: "contract WormholeOracleAuthLike",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "sourceDomain",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "targetDomain",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "receiver",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "operator",
                        type: "bytes32",
                    },
                    {
                        internalType: "uint128",
                        name: "amount",
                        type: "uint128",
                    },
                    {
                        internalType: "uint80",
                        name: "nonce",
                        type: "uint80",
                    },
                    {
                        internalType: "uint48",
                        name: "timestamp",
                        type: "uint48",
                    },
                ],
                internalType: "struct WormholeGUID",
                name: "wormholeGUID",
                type: "tuple",
            },
            {
                internalType: "bytes",
                name: "signatures",
                type: "bytes",
            },
            {
                internalType: "uint256",
                name: "maxFeePercentage",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "gasFee",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "expiry",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "v",
                type: "uint8",
            },
            {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
            },
            {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "data",
                type: "bytes",
            },
        ],
        name: "relay",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "usr",
                type: "address",
            },
        ],
        name: "rely",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "signers_",
                type: "address[]",
            },
        ],
        name: "removeSigners",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "signers",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "wards",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "wormholeJoin",
        outputs: [
            {
                internalType: "contract WormholeJoinLike",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];
export class TrustedRelay__factory {
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
TrustedRelay__factory.abi = _abi;
