import SupplyFetcher, { QUERY, queryInput } from "./api";
import { when, resetAllWhenMocks } from "jest-when";

describe("SupplyFetcher tests", () => {
  const mockPost = jest.fn();
  const endpoint: string = "forta-test-endpoint";
  const fetcher: SupplyFetcher = new SupplyFetcher(endpoint, mockPost);

  const buildResponse = (
    chainId: number,
    alertsData: [number, string][],
    hasNextPage: boolean = false,
    cursor: any = undefined
  ) => {
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
                source: {
                  block: {
                    chainId,
                    timestamp: new Date(x[0] * 1000).toISOString(),
                  },
                },
                metadata: {
                  supply: x[1],
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
    alerts: [number, string][],
    offset: any = undefined,
    hasNextPage: boolean = false,
    cursor: any = undefined
  ) => {
    when(mockPost)
      .calledWith(
        endpoint,
        expect.objectContaining({
          query: QUERY,
          variables: queryInput(chainId, timestamp, offset),
        }),
        expect.objectContaining({
          headers: {
            "content-type": "application/json",
          },
        })
      )
      .mockReturnValueOnce(buildResponse(chainId, alerts, hasNextPage, cursor));
  };

  beforeEach(() => resetAllWhenMocks());

  it("should set different endpoints", () => {
    for (let i = 0; i < 10; ++i) {
      const supplyFetcher: SupplyFetcher = new SupplyFetcher(i.toString());
      expect(supplyFetcher.endpoint).toStrictEqual(i.toString());
    }
  });

  it("should get the alerts on the first page of alerts", async () => {
    prepareMock(1, 3, [[2, "20"]]);

    const supply: string = await fetcher.getL2Supply(1, 3);
    expect(supply).toStrictEqual("20");
  });

  it("should not find the alert due to timestamp mismatch", async () => {
    prepareMock(3, 10, [[50, "42"]]);

    const supply: string = await fetcher.getL2Supply(3, 10, "failure");
    expect(supply).toStrictEqual("failure");
  });

  it("should not find the alert due to network mismatch", async () => {
    prepareMock(1, 1000, [[10, "1"]]);
    prepareMock(5, 1000, [[2000, "2"]]);

    const supply: string = await fetcher.getL2Supply(5, 1000, "0xfa11");
    expect(supply).toStrictEqual("0xfa11");
  });

  it("should find the alert inside a page containing multiple alerts", async () => {
    prepareMock(10, 5, [
      [10, "1"],
      [9, "2"],
      [8, "3"],
      [7, "4"],
      [6, "5"],
      [5, "6"],
    ]);

    const supply: string = await fetcher.getL2Supply(10, 5);
    expect(supply).toStrictEqual("6");
  });

  it("should scan multiple pages and get the supply", async () => {
    const offset0 = {
      alertId: "alert0",
      blockNumber: 0,
    };
    const offset1 = {
      alertId: "alert1",
      blockNumber: 1,
    };
    prepareMock(10, 20, [[22, "9090"]], {}, true, { endCursor: offset0 });
    prepareMock(10, 20, [[21, "3"]], { after: offset0 }, true, { endCursor: offset1 });
    prepareMock(10, 20, [[15, "1515"]], { after: offset1 });

    const supply: string = await fetcher.getL2Supply(10, 20);
    expect(supply).toStrictEqual("1515");
  });

  it("should scan multiple pages and fail", async () => {
    const offset0 = {
      alertId: "important-alert",
      blockNumber: 42,
    };
    const offset1 = {
      alertId: "not-important-alert",
      blockNumber: 43,
    };
    const offset2 = {
      alertId: "one-more-alert",
      blockNumber: 666,
    };
    prepareMock(42, 10, [[18, "9"]], {}, true, { endCursor: offset0 });
    prepareMock(42, 10, [[11, "31"]], { after: offset0 }, true, { endCursor: offset1 });
    prepareMock(42, 10, [[15, "155"]], { after: offset1 }, true, { endCursor: offset2 });
    prepareMock(42, 10, [[12, "2"]], { after: offset2 });

    const supply: string = await fetcher.getL2Supply(42, 10, "error");
    expect(supply).toStrictEqual("error");
  });
});
