import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, keccak256 } from "forta-agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import provideL1HandleBlock from "./L1.backing";
import { Interface } from "@ethersproject/abi";
import { MINT_IFACE } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, AgentConfig } from "./network";

const WRONG_IFACE: Interface = new Interface([
  "event WrongEvent(address indexed originator, bytes32 indexed hashGUID)",
]);

const testCreateFinding = (txHash: string, hashGUID: string, networkId: number): Finding => {
  return Finding.fromObject({
    name: "MakerDAO Teleport Backing Monitor",
    description: "Mint event emitted from TeleportJoin without corresponding TeleportInitialized event",
    alertId: "MK-02-01",
    protocol: "MakerDAO",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      txHash,
      hashGUID,
      chainId: networkId.toString(),
    },
  });
};

describe("L1 Teleport Backing monitoring bot test suite", () => {
  let mockNetworkManager: NetworkManager<NetworkData>;

  const CONFIG: AgentConfig = {
    1: {
      TeleportJoin: createAddress("0x0a"),
      TeleportOracleAuth: createAddress("0x0b"),
    },
  };

  const mockProvider = new MockEthersProvider();
  const mockFetcher = {
    L2HashGUIDExists: jest.fn(),
  };

  let handleBlock: HandleBlock;

  beforeEach(() => {
    mockFetcher.L2HashGUIDExists.mockClear();
    mockNetworkManager = new NetworkManager(CONFIG, 1);
    handleBlock = provideL1HandleBlock(mockNetworkManager, mockFetcher as any, mockProvider as any);
  });

  it("should ignore empty transactions", async () => {
    const blockEvent = new TestBlockEvent();

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events emitted from TeleportJoin contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1234);

    const logs = [
      {
        blockNumber: 1234,
        address: mockNetworkManager.get("TeleportJoin"),
        data: keccak256("data123"),
        topics: [WRONG_IFACE.getEventTopic("WrongEvent")],
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(mockFetcher.L2HashGUIDExists).not.toHaveBeenCalled();
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings when there is a corresponding TeleportInitialized event emitted from L2DaiGateway contract", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(true);
    const event = MINT_IFACE.getEvent("Mint");
    const log = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid1"),
      [keccak256("sdfsdfsd"), keccak256("sdfsdfd"), keccak256("sdfsdsd"), keccak256("sfsdfsd"), 232, 44, 44],
      23,
      31,
      11,
      mockNetworkManager.get("TeleportOracleAuth"),
    ]);

    const logs = [
      {
        blockNumber: 4321,
        address: mockNetworkManager.get("TeleportJoin"),
        ...log,
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);

    const blockEvent = new TestBlockEvent().setTimestamp(21234).setNumber(4321);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(mockFetcher.L2HashGUIDExists).toHaveBeenCalledWith(
      mockNetworkManager.getNetwork(),
      21234,
      keccak256("guid1")
    );
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when there is no corresponding TeleportInitialized event emitted from L2DaiGateway contract", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(false);

    const event = MINT_IFACE.getEvent("Mint");
    const log = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid123"),
      [
        keccak256("aasdfsdfsd"),
        keccak256("bbsdfsdfd"),
        keccak256("ccsdfsdsd"),
        keccak256("ddsfsdfsd"),
        1232,
        484,
        40004,
      ],
      213,
      321,
      141,
      mockNetworkManager.get("TeleportOracleAuth"),
    ]);

    const logs = [
      {
        blockNumber: 8790,
        address: mockNetworkManager.get("TeleportJoin"),
        transactionHash: keccak256("hash"),
        ...log,
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);

    const blockEvent = new TestBlockEvent().setTimestamp(12424).setNumber(8790);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(mockFetcher.L2HashGUIDExists).toBeCalledWith(mockNetworkManager.getNetwork(), 12424, keccak256("guid123"));

    expect(findings).toStrictEqual([
      testCreateFinding(logs[0].transactionHash, keccak256("guid123"), mockNetworkManager.getNetwork()),
    ]);
  });

  it("should return multiple findings when there are no corresponding TeleportInitialized events emitted", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(false).mockReturnValue(false);

    const event = MINT_IFACE.getEvent("Mint");
    const log1 = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid123"),
      [
        keccak256("aasdfsdfsd"),
        keccak256("bbsdfsdfd"),
        keccak256("ccsdfsdsd"),
        keccak256("ddsfsdfsd"),
        1232,
        484,
        40004,
      ],
      213,
      321,
      141,
      mockNetworkManager.get("TeleportOracleAuth"),
    ]);

    const log2 = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid456"),
      [
        keccak256("aasdfsdfsdgg"),
        keccak256("bbsdfsdfdgg"),
        keccak256("ccsdfsdsdgg"),
        keccak256("ddsfsdfsdgg"),
        2232,
        4848,
        400048,
      ],
      2233,
      3221,
      1411,
      mockNetworkManager.get("TeleportOracleAuth"),
    ]);

    const logs = [
      {
        blockNumber: 354353,
        address: mockNetworkManager.get("TeleportJoin"),
        transactionHash: keccak256("hash1"),
        ...log1,
      },
      {
        blockNumber: 354353,
        address: mockNetworkManager.get("TeleportJoin"),
        transactionHash: keccak256("hash2"),
        ...log2,
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);

    const blockEvent = new TestBlockEvent().setNumber(354353).setTimestamp(3322353);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(mockFetcher.L2HashGUIDExists).toBeCalledWith(mockNetworkManager.getNetwork(), 3322353, keccak256("guid123"));
    expect(mockFetcher.L2HashGUIDExists).toBeCalledWith(mockNetworkManager.getNetwork(), 3322353, keccak256("guid456"));

    expect(findings).toStrictEqual([
      testCreateFinding(logs[0].transactionHash, keccak256("guid123"), mockNetworkManager.getNetwork()),
      testCreateFinding(logs[1].transactionHash, keccak256("guid456"), mockNetworkManager.getNetwork()),
    ]);
  });
});
