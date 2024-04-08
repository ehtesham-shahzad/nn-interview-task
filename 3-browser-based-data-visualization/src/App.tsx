import { useEffect, useState } from "react";
import "./App.css";
import { Data } from "./types";

export default function App() {
  const tokenId = "0x7C58D971A5dAbd46BC85e81fDAE87b511431452E";
  const key = "cqt_rQp8YqVxwC69xFbKRR7xwHhJBttk";
  const [tokenHolders, setTokenHolders] = useState<Data["data"]["items"]>([]);

  async function getTokenData() {
    let result: Data["data"]["items"] = [];
    let hasMore = true;
    for (let pageNumber = 1; ; pageNumber++) {
      await fetch(
        `https://api.covalenthq.com/v1/137/tokens/${tokenId}/token_holders/?quote-currency=USD&format=JSON&block-height=latest&page-number=${pageNumber}&page-size=500&key=${key}`,
        // `https://api.covalenthq.com/v1/matic-mainnet/events/address/0x7C58D971A5dAbd46BC85e81fDAE87b511431452E/?key=cqt_rQp8YqVxwC69xFbKRR7xwHhJBttk&starting-block=2900000&ending-block=3900000&page-size=100&page-number=0`,
      )
        .then((res) => res.json())
        .then((res: Data) => {
          console.log("pageNumber::: ", pageNumber);
          result = result.concat(res.data.items);
          console.log("result::: ", result);
          hasMore = res.data.pagination.has_more;
          console.log("hasMore::: ", hasMore);
        });

      if (!hasMore) {
        setTokenHolders(result);
        break;
      }
    }
  }

  useEffect(() => {
    getTokenData();
  }, []);

  return (
    <>
      {tokenHolders.length === 0 ? (
        "Loading..."
      ) : (
        <>Total number of token holders/wallets: {tokenHolders.length}</>
      )}
    </>
  );
}
