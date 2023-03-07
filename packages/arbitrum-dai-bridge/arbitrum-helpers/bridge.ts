import {
  getArbitrumGasPriceBid,
  getArbitrumMaxGas,
  getArbitrumMaxSubmissionPrice,
  waitForTx,
  waitToRelayTxToArbitrum,
} from 'xdomain-utils'

import { BridgeDeployment, NetworkConfig } from './deploy'

export async function executeSpell(
  network: NetworkConfig,
  bridgeDeployment: BridgeDeployment,
  l2Spell: string,
  spellCalldata: string,
) {
  const l2MessageCalldata = bridgeDeployment.l2GovRelay.interface.encodeFunctionData('relay', [l2Spell, spellCalldata])
  const calldataLength = l2MessageCalldata.length

  const gasPriceBid = await getArbitrumGasPriceBid(network.l2.provider)
  const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(network.l1.provider, calldataLength, network.l1.inbox)
  const maxGas = await getArbitrumMaxGas(
    network.l2.provider,
    bridgeDeployment.l1GovRelay.address,
    bridgeDeployment.l2GovRelay.address,
    bridgeDeployment.l2GovRelay.address,
    l2MessageCalldata,
  )
  const ethValue = maxSubmissionPrice.add(gasPriceBid.mul(maxGas))

  await network.l1.deployer.sendTransaction({ to: bridgeDeployment.l1GovRelay.address, value: ethValue })

  await waitToRelayTxToArbitrum(
    waitForTx(
      bridgeDeployment.l1GovRelay
        .connect(network.l1.deployer)
        .relay(l2Spell, spellCalldata, ethValue, maxGas, gasPriceBid, maxSubmissionPrice),
    ),
    network.l2.deployer,
  )
}
