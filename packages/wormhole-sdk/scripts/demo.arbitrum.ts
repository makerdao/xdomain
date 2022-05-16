#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://testnet.arbiscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://rinkeby.etherscan.io/tx/'
const srcDomain = 'arbitrum-testnet'
const RELAY_ADDRESS = '0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7' // TrustedRelay

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN, undefined, RELAY_ADDRESS).catch(console.error)
