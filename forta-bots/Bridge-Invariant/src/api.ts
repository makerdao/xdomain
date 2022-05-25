import axios from "axios";

export default class SupplyFercher {
  readonly endpoint: string = "https://api.forta.network/graphql";
  private post: any;

  constructor(post: any = axios.post) {
    this.post = post;
  }

  public async getL2Supply(chainId: number, timestamp: number, fallback: any) {
    let offset: any = undefined;
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
        if (date.valueOf() <= timestamp) {
          return alert.metadata.supply;
        }
      }

      if (alerts.pageInfo.hasNextPage) offset = alerts.pageInfo.endCursor;
      else return fallback;
    }
  }
}

const QUERY: string = `
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

const queryInput = (chainId: number, timestamp: number, after: any = undefined) => {
  const date: Date = new Date(timestamp);
  const [year, month, day] = [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDay()];
  const formatNumber = (num: number) => {
    const str: string = num.toString();
    if (str.length === 1) return `0${str}`;
    return str;
  };
  const formatDate = `${year}-${formatNumber(month)}-${formatNumber(day)}`;
  return {
    input: {
      chainId,
      // bots: [L2-DAI-Monitor-Bot-Hash]
      blockDateRange: {
        startDate: formatDate,
        endDate: formatDate,
      },
      ...after,
    },
  };
};
