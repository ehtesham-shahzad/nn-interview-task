import fs from "node:fs";
import { AsyncRequestQueue } from "./AsyncRequestQueue.js";
import { ApiResponse } from "./types.js";

const API_URL = "https://api.polygonscan.com/api";
const API_KEY = "ISSQBPBPUMPKJR6VTH864K7FUA6XDV3VK3";
const TOKEN_ADDRESS = "0x7C58D971A5dAbd46BC85e81fDAE87b511431452E";

async function fetchTransactionHistories() {
  try {
    const response = await fetch(
      `${API_URL}?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`,
    );
    const json = await response.json();
    return json as ApiResponse;
  } catch (error) {
    console.error("Error fetching transaction histories:", error);
  }
}

function getAddresses(results: ApiResponse["result"]): string[] {
  const addresses = new Set<string>();
  for (let i = 0; i < results.length; i++) {
    addresses.add(results[i].to);
  }
  return [...addresses];
}

function getAddressTransactionsNumberFactory(address: string) {
  return async () => {
    const response = await fetch(
      `${API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`,
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error at address:::", address, "---", err);
      });
    fs.writeFileSync(
      `./data.txt`,
      `${
        typeof response.result !== "string"
          ? `${address}: ${response.result.length}`
          : `${address}: 0`
      }\n`,
      { flag: "a+" },
    );

    if (typeof response.result === "string") {
      return getAddressTransactionsNumberFactory(address);
    }
    return response;
  };
}

function main() {
  fetchTransactionHistories().then(async (response) => {
    const addresses = getAddresses(response.result);
    const queue = new AsyncRequestQueue();
    for (let i = 0; i < addresses.length; i++) {
      queue.enqueue(getAddressTransactionsNumberFactory(addresses[i]));
    }
  });
}

main();
