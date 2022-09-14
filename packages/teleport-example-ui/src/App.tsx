import './App.scss'

import { Alert, Button, Col, Descriptions, Row, Switch } from 'antd'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { useState } from 'react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { DomainBox, DomainChainId, SRC_CHAINID_TO_DST_CHAINID, SrcDomainChainId } from './domains'
import { useTeleportFlow } from './useTeleportFlow'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'
import { useConnectedWallet } from './wallet/useConnectedWallet'

const SRC_CHAIN_IDS = [42161, 10, 421613, 420]

function formatFee(amount: string) {
  try {
    const am = Number(amount)
    if (am === 0) return '0'
    if (am < 0.005) return '< 0.01'
    return am.toFixed(2)
  } catch {
    return amount
  }
}

function App() {
  const [warningVisible, setWarningVisible] = useState<boolean>(true)
  const [relayerSelected, setRelayerSelected] = useState<boolean>(true)
  const { connectWallet, disconnectWallet, account, chainId: walletChainId, provider } = useConnectedWallet()

  const [srcChainId, setSrcChainId] = useState<SrcDomainChainId>(42161)
  const [searchParams] = useSearchParams({})
  const urlChainIdString = searchParams.get('chainId')
  const urlChainId = urlChainIdString ? Number(urlChainIdString) : undefined

  const dstChainId = SRC_CHAINID_TO_DST_CHAINID[srcChainId as SrcDomainChainId]

  useEffect(() => {
    if (urlChainId !== undefined && SRC_CHAIN_IDS.includes(urlChainId)) {
      setSrcChainId(urlChainId as SrcDomainChainId)
    } else if (walletChainId !== undefined && SRC_CHAIN_IDS.includes(walletChainId)) {
      setSrcChainId(walletChainId as SrcDomainChainId)
    }
  }, [walletChainId, urlChainId])

  const {
    mainButton,
    burnTxHash,
    secondaryButton,
    dstBalance,
    amount,
    maxAmount,
    setAmount,
    bridgeFee,
    relayFee,
    mintTxHash,
    relayTaskId,
  } = useTeleportFlow(connectWallet, srcChainId, dstChainId, account, walletChainId, provider)

  const useRelayer = relayTaskId ? true : mintTxHash ? false : relayerSelected

  const fee = parseEther(bridgeFee || '0').add((useRelayer && parseEther(relayFee || '0')) || 0)
  let amountAfterFee
  if (amount === undefined) amountAfterFee = undefined
  else if (fee.gt(parseEther(amount))) amountAfterFee = '0'
  else amountAfterFee = formatEther(parseEther(amount).sub(fee))

  return (
    <div className="App">
      <Row justify="center">
        <Col xs={24} sm={24} md={24} lg={22} xl={20} xxl={18}>
          <Row style={{ marginBottom: warningVisible ? 20 : 10 }}>
            <Col span={24}>
              <Alert
                message={
                  <>
                    This is an example UI and is not meant for use in production. This frontend is{' '}
                    <strong>unaudited</strong> and may contain critical bugs resulting in the{' '}
                    <strong>loss of your funds</strong>. Use at your own risks!
                  </>
                }
                type="warning"
                closable
                onClose={() => setWarningVisible(false)}
              />
            </Col>
          </Row>
          <Row justify="end" className="box top-bar">
            <Col flex="auto">
              {urlChainId !== undefined && (
                <Row justify="start">
                  <Col flex="100px">
                    <Button type="link" className="new-teleport">
                      <Link to="/" target="_blank">
                        New Teleport
                      </Link>
                    </Button>
                  </Col>
                  <Col flex="auto"> </Col>
                </Row>
              )}
            </Col>
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
                enabledDomains={urlChainId !== undefined ? [srcChainId] : (SRC_CHAIN_IDS as Array<DomainChainId>)}
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

              <Row>
                <Col flex="220px">
                  <Descriptions
                    bordered
                    size="small"
                    column={1}
                    contentStyle={{ paddingTop: 4, paddingBottom: 4, textAlign: 'right' }}
                    labelStyle={{
                      paddingLeft: 0,
                      paddingTop: 4,
                      paddingBottom: 4,
                      textAlign: 'right',
                    }}
                  >
                    {<Descriptions.Item label="Bridge fee">{formatFee(bridgeFee || '0')} DAI</Descriptions.Item>}
                    {useRelayer && (
                      <Descriptions.Item label="Relayer fee">{formatFee(relayFee || '0')} DAI</Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>

                <Col flex="auto">
                  <div style={{ textAlign: 'right' }}>
                    <Switch
                      disabled={((mintTxHash || relayTaskId) && true) || false}
                      checked={useRelayer}
                      onChange={setRelayerSelected}
                      style={{ marginRight: 6, marginBottom: 3 }}
                    />{' '}
                    Mint DAI using Relayer
                  </div>
                </Col>
              </Row>
              <br />

              {(!useRelayer && secondaryButton && (
                <Button
                  type="primary"
                  shape="round"
                  size="large"
                  block
                  onClick={secondaryButton.onClick}
                  disabled={secondaryButton.disabled}
                  loading={secondaryButton.loading}
                >
                  {secondaryButton.label || <></>}
                </Button>
              )) || (
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
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}

export default App
