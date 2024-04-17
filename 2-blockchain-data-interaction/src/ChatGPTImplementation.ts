// Importing necessary libraries
import axios from "axios";

// Function to fetch transaction histories of EAT holders
async function fetchTransactionHistories() {
  try {
    const response = await axios.get("https://api.polygonscan.com/api", {
      params: {
        module: "account",
        action: "tokentx",
        contractaddress: "0x7C58D971A5dAbd46BC85e81fDAE87b511431452E", // Edge Activity Token contract address
        startblock: 0,
        endblock: 99999999,
        sort: "asc",
        apikey: "ISSQBPBPUMPKJR6VTH864K7FUA6XDV3VK3",
      },
    });
    return response.data.result;
  } catch (error) {
    console.error("Error fetching transaction histories:", error);
    throw error;
  }
}

// Function to analyze transaction data and identify top 5 most active wallets
function analyzeTransactionData(transactions) {
  const transactionCounts = {};

  // Count transactions for each wallet address
  transactions.forEach((transaction) => {
    if (transaction.to !== "0x0000000000000000000000000000000000000000") {
      // Exclude contract creator
      transactionCounts[transaction.to] =
        (transactionCounts[transaction.to] || 0) + 1;
    }
    if (transaction.from !== "0x0000000000000000000000000000000000000000") {
      // Exclude contract creator
      transactionCounts[transaction.from] =
        (transactionCounts[transaction.from] || 0) + 1;
    }
  });

  // Sort wallet addresses based on transaction count
  const sortedWallets = Object.keys(transactionCounts).sort(
    (a, b) => transactionCounts[b] - transactionCounts[a],
  );

  // Extract top 5 most active wallets
  const top5Wallets = sortedWallets.slice(0, 5);

  return top5Wallets.map((wallet) => ({
    address: wallet,
    transactionCount: transactionCounts[wallet],
  }));
}

// Function to summarize data in a human-readable format
function summarizeData(topWallets) {
  console.log("Top 5 Most Active Wallets:");
  topWallets.forEach((wallet, index) => {
    console.log(
      `${index + 1}. Address: ${wallet.address}, Transaction Count: ${
        wallet.transactionCount
      }`,
    );
  });
}

// Main function
async function main() {
  try {
    // Fetch transaction histories
    const transactions = await fetchTransactionHistories();

    // Analyze transaction data
    const topWallets = analyzeTransactionData(transactions);

    // Summarize data
    summarizeData(topWallets);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Call the main function
main();
