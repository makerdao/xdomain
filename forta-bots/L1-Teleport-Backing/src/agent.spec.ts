import { Finding, FindingSeverity, FindingType, HandleBlock, HandleTransaction, keccak256 } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { when } from "jest-when";
import { provideHandleTransaction } from "./agent";
import Fetcher from "./fetchAPI";
import { MINT_IFACE } from "./utils";

const testCreateFinding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Wormhole Initialized",
    description: "WormholeInitialized event emitted from L2WormholeGateway contract",
    alertId: "MK-02",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};

describe("WormholeInitialized events monitoring bot test suite", () => {
  const mockNetworkManager = {
    TeleportJoin: createAddress("0x0a"),
    TeleportOracleAuth: createAddress("0x0b"),
    networkId: 0,
  };

  const mockFetcher = {
    queryFortaAPI: jest.fn(),
  };

  const handleTransaction: HandleTransaction = provideHandleTransaction(mockNetworkManager as any, mockFetcher as any);

  // beforeEach(() => {
  //   mockQuery.clear();
  // });

  it("handleTransaction", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1234);
    when(mockFetcher.queryFortaAPI)
      .calledWith(mockNetworkManager.networkId, txEvent.blockNumber)
      .mockReturnValue([keccak256("guid1"), keccak256("guid2")]);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("handleTransaction2", async () => {
    const txEvent = new TestTransactionEvent().setBlock(123);

    when(mockFetcher.queryFortaAPI)
      .calledWith(mockNetworkManager.networkId, txEvent.blockNumber)
      .mockReturnValue([keccak256("guid1"), keccak256("guid2")]);

    const event = MINT_IFACE.getEvent("Mint");
    const log = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid1"),
      [keccak256("sdfsdfsd"), keccak256("sdfsdfd"), keccak256("sdfsdsd"), keccak256("sfsdfsd"), 232, 44, 44],
      23,
      31,
      11,
      mockNetworkManager.TeleportOracleAuth,
    ]);

    txEvent.addAnonymousEventLog(mockNetworkManager.TeleportJoin, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
