#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://kovan-optimistic.etherscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://optimistic.etherscan.io/tx/'
const srcDomain = 'optimism-testnet'
const amount = 1

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN, amount).catch(console.error)
