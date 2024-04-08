## Visualizing token holder geographic distribution

Originally I was searching for APIs on [polygonscan.com](https://docs.polygonscan.com/). But I was unable to find any relevant APIs that could get me list of transactions or list of account holders for Edge Activity Token. Then I searched on another platform: [CovalentHq](https://www.covalenthq.com/). There I was able to find an API which returned a list of token holders along with how many tokens they have, but this API didn't contain any result related to geographic location (such as logitude - latitude, IP address, or country of origin).

Lastly, I tried searching for any other APIs that could retrieve this result, but couldn't come across any. I even tried going through APIs that returned logs for events by contract address, hoping to find some additional information related to geographic location in the logs, but couldn't find any meaningful results.

Reading up online (and on ChatGPT) for such APIs, the most common answer I come across is that storing any sort of geographic information for token holders is a privacy conern and is less likely to be stored on the blockchain network.
