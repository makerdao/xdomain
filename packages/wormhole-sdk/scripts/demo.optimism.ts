#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://kovan-optimistic.etherscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://kovan.etherscan.io/tx/'
const RELAY_ADDRESS = '0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81' // TrustedRelay
const srcDomain = 'optimism-testnet'
const amount = 1

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN, amount, RELAY_ADDRESS).catch(console.error)
