import { writeFileSync } from "fs";
import { AsyncRequestQueue } from "./AsyncRequestQueue.js";
import { ApiResponse, Transaction } from "./types.js";
const API_URL = "https://api.polygonscan.com/api";
const API_KEY = "ISSQBPBPUMPKJR6VTH864K7FUA6XDV3VK3";
const TOKEN_ADDRESS = "0x7C58D971A5dAbd46BC85e81fDAE87b511431452E";
let counter = 0;
let maxCount = -1;

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

function getAddressTransactionsNumberFactory(
  address: string,
  transactions: Transaction[],
) {
  return async () => {
    const response = await fetch(
      `${API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`,
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error at address:::", address, "---", err);
      });

    if (typeof response.result === "string") {
      getAddressTransactionsNumberFactory(address, transactions)();
    } else {
      // map.set(address, response.result.length);
      transactions.push({
        address,
        count: response.result.length,
      });
      counter++;
      return response;
    }
  };
}

function waitForCompletion(transaction: Transaction[], interval: number) {
  if (counter >= maxCount) {
    const wallets = mostActiveWallets(transaction); // Execute action if condition is true
    writeFileSync(
      "./result.txt",
      `Top wallet addresses\t\t\t\t\t\t\t\t\t\t\t\t\tTransaction count\n1. ${wallets[0].address}\t${wallets[0].count}\n2. ${wallets[1].address}\t${wallets[1].count}\n3. ${wallets[2].address}\t${wallets[2].count}\n4. ${wallets[3].address}\t${wallets[3].count}\n5. ${wallets[4].address}\t${wallets[4].count}`,
    );
    process.exit(0);
  } else {
    // If condition is false, schedule another check after interval
    setTimeout(() => {
      waitForCompletion(transaction, interval); // Recursive call
    }, interval);
  }
}

function mostActiveWallets(transactions: Transaction[]): Transaction[] {
  if (transactions.length <= 5) {
    return transactions;
  }

  const topWallets = new Array<Transaction>(5);
  for (let i = 0; i < transactions.length; i++) {
    if (!topWallets[0]) {
      topWallets[0] = transactions[i];
    } else if (transactions[i].count > topWallets[0].count) {
      topWallets[1] = topWallets[0];
      topWallets[0] = transactions[i];
    } else if (!topWallets[1]) {
      topWallets[1] = transactions[i];
    } else if (transactions[i].count > topWallets[1].count) {
      topWallets[2] = topWallets[1];
      topWallets[1] = transactions[i];
    } else if (!topWallets[2]) {
      topWallets[1] = transactions[i];
    } else if (transactions[i].count > topWallets[2].count) {
      topWallets[3] = topWallets[2];
      topWallets[2] = transactions[i];
    } else if (!topWallets[3]) {
      topWallets[1] = transactions[i];
    } else if (transactions[i].count > topWallets[3].count) {
      topWallets[4] = topWallets[3];
      topWallets[3] = transactions[i];
    } else if (!topWallets[4]) {
      topWallets[1] = transactions[i];
    } else if (transactions[i].count > topWallets[4].count) {
      topWallets[4] = transactions[i];
    }
  }
  return topWallets;
}

function main() {
  const transactions: Transaction[] = [];
  fetchTransactionHistories().then(async (response) => {
    const addresses: string[] = getAddresses(response.result);
    maxCount = addresses.length - 1;
    const queue = new AsyncRequestQueue();
    for (let i = 0; i < addresses.length; i++) {
      queue.enqueue(
        getAddressTransactionsNumberFactory(addresses[i], transactions),
      );
    }
    waitForCompletion(transactions, 3000);
  });
}

main();
