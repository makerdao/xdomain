import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { Interface } from "@ethersproject/abi";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber as ethersBn } from "ethers";
import BigNumber from "bignumber.js";
import { when } from "jest-when";
import { calculateCurvePrice, calculateUniswapPrice, uniswapPairCreate2 } from "./utils";
import { SWAP_IFACE, TOKEN_EXCHANGE_IFACE } from "./abi";

const mockEvent: string = "event MockEvent (address indexed sender, uint amount0, uint amount1)";
const mockIface: Interface = new Interface([mockEvent]);
const TEST_SPREAD_THRESHOLD: BigNumber = new BigNumber(0.02); //2%

//sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick
const SWAP_CASES: [string, string, ethersBn, ethersBn, ethersBn, ethersBn, ethersBn][] = [
  [
    createAddress("0xc459"),
    createAddress("0x2222"),
    ethersBn.from(100),
    ethersBn.from(200),
    ethersBn.from("80009230423942459000000000000000000"), //not exceeding threshold
    ethersBn.from(1),
    ethersBn.from(1),
  ],
  [
    createAddress("0x5656"),
    createAddress("0x3139"),
    ethersBn.from(2100),
    ethersBn.from(3200),
    ethersBn.from("90009230423942459000000000000000000"), //exceeding threshold
    ethersBn.from(61),
    ethersBn.from(72),
  ],
  [
    createAddress("0x7656"),
    createAddress("0x9139"),
    ethersBn.from(32100),
    ethersBn.from(13200),
    ethersBn.from("92309230423942459000000000000000000"), //exceeding threshold
    ethersBn.from(161),
    ethersBn.from(272),
  ],
  [
    createAddress("0x8886"),
    createAddress("0x9139"),
    ethersBn.from(2103),
    ethersBn.from(3203),
    ethersBn.from("95439230423942459000000000000000000"), //exceeding threshold
    ethersBn.from(961),
    ethersBn.from(872),
  ],
];

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

const testCreateFinding = (
  price: BigNumber,
  spreadThreshold: BigNumber,
  pool: string,
  network: string,
  pair: string,
  isUniswap: boolean
): Finding => {
  if (isUniswap) {
    return Finding.fromObject({
      name: "DAI Price Alert",
      description: `Spread threshold exceeded in ${pair} UniswapV3 pool`,
      alertId: "MK-06",
      protocol: "MakerDAO",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        price: price.toString().slice(0, 6),
        spreadThreshold: spreadThreshold.toString(),
        network,
      },
      addresses: [pool],
    });
  } else {
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
        network,
      },
      addresses: [pool],
    });
  }
};

describe("Apeswap Large LP Deposit/Withdrawal bot test suite", () => {
  const mockGetPoolData = jest.fn();
  const mockFetcher = {
    getPoolData: mockGetPoolData,
  };

  const mockNetworkManager = {
    uniswapV3Factory: createAddress("0xadd0"),
    DAI: createAddress("0xadd9"),
    USDC: createAddress("0xadd2"),
    curve3Pool: createAddress("0xadd3"),
    networkId: 10,
  };

  //token0, token1, fee, valid
  const POOL_CASES: [string, string, ethersBn, boolean] = [
    mockNetworkManager.USDC,
    mockNetworkManager.DAI,
    ethersBn.from(100),
    true,
  ];
  const handleTransaction: HandleTransaction = provideHandleTransaction(
    mockNetworkManager as any,
    mockFetcher as any,
    TEST_SPREAD_THRESHOLD
  );

  beforeEach(() => {
    mockFetcher.getPoolData.mockClear();
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other event logs on Uniswap pools", async () => {
    const pool: string = uniswapPairCreate2(POOL_CASES[0], POOL_CASES[1], POOL_CASES[2], mockNetworkManager as any);

    when(mockGetPoolData)
      .calledWith(4321, pool)
      .mockReturnValue([POOL_CASES[3], POOL_CASES[0], POOL_CASES[1], POOL_CASES[2]]);

    const event = mockIface.getEvent("MockEvent");
    const log = mockIface.encodeEventLog(event, [createAddress("0xc451"), ethersBn.from(2423), ethersBn.from(25423)]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(4321)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
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

  it("should return no findings when the spread threshold is not exceeded in Uniswap Swap events", async () => {
    const pool: string = uniswapPairCreate2(POOL_CASES[0], POOL_CASES[1], POOL_CASES[2], mockNetworkManager as any);
    when(mockGetPoolData)
      .calledWith(41003, pool)
      .mockReturnValue([POOL_CASES[3], POOL_CASES[0], POOL_CASES[1], POOL_CASES[2]]);

    const event = SWAP_IFACE.getEvent("Swap");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(41003)
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[0]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the spread threshold is exceeded in Uniswap Swap events", async () => {
    const pool: string = uniswapPairCreate2(POOL_CASES[0], POOL_CASES[1], POOL_CASES[2], mockNetworkManager as any);
    when(mockGetPoolData)
      .calledWith(124105, pool)
      .mockReturnValue([POOL_CASES[3], POOL_CASES[0], POOL_CASES[1], POOL_CASES[2]]);

    const event = SWAP_IFACE.getEvent("Swap");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(124105)
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[1]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[1][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        "Optimism",
        "USDC/DAI",
        true
      ),
    ]);
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
        "Optimism",
        "USDT/DAI",
        false
      ),
    ]);
  });

  it("should return multiple findings", async () => {
    const pool: string = uniswapPairCreate2(POOL_CASES[0], POOL_CASES[1], POOL_CASES[2], mockNetworkManager as any);
    when(mockGetPoolData)
      .calledWith(224105, pool)
      .mockReturnValue([POOL_CASES[3], POOL_CASES[0], POOL_CASES[1], POOL_CASES[2]]);

    const event = SWAP_IFACE.getEvent("Swap");
    const event2 = TOKEN_EXCHANGE_IFACE.getEvent("TokenExchange");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(224105)
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[2]])
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[3]])
      .addInterfaceEventLog(event2, mockNetworkManager.curve3Pool, [...EXCHANGE_CASES[3]])
      .addInterfaceEventLog(event2, mockNetworkManager.curve3Pool, [...EXCHANGE_CASES[4]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[2][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        "Optimism",
        "USDC/DAI",
        true
      ),
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[3][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        "Optimism",
        "USDC/DAI",
        true
      ),
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[3][2], EXCHANGE_CASES[3][3], EXCHANGE_CASES[3][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "Optimism",
        "USDC/DAI",
        false
      ),
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[4][2], EXCHANGE_CASES[4][3], EXCHANGE_CASES[4][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "Optimism",
        "USDT/DAI",
        false
      ),
    ]);
  });
});
