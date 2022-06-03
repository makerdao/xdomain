import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import provideCurveHandleTransaction from "./curve.event";
import { Interface } from "@ethersproject/abi";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber as ethersBn } from "ethers";
import BigNumber from "bignumber.js";
import { calculateCurvePrice } from "./utils";
import { TOKEN_EXCHANGE_IFACE } from "./abi";

const mockEvent: string = "event MockEvent (address indexed sender, uint amount0, uint amount1)";
const mockIface: Interface = new Interface([mockEvent]);
const TEST_SPREAD_THRESHOLD: BigNumber = new BigNumber(0.02); //2%

//buyer, sold_id, tokens_sold, bought_id, tokens_bought
const EXCHANGE_CASES: [string, number, ethersBn, number, ethersBn][] = [
  [
    createAddress("0x5656"),
    1,
    ethersBn.from(325523523345345),
    0,
    ethersBn.from(325523523345999).mul(ethersBn.from(10).pow(12)),
  ], //not exceeding
  [createAddress("0xaaa"), 0, ethersBn.from(1), 2, ethersBn.from(925523523345999).mul(ethersBn.from(10).pow(12))], //exceeding
  [createAddress("0xbbb"), 1, ethersBn.from(2), 2, ethersBn.from(925523523345999).mul(ethersBn.from(10).pow(12))], //not DAI
  [createAddress("0xccc"), 0, ethersBn.from(3), 1, ethersBn.from(825523523345999).mul(ethersBn.from(10).pow(12))], //exceeding
  [createAddress("0xddd"), 2, ethersBn.from(4), 0, ethersBn.from(725523523345999).mul(ethersBn.from(10).pow(12))], //exceeding
];

const testCreateFinding = (price: BigNumber, spreadThreshold: BigNumber, pool: string, pair: string): Finding => {
  return Finding.fromObject({
    name: "DAI Price Alert",
    description: `Spread threshold exceeded in Curve's 3pool ${pair} pair`,
    alertId: "MK-06",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      price: price.toString().slice(0, 6),
      spreadThreshold: spreadThreshold.toString(),
    },
    addresses: [pool],
  });
};

describe("Apeswap Large LP Deposit/Withdrawal bot test suite", () => {
  const mockNetworkManager = {
    uniswapV3Factory: createAddress("0xadd0"),
    token0: createAddress("0xadd9"),
    token1: createAddress("0xadd2"),
    uniswapPair: "USDC/DAI",
    curve3Pool: createAddress("0xadd3"),
    networkId: 10,
  };
  const handleTransaction: HandleTransaction = provideCurveHandleTransaction(
    mockNetworkManager as any,
    TEST_SPREAD_THRESHOLD
  );

  it("should ignore empty transactions", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other event logs on Curve 3pool", async () => {
    const event = mockIface.getEvent("MockEvent");
    const log = mockIface.encodeEventLog(event, [createAddress("0xbbbb"), ethersBn.from(89423), ethersBn.from(125423)]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.curve3Pool,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings when the spread threshold is not exceeded in Curve's 3pool", async () => {
    const event = TOKEN_EXCHANGE_IFACE.getEvent("TokenExchange");
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addInterfaceEventLog(
      event,
      mockNetworkManager.curve3Pool,
      [...EXCHANGE_CASES[0]]
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings Curve 3pool's USDT/USDC exhanges", async () => {
    const event = TOKEN_EXCHANGE_IFACE.getEvent("TokenExchange");
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addInterfaceEventLog(
      event,
      mockNetworkManager.curve3Pool,
      [...EXCHANGE_CASES[2]]
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the spread threshold is exceeded in Curve's 3pool", async () => {
    const event = TOKEN_EXCHANGE_IFACE.getEvent("TokenExchange");
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addInterfaceEventLog(
      event,
      mockNetworkManager.curve3Pool,
      [...EXCHANGE_CASES[1]]
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[1][2], EXCHANGE_CASES[1][3], EXCHANGE_CASES[1][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "USDT/DAI"
      ),
    ]);
  });

  it("should return multiple findings", async () => {
    const event = TOKEN_EXCHANGE_IFACE.getEvent("TokenExchange");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(224105)
      .addInterfaceEventLog(event, mockNetworkManager.curve3Pool, [...EXCHANGE_CASES[3]])
      .addInterfaceEventLog(event, mockNetworkManager.curve3Pool, [...EXCHANGE_CASES[4]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[3][2], EXCHANGE_CASES[3][3], EXCHANGE_CASES[3][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "USDC/DAI"
      ),
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[4][2], EXCHANGE_CASES[4][3], EXCHANGE_CASES[4][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "USDT/DAI"
      ),
    ]);
  });
});
