## Implementation details

I am using two APIs:

- An API to get me transaction history all EAT.
- API to get me transaction history of individual wallet addresses

In the first API, I am able to get details of all transactions that involve transfer of EAT. From it, I extract out all addresses in the `to` key. This allows me to avoid saving the address of the original minter. Except for the original minter, no address in the `from` section cannot be in `to`, but an address from the `to` sectin may not be in the `from` section, thus focusing on the `to` helps me save all address that are ever involved in the transaction. I save those addresses in a `Set` which helps me avoid saving any duplicates, which I then transfer back into an array.

<!-- Fetch transaction histories of the Edge Activity Token holders -->

Then I iterate through all saved addressese using the second API, getting each addresses transaction histroy. I use this approach to see if an address has done any transaction outside of EAT. If I iterate in a sequential manner, the application takes a lot of time to get all of the data, as it has to go through 232 addresses. With my API keys, I am rate limited to 5 calls per second, so I cannot make all calls in a concurrent manner. Make 3 calls inside a `Promise.all()` is also not feasible because if anyone of the 3 calls is taking a lot of time, it doesn't passon the results of the resolved promisses and starts processing the next 2 api. In my testing, using `Promise.all()` at best would complete the results in 1 minute and 15 seconds.

I then looked towards implementing an async request queue. The idea was to run 3 api at the same time and if anyone of them is resolved, then trigger the next api. This significantly speed up the performance.

With both `Promise.all()` and async request queue, I noticed that I was hitting the rate limiter from time to time. With async request queue it was less request compared to `Promise.all()`, but still present. I was able to detect this because a lot of addresses would have transaction count of 22. Upon further investigation the rate limiter was apparent. To resolve this issue I made a recursive call: when I would get hit with the rate limiter, I would make the api call again. This is a brute force approach as we are spamming the endpoint, but it resovled the issue.

After getting the results, I would store and sort out the top 5 wallets with the most transactions. Because I am using an async request queue, I need to make sure that onces all apis were processed only then I would filter the top wallets. For this I resorted to building a function which recursively calls it self with a `setTimeout()` method.

## ChapGPT implementation

After completing the task, I gave chat gpt a shot. It produced me a result in which it was only calling the first api and getting number of transactions per wallet address. But the issue with its implementation is that it only focuses on EAT transactions.
