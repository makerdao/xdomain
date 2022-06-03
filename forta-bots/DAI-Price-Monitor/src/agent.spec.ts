import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideBotHandleTransaction } from "./agent";
import { Interface } from "@ethersproject/abi";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber as ethersBn } from "ethers";
import BigNumber from "bignumber.js";
import { when } from "jest-when";
import { calculateCurvePrice, calculateUniswapPrice, uniswapPairCreate2 } from "./utils";
import { SWAP_IFACE, TOKEN_EXCHANGE_IFACE } from "./abi";

const TEST_SPREAD_THRESHOLD: BigNumber = new BigNumber(0.02); //2%

//sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick
const SWAP_CASES: [string, string, ethersBn, ethersBn, ethersBn, ethersBn, ethersBn][] = [
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
  [createAddress("0xccc"), 0, ethersBn.from(3), 1, ethersBn.from(825523523345999).mul(ethersBn.from(10).pow(12))], //exceeding
  [createAddress("0xddd"), 2, ethersBn.from(4), 0, ethersBn.from(725523523345999).mul(ethersBn.from(10).pow(12))], //exceeding
];

const testCreateFinding = (
  price: BigNumber,
  spreadThreshold: BigNumber,
  pool: string,
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
      },
      addresses: [pool],
    });
  }
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
  const handleTransaction: HandleTransaction = provideBotHandleTransaction(
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

  it("should return multiple findings", async () => {
    const pool: string = uniswapPairCreate2(
      mockNetworkManager.token0,
      mockNetworkManager.token1,
      POOL_CASES[0],
      mockNetworkManager as any
    );

    when(mockGetPoolFee).calledWith(224105, pool).mockReturnValue([POOL_CASES[1], POOL_CASES[0]]);

    const event = SWAP_IFACE.getEvent("Swap");
    const event2 = TOKEN_EXCHANGE_IFACE.getEvent("TokenExchange");
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(224105)
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[0]])
      .addInterfaceEventLog(event, pool, [...SWAP_CASES[1]])
      .addInterfaceEventLog(event2, mockNetworkManager.curve3Pool, [...EXCHANGE_CASES[0]])
      .addInterfaceEventLog(event2, mockNetworkManager.curve3Pool, [...EXCHANGE_CASES[1]]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[0][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        mockNetworkManager.uniswapPair,
        true
      ),
      testCreateFinding(
        calculateUniswapPrice(SWAP_CASES[1][4], mockNetworkManager.networkId),
        TEST_SPREAD_THRESHOLD,
        pool,
        mockNetworkManager.uniswapPair,
        true
      ),
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[0][2], EXCHANGE_CASES[0][3], EXCHANGE_CASES[0][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "USDC/DAI",
        false
      ),
      testCreateFinding(
        calculateCurvePrice(EXCHANGE_CASES[1][2], EXCHANGE_CASES[1][3], EXCHANGE_CASES[1][4]),
        TEST_SPREAD_THRESHOLD,
        mockNetworkManager.curve3Pool,
        "USDT/DAI",
        false
      ),
    ]);
  });
});
