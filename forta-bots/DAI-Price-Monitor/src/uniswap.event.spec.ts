import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import provideUniswapHandleTransaction from "./uniswap.event";
import { Interface } from "@ethersproject/abi";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber as ethersBn } from "ethers";
import BigNumber from "bignumber.js";
import { when } from "jest-when";
import { calculateUniswapPrice, uniswapPairCreate2 } from "./utils";
import { SWAP_IFACE } from "./abi";

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

const testCreateFinding = (price: BigNumber, spreadThreshold: BigNumber, pool: string, pair: string): Finding => {
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
    },
    addresses: [pool],
  });
};

describe("Apeswap Large LP Deposit/Withdrawal bot test suite", () => {
  const mockGetPoolFee = jest.fn();
  const mockFetcher = {
    getPoolFee: mockGetPoolFee,
  };

  const mockNetworkManager = {
    uniswapV3Factory: createAddress("0xadd0"),
    token0: createAddress("0xadd9"),
    token1: createAddress("0xadd2"),
    uniswapPair: "USDC/DAI",
    curve3Pool: createAddress("0xadd3"),
    networkId: 10,
  };

  //token0, token1, fee, valid
  const POOL_CASES: [ethersBn, boolean] = [ethersBn.from(100), true];

  const handleTransaction: HandleTransaction = provideUniswapHandleTransaction(
    mockNetworkManager as any,
    mockFetcher as any,
    TEST_SPREAD_THRESHOLD
  );

  beforeEach(() => {
    mockFetcher.getPoolFee.mockClear();
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other event logs on Uniswap pools", async () => {
    const pool: string = uniswapPairCreate2(
      mockNetworkManager.token0,
      mockNetworkManager.token1,
      POOL_CASES[0],
      mockNetworkManager as any
    );

    when(mockGetPoolFee).calledWith(4321, pool).mockReturnValue([POOL_CASES[1], POOL_CASES[0]]);

    const event = mockIface.getEvent("MockEvent");
    const log = mockIface.encodeEventLog(event, [createAddress("0xc451"), ethersBn.from(2423), ethersBn.from(25423)]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(4321)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings when the spread threshold is not exceeded in Uniswap Swap events", async () => {
    const pool: string = uniswapPairCreate2(
      mockNetworkManager.token0,
      mockNetworkManager.token1,
      POOL_CASES[0],
      mockNetworkManager as any
    );

    when(mockGetPoolFee).calledWith(41003, pool).mockReturnValue([POOL_CASES[1], POOL_CASES[0]]);

    const event = SWAP_IFACE.getEvent("Swap");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(41003)
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[0]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the spread threshold is exceeded in Uniswap Swap events", async () => {
    const pool: string = uniswapPairCreate2(
      mockNetworkManager.token0,
      mockNetworkManager.token1,
      POOL_CASES[0],
      mockNetworkManager as any
    );

    when(mockGetPoolFee).calledWith(124105, pool).mockReturnValue([POOL_CASES[1], POOL_CASES[0]]);

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
        mockNetworkManager.uniswapPair
      ),
    ]);
  });

  it("should return multiple findings", async () => {
    const pool: string = uniswapPairCreate2(
      mockNetworkManager.token0,
      mockNetworkManager.token1,
      POOL_CASES[0],
      mockNetworkManager as any
    );

    when(mockGetPoolFee).calledWith(224105, pool).mockReturnValue([POOL_CASES[1], POOL_CASES[0]]);

    const event = SWAP_IFACE.getEvent("Swap");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(224105)
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[2]])
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[3]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[2][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        mockNetworkManager.uniswapPair
      ),
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[3][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        mockNetworkManager.uniswapPair
      ),
    ]);
  });
});
