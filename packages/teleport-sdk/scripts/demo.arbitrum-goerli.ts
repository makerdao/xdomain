#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://goerli.arbiscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://goerli.etherscan.io/tx/'
const srcDomain = 'arbitrum-goerli-testnet'
const RELAY_ADDRESS = undefined // BasicRelay

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN, undefined, RELAY_ADDRESS).catch(console.error)
