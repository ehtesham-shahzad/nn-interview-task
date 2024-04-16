import fs from "node:fs";
import { AsyncRequestQueue } from "./AsyncRequestQueue.js";
import { ApiResponse } from "./types.js";

const API_URL = "https://api.polygonscan.com/api";
const API_KEY = "ISSQBPBPUMPKJR6VTH864K7FUA6XDV3VK3";
const tokenAddress = "0x7C58D971A5dAbd46BC85e81fDAE87b511431452E";

async function fetchTransactionHistories() {
  try {
    const response = await fetch(
      `${API_URL}?module=account&action=tokentx&contractaddress=${tokenAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`,
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
        console.log("error at address:::", address);
        console.log(err);
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
      return await getAddressTransactionsNumberFactory(address);
    }
    return response;
  };
}

async function getAddressTransactionsNumber(address: string) {
  const response = await fetch(
    `${API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`,
  )
    .then((res) => res.json())
    .catch((err) => console.log(err));
  fs.writeFileSync(
    `./data.txt`,
    `${
      response.result
        ? `${address}: ${response.result.length}`
        : `${address}: 0`
    }\n`,
    { flag: "a+" },
  );
  return response;
}

function main() {
  console.log("Execution started");
  fetchTransactionHistories().then(async (response) => {
    console.log("Response from fetchTransactionHistories");
    const addresses = getAddresses(response.result);

    // const mod = addresses.length % 5;
    // const limit = addresses.length - mod;
    // console.log("mod:::", mod);
    // console.log("limit:::", limit);
    // console.time("benchmark");
    // for (let i = 4; i < limit; i += 5) {
    //   await Promise.all([
    //     getAddressTransactionsNumber(addresses[i]),
    //     getAddressTransactionsNumber(addresses[i - 1]),
    //     getAddressTransactionsNumber(addresses[i - 2]),
    //     getAddressTransactionsNumber(addresses[i - 3]),
    //     getAddressTransactionsNumber(addresses[i - 4]),
    //   ]);
    //   console.log("i:::", i);
    // }
    // for (let i = limit; i < limit + mod; i++) {
    //   await getAddressTransactionsNumber(addresses[i]);
    //   console.log("i:::", i);
    // }
    // console.timeEnd("benchmark");
    // Executing time is around from 1 min 15

    const queue = new AsyncRequestQueue();
    for (let i = 0; i < addresses.length; i++) {
      queue.enqueue(getAddressTransactionsNumberFactory(addresses[i]));
    }
  });
}

main();
