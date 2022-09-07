#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://optimistic.etherscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://etherscan.io/tx/'
const RELAY_ADDRESS = undefined // BasicRelay
const srcDomain = 'optimism'
const amount = 1

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN, amount, RELAY_ADDRESS).catch(console.error)
