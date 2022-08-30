import { Button, Col, InputNumber, Row, Select } from 'antd'
import { ethers } from 'ethers'

import { DomainChainId, DomainName } from './metadata'
export function DomainBox({
  isSourceDomain,
  domain,
  supportedDomains,
  enabledDomains,
  amount,
  maxAmount,
  onDomainChanged,
  onAmountChanged,
  onMaxAmountClicked,
}: {
  isSourceDomain: boolean
  domain: DomainChainId
  supportedDomains?: Array<DomainChainId>
  enabledDomains?: Array<DomainChainId>
  amount?: string
  maxAmount?: string
  onDomainChanged?: (chainId: DomainChainId) => void
  onAmountChanged?: (amount: string) => void
  onMaxAmountClicked?: () => void
}) {
  const balance = isSourceDomain ? (
    <Button type="text" onClick={onMaxAmountClicked} loading={maxAmount === undefined} className="max-amount">
      {' '}
      Max: {maxAmount || '0'} DAI
    </Button>
  ) : (
    <div className="dst-balance">{maxAmount} DAI</div>
  )

  return (
    <div className="domain">
      <Row>
        <Col flex={3}>
          <Row gutter={16} align="middle">
            <Col flex="56px">{isSourceDomain ? 'From:' : 'To:'}</Col>
            <Col>
              <Select
                value={domain}
                style={{ width: 200 }}
                onChange={(chainId: DomainChainId) => onDomainChanged?.(chainId)}
              >
                {(supportedDomains ?? []).map((chainId) => (
                  <Select.Option value={chainId} key={chainId} disabled={enabledDomains?.includes(chainId) === false}>
                    <DomainName chainId={chainId} />
                  </Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Col>

        <Col flex={2}>
          <Row justify="end">
            <Col>{balance}</Col>
          </Row>
        </Col>
      </Row>
      <br />
      <div>
        <InputNumber
          stringMode
          disabled={!isSourceDomain}
          addonAfter={
            <Select
              defaultValue="DAI"
              style={{ width: 65 }}
              // disabled={true}
            >
              <Select.Option value="DAI">DAI</Select.Option>
            </Select>
          }
          min="0"
          max={isSourceDomain ? maxAmount || '0' : undefined}
          step={'1'}
          // precision={18}
          value={amount}
          style={{ width: '100%' }}
          onChange={(val) => {
            try {
              ethers.FixedNumber.fromString(val, 'ufixed128x18')
              onAmountChanged?.(val || '0')
              return true
            } catch (e) {}
          }}
        />
      </div>
    </div>
  )
}
