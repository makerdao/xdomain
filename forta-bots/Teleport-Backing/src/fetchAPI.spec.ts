import Fetcher, { QUERY, queryInput } from "./fetchAPI";
import { when, resetAllWhenMocks } from "jest-when";
import { keccak256 } from "forta-agent";

describe("Forta API fetcher tests", () => {
  const mockPost = jest.fn();
  const endpoint: string = "testEndpoint";
  const fetcher: Fetcher = new Fetcher(endpoint, mockPost);

  const buildResponse = (alertsData: string[], hasNextPage: boolean = false, cursor: any = undefined) => {
    return {
      data: {
        data: {
          alerts: {
            pageInfo: {
              hasNextPage,
              ...cursor,
            },
            alerts: alertsData.map((x) => {
              return {
                metadata: {
                  0: x,
                },
              };
            }),
          },
        },
      },
    };
  };

  const prepareMock = (
    chainId: number,
    timestamp: number,
    hash: string[],
    after: any = undefined,
    hasNextPage: boolean = false,
    cursor: any = undefined
  ) => {
    when(mockPost)
      .calledWith(
        endpoint,
        expect.objectContaining({
          query: QUERY,
          variables: queryInput(chainId, timestamp, after),
        }),
        expect.objectContaining({
          headers: {
            "content-type": "application/json",
          },
        })
      )
      .mockReturnValueOnce(buildResponse(hash, hasNextPage, cursor));
  };

  beforeEach(() => resetAllWhenMocks());

  it("should set different endpoints", () => {
    for (let i = 0; i < 10; ++i) {
      const fetcher: Fetcher = new Fetcher(i.toString());
      expect(fetcher.endpoint).toStrictEqual(i.toString());
    }
  });

  it("should get the alerts correctly", async () => {
    prepareMock(1, 3, [keccak256("test1")]);
    const hashGUIDexists1: boolean = await fetcher.L2HashGUIDExists(1, 3, keccak256("test1"));
    expect(hashGUIDexists1).toStrictEqual(true);

    prepareMock(1, 3, [keccak256("test2")]);
    const hashGUIDexists2: boolean = await fetcher.L2HashGUIDExists(1, 3, keccak256("test2"));
    expect(hashGUIDexists2).toStrictEqual(true);

    prepareMock(2, 3, [keccak256("test3")]);
    const hashGUIDexists3: boolean = await fetcher.L2HashGUIDExists(2, 3, keccak256("test3"));
    expect(hashGUIDexists3).toStrictEqual(true);

    prepareMock(2, 4, [keccak256("test3")]);
    const hashGUIDexists4: boolean = await fetcher.L2HashGUIDExists(2, 4, keccak256("test3"));
    expect(hashGUIDexists4).toStrictEqual(true);

    prepareMock(2, 4, [keccak256("test4")]);
    const hashGUIDexists5: boolean = await fetcher.L2HashGUIDExists(2, 4, keccak256("testNOT4"));
    expect(hashGUIDexists5).toStrictEqual(false);
  });

  it("should return correct values when multiple hashes are included in the alerts", async () => {
    prepareMock(22, 65, [
      keccak256("test3"),
      keccak256("test4"),
      keccak256("test5"),
      keccak256("test6"),
      keccak256("test7"),
      keccak256("test8"),
      keccak256("test9"),
    ]);

    const hashGUIDexists1: boolean = await fetcher.L2HashGUIDExists(22, 65, keccak256("test7"));
    expect(hashGUIDexists1).toStrictEqual(true);
  });

  it("should scan multiple pages and get the alerts correctly", async () => {
    const offset0 = {
      alertId: "alert0",
      blockNumber: 0,
    };
    const offset1 = {
      alertId: "alert1",
      blockNumber: 1,
    };
    const offset2 = {
      alertId: "alert2",
      blockNumber: 2,
    };
    prepareMock(10, 20, [keccak256("test22")], {}, true, { endCursor: offset0 });
    prepareMock(10, 20, [keccak256("test22")], { after: offset0 }, true, { endCursor: offset1 });
    prepareMock(10, 20, [keccak256("test22")], { after: offset1 }, true, { endCursor: offset2 });
    prepareMock(10, 20, [keccak256("test22")], { after: offset2 });

    const hashGUIDexists1: boolean = await fetcher.L2HashGUIDExists(10, 20, keccak256("test22"));
    expect(hashGUIDexists1).toStrictEqual(true);
  });
});
