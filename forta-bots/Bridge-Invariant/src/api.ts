import axios from "axios";
import constants from "./constants";

const FORTA_API: string = "https://api.forta.network/graphql";

export default class SupplyFetcher {
  readonly endpoint: string;
  private post: any;

  constructor(endpoint: string = FORTA_API, post: any = axios.post) {
    this.post = post;
    this.endpoint = endpoint;
  }

  public async getL2Supply(chainId: number, timestamp: number, fallback: any = undefined) {
    let offset: any = {};
    const milliseconds: number = timestamp * 1000;
    while (true) {
      const { data } = await this.post(
        this.endpoint,
        {
          query: QUERY,
          variables: queryInput(chainId, timestamp, offset),
        },
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      const alerts = data.data.alerts;

      for (let alert of alerts.alerts) {
        const date: Date = new Date(alert.source.block.timestamp);
        if (date.valueOf() <= milliseconds) return alert.metadata.supply;
      }

      if (alerts.pageInfo.hasNextPage) {
        offset = {
          after: {
            ...alerts.pageInfo.endCursor,
          },
        };
      } else return fallback;
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
      source {
        block {
          timestamp
          chainId
        }
      }
      metadata
    }
  }
}`;

const formatDate = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const ORIGIN: string = formatDate(new Date(0));

export const queryInput = (chainId: number, timestamp: number, cursor: any = {}) => {
  const date: string = formatDate(new Date(timestamp * 1000));
  return {
    input: {
      chainId,
      bots: [constants.L2_MONITOR_HASH],
      blockDateRange: {
        startDate: ORIGIN,
        endDate: date,
      },
      ...cursor,
    },
  };
};
