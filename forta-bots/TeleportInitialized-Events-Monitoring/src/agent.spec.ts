import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType, ethers } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { utils } from "ethers";

const TEST_L2_TELEPORT_GATEWAY = createAddress("0xaaee");
const TEST_DEPLOYMENT_BLOCK = 423;
const TELEPORT_INITIALIZED_EVENT_TOPIC: string = "0x46d7dfb96bf7f7e8bb35ab641ff4632753a1411e3c8b30bec93e045e22f576de";

const testCreateFinding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Teleport Initialized",
    description: "TeleportInitialized event emitted from L2TeleportGateway contract",
    alertId: "MK-02",
    protocol: "forta-bots-info",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};

describe("TeleportInitialized events monitoring bot test suite", () => {
  const mockProvider = new MockEthersProvider();
  let handleBlock: HandleBlock;
  let map: Map<string, string> = new Map<string, string>();
  const mockNetworkManager = {
    L2DaiTeleportGateway: TEST_L2_TELEPORT_GATEWAY,
    deploymentBlock: TEST_DEPLOYMENT_BLOCK,
    setNetwork: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
    map.clear();
  });

  it("should return no findings if no TeleportInitialized event is emitted on first run", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, false);

    const blockEvent: BlockEvent = new TestBlockEvent().setHash(keccak256("bH0"));

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no findings if no TeleportInitialized event is emitted", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, true);

    const blockEvent: BlockEvent = new TestBlockEvent().setHash(keccak256("bH1"));

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings correctly on first run", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, false);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(4357);

    const logs0 = [
      {
        blockNumber: 4340,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
      },
      {
        blockNumber: 4355,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData3"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs0);

    const findings: Finding[] = await handleBlock(blockEvent);

    map.set("0", utils.keccak256(logs0[0].data)).set("1", utils.keccak256(logs0[1].data));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });

  it("should return a finding if a TeleportInitialized event is emitted", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, true);
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(3456).setHash(keccak256("bH21"));

    const logs = [
      {
        blockNumber: 3456,
        blockHash: blockEvent.blockHash,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);
    const findings: Finding[] = await handleBlock(blockEvent);

    map.set("0", utils.keccak256(logs[0].data));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });

  it("should return multiple findings for multiple TeleportInitialized events emitted on the same block", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, true);
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(999).setHash(keccak256("bH11"));

    const logs = [
      {
        blockNumber: 999,
        blockHash: blockEvent.blockHash,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData5"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
      },
      {
        blockNumber: 999,
        blockHash: blockEvent.blockHash,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData6"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);
    const findings: Finding[] = await handleBlock(blockEvent);
    map.set("0", utils.keccak256(logs[0].data)).set("1", utils.keccak256(logs[1].data));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });
});
