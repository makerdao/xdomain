import axios from "axios";
import { BOT_ID, getEndDate } from "./utils";

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
        if (Object.values(alert.metadata).includes(hash)) {
          return true;
        }
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
      bots: [BOT_ID],
      chainId: networkId,
      blockDateRange: {
        startDate: "2021-01-01",
        endDate: getEndDate(blockTimestamp),
      },
      ...after,
    },
  };
};
