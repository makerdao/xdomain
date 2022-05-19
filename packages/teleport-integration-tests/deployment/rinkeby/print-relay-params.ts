import 'dotenv/config'

import { Provider } from '@ethersproject/providers'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { mapValues } from 'lodash'

import { getGasPriceBid, getMaxGas, getMaxSubmissionPrice } from '../../test/arbitrum'

const L1_GOV_RELAY_ADDR = '0x97057eF24d3C69D974Cc5348145b7258c5a503B6'
const L2_GOV_RELAY_ADDR = '0x10039313055c5803D1820FEF2720ecC1Ff2F02f6'

async function main() {
  const l2Rpc = getRequiredEnv('RINKEBY_ARBITRUM_L2_RPC')
  const l2Provider = new ethers.providers.JsonRpcProvider(l2Rpc)
  await printRelayParams(l2Provider)
}

async function printRelayParams(l2Provider: Provider) {
  const l2SpellInterface = new Interface(['function execute()'])
  const l2SpellCalldata = l2SpellInterface.encodeFunctionData('execute')
  const l2MessageCalldata = new Interface([
    'function relay(address target, bytes calldata targetData)',
  ]).encodeFunctionData('relay', ['0xffffffffffffffffffffffffffffffffffffffff', l2SpellCalldata])
  const calldataLength = l2MessageCalldata.length
  const gasPriceBid = await getGasPriceBid(l2Provider)
  const maxSubmissionCost = await getMaxSubmissionPrice(l2Provider, calldataLength)
  const maxGas = await getMaxGas(
    l2Provider,
    L1_GOV_RELAY_ADDR,
    L2_GOV_RELAY_ADDR,
    L2_GOV_RELAY_ADDR,
    maxSubmissionCost,
    gasPriceBid,
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
