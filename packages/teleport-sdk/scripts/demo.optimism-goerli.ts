#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://blockscout.com/optimism/goerli/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://kovan.etherscan.io/tx/'
const RELAY_ADDRESS = undefined // BasicRelay
const srcDomain = 'optimism-goerli-testnet'
const amount = 1

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN, amount, RELAY_ADDRESS).catch(console.error)
