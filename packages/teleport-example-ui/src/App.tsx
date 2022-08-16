import './App.scss'

import { Alert, Button, Col, Row } from 'antd'
import { BigNumber } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { useState } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DomainBox, DomainChainId, DstDomainChainId, SrcDomainChainId } from './domains'
import { useAmounts } from './useAmounts'
import { useMainButton } from './useMainButton'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'
import { useConnectedWallet } from './wallet/useConnectedWallet'

const SRC_CHAIN_IDS = [421611, 421613, 69, 420]
const SRC_CHAINID_TO_DST_CHAINID: { [key in SrcDomainChainId]: DstDomainChainId } = {
  69: 42,
  421611: 4,
  420: 5,
  421613: 5,
}

function App() {
  const { connectWallet, disconnectWallet, account, chainId: walletChainId, provider } = useConnectedWallet()

  const [srcChainId, setSrcChainId] = useState<SrcDomainChainId>(421613)
  const [searchParams] = useSearchParams({})
  const urlChainId = Number(searchParams.get('chainId'))

  useEffect(() => {
    if (SRC_CHAIN_IDS.includes(urlChainId)) {
      setSrcChainId(urlChainId as SrcDomainChainId)
    } else if (walletChainId && SRC_CHAIN_IDS.includes(walletChainId)) {
      setSrcChainId(walletChainId as SrcDomainChainId)
    }
  }, [walletChainId, urlChainId])

  const {
    amount,
    maxAmount,
    dstBalance,
    relayFee,
    amountAfterFee,
    allowance,
    setAmount,
    updateMaxAmount,
    updateDstBalance,
    updateAllowance,
  } = useAmounts(srcChainId, account)
  const { mainButton, gulpConfirmed, approveConfirmed, burnTxHash, guid, burnConfirmed, relayConfirmed } =
    useMainButton(connectWallet, srcChainId, account, maxAmount, amount, allowance, relayFee, walletChainId, provider)

  useEffect(() => {
    if (relayConfirmed) {
      setAmount('0')
    } else if (guid) {
      const am = formatEther(BigNumber.from(guid.amount))
      setAmount(am)
    }
  }, [guid, relayConfirmed])
  useEffect(() => {
    updateMaxAmount().catch(console.error)
  }, [gulpConfirmed, burnConfirmed])
  useEffect(() => {
    updateAllowance().catch(console.error)
  }, [approveConfirmed, burnConfirmed])
  useEffect(() => {
    if (relayConfirmed) setAmount('0')
    updateDstBalance().catch(console.error)
  }, [relayConfirmed])

  const dstChainId = SRC_CHAINID_TO_DST_CHAINID[srcChainId as SrcDomainChainId]

  return (
    <div className="App">
      <Row justify="center">
        <Col xs={24} sm={24} md={24} lg={22} xl={20} xxl={18}>
          <Row style={{ marginBottom: 20 }} justify="center">
            <Col span={24}>
              <Alert
                message="This is an example UI and is not meant for use in production. This frontend is unaudited and may contain
      critical bugs resulting in the loss of your funds. Use at your own risks!"
                type="warning"
                closable
              />
            </Col>
          </Row>
          <Row justify="end" className="box top-bar">
            <Col flex="auto"></Col>
            <Col flex="100px">
              <ConnectWalletButton {...{ connectWallet, disconnectWallet, account }} />
            </Col>
          </Row>
          <br />
          <Row className="box teleport" justify="center">
            <Col xs={24} sm={24} md={18} lg={16} xl={14} xxl={12}>
              <DomainBox
                amount={amount}
                maxAmount={maxAmount}
                isSourceDomain={true}
                supportedDomains={SRC_CHAIN_IDS as Array<DomainChainId>}
                domain={srcChainId}
                onDomainChanged={(newChainId) => setSrcChainId(newChainId as SrcDomainChainId)}
                onMaxAmountClicked={() => setAmount(maxAmount)}
                onAmountChanged={(am) => !burnTxHash && setAmount(am)}
              />
              <DomainBox
                amount={amountAfterFee}
                maxAmount={dstBalance}
                isSourceDomain={false}
                supportedDomains={[dstChainId]}
                domain={dstChainId}
              />

              <Button
                type="primary"
                shape="round"
                size="large"
                block
                onClick={mainButton.onClick}
                disabled={mainButton.disabled}
                loading={mainButton.loading}
              >
                {mainButton.label || <></>}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}

export default App
