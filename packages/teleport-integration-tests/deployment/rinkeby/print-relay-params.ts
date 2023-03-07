import 'dotenv/config'

import { getRinkebySdk } from '@dethcrypto/eth-sdk-client'
import { Provider } from '@ethersproject/providers'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { mapValues } from 'lodash'
import { getArbitrumGasPriceBid, getArbitrumMaxGas, getArbitrumMaxSubmissionPrice } from 'xdomain-utils'

const L1_GOV_RELAY_ADDR = '0x97057eF24d3C69D974Cc5348145b7258c5a503B6'
const L2_GOV_RELAY_ADDR = '0x10039313055c5803D1820FEF2720ecC1Ff2F02f6'

async function main() {
  const l1Rpc = getRequiredEnv('RINKEBY_RPC_URL')
  const l2Rpc = getRequiredEnv('RINKEBY_ARBITRUM_L2_RPC')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2Provider = new ethers.providers.JsonRpcProvider(l2Rpc)
  await printRelayParams(l1Provider, l2Provider)
}

async function printRelayParams(l1Provider: Provider, l2Provider: Provider) {
  const l2SpellInterface = new Interface(['function execute()'])
  const l2SpellCalldata = l2SpellInterface.encodeFunctionData('execute')
  const l2MessageCalldata = new Interface([
    'function relay(address target, bytes calldata targetData)',
  ]).encodeFunctionData('relay', ['0xffffffffffffffffffffffffffffffffffffffff', l2SpellCalldata])
  const calldataLength = l2MessageCalldata.length
  const gasPriceBid = await getArbitrumGasPriceBid(l2Provider)
  const rinkebySdk = getRinkebySdk(l1Provider as any)
  const maxSubmissionCost = await getArbitrumMaxSubmissionPrice(
    l1Provider,
    calldataLength,
    rinkebySdk.arbitrum.inbox.address,
  )
  const maxGas = await getArbitrumMaxGas(
    l2Provider,
    L1_GOV_RELAY_ADDR,
    L2_GOV_RELAY_ADDR,
    L2_GOV_RELAY_ADDR,
    l2MessageCalldata,
  )
  const ethValue = maxSubmissionCost.add(gasPriceBid.mul(maxGas))

  console.log(
    'Relay params:',
    mapValues({ l1CallValue: ethValue, maxGas, gasPriceBid, maxSubmissionCost }, (bn) => bn.toString()),
  )
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
