#!/usr/bin/env yarn ts-node

import { demo } from './demo'

const SRC_DOMAIN_ETHERSCAN = 'https://testnet.arbiscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://rinkeby.etherscan.io/tx/'
const srcDomain = 'arbitrum-testnet'

demo(srcDomain, SRC_DOMAIN_ETHERSCAN, DST_DOMAIN_ETHERSCAN).catch(console.error)
