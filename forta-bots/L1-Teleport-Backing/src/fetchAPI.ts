import { ApolloClient, gql, InMemoryCache, HttpLink } from "@apollo/client/core";
import fetch from "cross-fetch";
import { getEndDate, getStartDate } from "./utils";

const client = new ApolloClient({
  link: new HttpLink({ uri: "https://api.forta.network/graphql", fetch }),
  cache: new InMemoryCache(),
});

export default class Fetcher {
  public async queryFortaAPI(networkId: number, blockTimestamp: number) {
    let hashesArray: string[] = [];
    await client
      .query({
        query: gql`
          query pastAlerts($input: AlertsInput) {
            alerts(input: $input) {
              # pageInfo {
              #   hasNextPage
              #   endCursor {
              #     alertId
              #     blockNumber
              #   }
              # }
              alerts {
                name
                protocol
                metadata
              }
            }
          }
        `,
        variables: {
          input: {
            //first: 4,
            bots: ["0xa10d43a54a1b19346ba4ba117f3401d5931c14f161fa7d998b8c7d6d6b13a35e"],
            chainId: networkId,
            //   blockSortDirection: "asc",
            blockDateRange: {
              startDate: getStartDate(blockTimestamp),
              endDate: getEndDate(blockTimestamp),
            },
          },
        },
      })
      .then((result) => {
        let fetchSet: Set<string> = new Set<string>();

        for (let alert of result.data.alerts.alerts) {
          fetchSet.add(alert.metadata);
        }

        fetchSet.forEach((fetch) => {
          hashesArray.push(...Object.values(fetch));
        });
      });

    return hashesArray;
  }
}
