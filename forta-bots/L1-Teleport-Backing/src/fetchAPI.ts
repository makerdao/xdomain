import axios from "axios";
import { getEndDate } from "./utils";

const FORTA_API_ENDPOINT: string = "https://api.forta.network/graphql";

export default class Fetcher {
  readonly endpoint: string;
  private post: any;

  constructor(endpoint: string = FORTA_API_ENDPOINT, post: any = axios.post) {
    this.post = post;
    this.endpoint = endpoint;
  }

  public async L2HashGUIDExists(networkId: number, blockTimestamp: number, hash: string): Promise<boolean> {
    let offset: any = {};
    let hashesArray: string[] = [];

    while (true) {
      const { data } = await this.post(
        this.endpoint,
        {
          query: QUERY,
          variables: queryInput(networkId, blockTimestamp, offset),
        },
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );

      for (let alert of data.data.alerts.alerts) {
        // @ts-ignore
        hashesArray.push(...Object.values(alert.metadata));
      }

      if (hashesArray.includes(hash)) {
        return true;
      }

      if (data.data.alerts.pageInfo.hasNextPage) {
        offset = {
          after: {
            ...data.data.alerts.pageInfo.endCursor,
          },
        };
      } else return false;
    }
  }
}

export const QUERY: string = `
  query pastAlerts($input: AlertsInput) {
      alerts(input: $input) {
        pageInfo {
          hasNextPage
          endCursor {
            alertId
            blockNumber
          }
        }
        alerts {
          metadata
        }
      }
    }
`;

export const queryInput = (networkId: number, blockTimestamp: number, after: any = {}) => {
  return {
    input: {
      first: 10,
      bots: ["0xa10d43a54a1b19346ba4ba117f3401d5931c14f161fa7d998b8c7d6d6b13a35e"],
      chainId: networkId,
      blockDateRange: {
        startDate: "2021-01-01",
        endDate: getEndDate(blockTimestamp),
      },
      ...after,
    },
  };
};
