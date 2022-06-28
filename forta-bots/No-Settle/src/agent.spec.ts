import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType, ethers } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { resetAllWhenMocks, when } from "jest-when";
import { BigNumber } from "ethers";
import DomainFetcher from "./domain.fetcher";
import { DOMAINS_IFACE } from "./utils";

const TEST_TELEPORT_JOIN = createAddress("0xaaee");
const TEST_TELEPORT_ROUTER = createAddress("0xbbce");

const SETTLE_EVENT_TOPIC: string = "0x792e2de836c3992709fda125a747da218b37de844082962d5612bdf04b418c3a";
const FILE_EVENT_TOPIC: string = "0x4ff2caaa972a7c6629ea01fae9c93d73cc307d13ea4c369f9bbbb7f9b7e9461d";

const TEST_DAYS_THRESHOLD: number = 5;

const TEST_NUM_DOMAINS: BigNumber = BigNumber.from(3);
const TEST_DOMAINS: string[] = [keccak256("dom0"), keccak256("dom1"), keccak256("dom2")];

const testCreateFinding = (
  threshold: number,
  domain: string,
  currentBlockTimestamp: string,
  latestSettleTimestamp: string | any = undefined
): Finding => {
  return Finding.fromObject({
    name: "MakerDAO No Settle monitor",
    description: `No Settle event emitted from TeleportJoin for ${threshold} days`,
    alertId: "MK-04",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      domain,
      currentBlockTimestamp,
      latestSettleTimestamp,
    },
  });
};

describe("No-settle monitoring bot test suite", () => {
  const mockProvider = new MockEthersProvider();
  const mockFetcher = new DomainFetcher(mockProvider as any);
  const addCallToNumDomains = (router: string, block: number | string, numDomains: BigNumber) => {
    mockProvider.addCallTo(router, block, DOMAINS_IFACE, "numDomains", {
      inputs: [],
      outputs: [numDomains],
    });
  };
  const addCallToDomainAt = (router: string, block: number | string, index: number, domain: string) => {
    mockProvider.addCallTo(router, block, DOMAINS_IFACE, "domainAt", {
      inputs: [index],
      outputs: [domain],
    });
  };

  let handleBlock: HandleBlock;
  const mockNetworkManager = {
    TeleportJoin: TEST_TELEPORT_JOIN,
    TeleportRouter: TEST_TELEPORT_ROUTER,
  };

  beforeEach(() => {
    mockProvider.clear();
    resetAllWhenMocks();
    handleBlock = provideHandleBlock(
      mockNetworkManager as any,
      mockProvider as unknown as ethers.providers.Provider,
      TEST_DAYS_THRESHOLD,
      mockFetcher as any,
      false
    );
  });

  it("should return a finding when there were no recent past Settle events on the first run", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(142342342)
      .setNumber(3456)
      .setHash(keccak256("fefsd"));

    addCallToNumDomains(mockNetworkManager.TeleportRouter, 3456, TEST_NUM_DOMAINS);

    for (let i = 0; i < TEST_NUM_DOMAINS.toNumber(); i++) {
      addCallToDomainAt(mockNetworkManager.TeleportRouter, 3456, i, TEST_DOMAINS[i]);
    }

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(TEST_DAYS_THRESHOLD, TEST_DOMAINS[0], "142342342"),
      testCreateFinding(TEST_DAYS_THRESHOLD, TEST_DOMAINS[1], "142342342"),
      testCreateFinding(TEST_DAYS_THRESHOLD, TEST_DOMAINS[2], "142342342"),
    ]);
  });

  it("should return no findings if there was a recent past Settle event on the first run", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(1422500)
      .setNumber(200)
      .setHash(keccak256("fefsd"));

    addCallToNumDomains(mockNetworkManager.TeleportRouter, 200, TEST_NUM_DOMAINS);

    for (let i = 0; i < TEST_NUM_DOMAINS.toNumber(); i++) {
      addCallToDomainAt(mockNetworkManager.TeleportRouter, 200, i, TEST_DOMAINS[i]);
    }

    const logs0 = [
      {
        blockNumber: 196,
        address: mockNetworkManager.TeleportJoin,
        topics: [SETTLE_EVENT_TOPIC, TEST_DOMAINS[0]],
      },
      {
        blockNumber: 197,
        address: mockNetworkManager.TeleportJoin,
        topics: [SETTLE_EVENT_TOPIC, TEST_DOMAINS[1]],
      },
      {
        blockNumber: 198,
        address: mockNetworkManager.TeleportJoin,
        topics: [SETTLE_EVENT_TOPIC, TEST_DOMAINS[2]],
      },
    ] as ethers.providers.Log[];

    when(mockProvider.getBlock)
      .calledWith(196)
      .mockReturnValue({ timestamp: 1380000 })
      .calledWith(197)
      .mockReturnValue({ timestamp: 1390000 })
      .calledWith(198)
      .mockReturnValue({ timestamp: 1400000 });

    mockProvider.addLogs(logs0);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return findings for the correct domain and only if the threshold is exceeded", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(2500).setNumber(6999).setHash(keccak256("fefsd"));

    addCallToNumDomains(mockNetworkManager.TeleportRouter, 6999, TEST_NUM_DOMAINS);

    for (let i = 0; i < TEST_NUM_DOMAINS.toNumber(); i++) {
      addCallToDomainAt(mockNetworkManager.TeleportRouter, 6999, i, TEST_DOMAINS[i]);
    }

    //domain0 log
    const logs00 = [
      {
        blockNumber: 6998,
        address: mockNetworkManager.TeleportJoin,
        topics: [SETTLE_EVENT_TOPIC, TEST_DOMAINS[0]],
      },
    ] as ethers.providers.Log[];

    when(mockProvider.getBlock).calledWith(6998).mockReturnValue({ timestamp: 2450 });

    mockProvider.addLogs(logs00);

    await handleBlock(blockEvent);

    // threshold not exceeded
    const blockEvent1: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash3"))
      .setTimestamp(86400)
      .setNumber(7000);

    //domain2 log
    const logs = [
      {
        blockNumber: 7000,
        blockHash: blockEvent1.blockHash,
        address: mockNetworkManager.TeleportJoin,
        topics: [SETTLE_EVENT_TOPIC, TEST_DOMAINS[2]],
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);

    // threshold exceeded
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash51"))
      .setTimestamp(4286500)
      .setNumber(7001);

    // threshold not exceeded
    const blockEvent3: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash25"))
      .setTimestamp(4289999)
      .setNumber(7002);

    const findings = await handleBlock(blockEvent1);
    expect(findings).toStrictEqual([]);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([
      testCreateFinding(TEST_DAYS_THRESHOLD, TEST_DOMAINS[0], "4286500", "2450"),
      testCreateFinding(TEST_DAYS_THRESHOLD, TEST_DOMAINS[1], "4286500"),
      testCreateFinding(TEST_DAYS_THRESHOLD, TEST_DOMAINS[2], "4286500", "86400"),
    ]);
    const findings3 = await handleBlock(blockEvent3);
    expect(findings3).toStrictEqual([]);
  });

  it("should handle domains and create findings correctly when a File event is emitted", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(2500).setNumber(6999).setHash(keccak256("fefsd"));

    addCallToNumDomains(mockNetworkManager.TeleportRouter, 6999, TEST_NUM_DOMAINS);

    for (let i = 0; i < TEST_NUM_DOMAINS.toNumber(); i++) {
      addCallToDomainAt(mockNetworkManager.TeleportRouter, 6999, i, TEST_DOMAINS[i]);
    }

    //domain0 log
    const logs00 = [
      {
        blockNumber: 6998,
        blockHash: blockEvent.blockHash,
        address: mockNetworkManager.TeleportJoin,
        topics: [SETTLE_EVENT_TOPIC, TEST_DOMAINS[0]],
      },
    ] as ethers.providers.Log[];

    when(mockProvider.getBlock).calledWith(6998).mockReturnValue({ timestamp: 2450 });

    mockProvider.addLogs(logs00);
    await handleBlock(blockEvent);

    // threshold not exceeded & File event emitted
    const blockEvent1: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash3"))
      .setTimestamp(86400)
      .setNumber(7000);

    //new domain
    addCallToNumDomains(mockNetworkManager.TeleportRouter, 7000, BigNumber.from(1));
    addCallToDomainAt(mockNetworkManager.TeleportRouter, 7000, 0, keccak256("newAndOnlyDomain"));

    const fileLog = [
      {
        blockNumber: 7000,
        blockHash: blockEvent1.blockHash,
        address: mockNetworkManager.TeleportRouter,
        data: keccak256("dataData2"),
        topics: [FILE_EVENT_TOPIC],
      },
    ] as ethers.providers.Log[];
    mockProvider.addLogs(fileLog);

    // threshold exceeded
    const blockEvent2: BlockEvent = new TestBlockEvent().setTimestamp(4286500).setNumber(7001);

    const findings = await handleBlock(blockEvent1);
    expect(findings).toStrictEqual([]);

    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, keccak256("newAndOnlyDomain"), "4286500")]);
  });
});
