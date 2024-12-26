# [node-ip-collection](https://www.npmjs.com/package/node-ip-collection)
⭐ fast search ip in range collection ipv4 and ipv6 (it is based on nesting IntervalMultiTree)
* minimal dependencies 
* support range format:
1) ip CIDR range: 5.151.236.0/23
2) ip-ip range string: 103.18.156.0-103.18.157.255
3) ip-ip range bigint: 42540528726795050063891204319802818560-42540528806023212578155541913346768895 or 2548867325-2548867326

# base usage
```js
const IpCollection = new require('node-ip-collection');
const ip = new IpCollection();
// fixture data
const BotSearch = [
  {
    "range": "103.18.156.0-103.18.157.255\n103.18.158.0-103.18.159.255\n103.197.28.0-103.197.29.255",
    "value": "yandex"
  },
  {
    "range": "103.197.30.0-103.197.31.255\n103.199.184.0-103.199.185.255",
    "value": "yandex"
  },
]
// load fixture
for(let index = 0, len = BotSearch.length; i < len; i++) {
  const {range, value} = BotSearch[i];
  ip.loadFromString(range, value);
}
// find ip in range collection
console.log(ip.lookup('103.18.158.1'))
```

# Methods
| method                                                      | description                                   |
|:------------------------------------------------------------|:----------------------------------------------|
| castIpV6ToNum(ipString)                                     | convert ipv6 to bingint string                |
| castIpV4ToNum(ipString)                                     | convert ipv4 to bingint string                |
| castBigIntIpToV4Str(ipBigInt)                               | convert bigint to ipv4 string                 |
| castBigIntIpToV6Str(ipBigInt)                               | convert bigint to ipv6 string                 |
| loadFromString(list, value)                                 | load data to database                         |
| lookup(ip, all)                                             | find range for database                       |
| insertRange(startNumber, endNumber, ipType, value)          | insert range to database                      |
| insertRangeAddress(startAddr, endAddr , ipType, value)      | insert range Address4 or Address6 to database |
| clear()                                                     | clear all data                                |


# Benchmark current test data:
test [benchmark.js](tests%2Fbenchmark.js). database size prefixes: v4: 7800 ranges , v6: 203 ranges
```text
lockup ip: 2.205.41.192 x 450,963 ops/sec ±0.49% (98 runs sampled)
lockup ip: 188.65.247.97 x 241,787 ops/sec ±0.36% (97 runs sampled)
lockup ip: 46.216.70.223 x 359,928 ops/sec ±0.22% (94 runs sampled)
lockup ip: 46.216.70.224 x 357,693 ops/sec ±0.18% (98 runs sampled)
lockup ip: 46.56.157.2 x 378,274 ops/sec ±0.43% (98 runs sampled)
lockup ip: 134.17.140.22 x 382,771 ops/sec ±0.65% (96 runs sampled)
lockup ip: 217.118.78.211 x 297,860 ops/sec ±0.17% (92 runs sampled)
lockup ip: 178.178.81.220 x 367,641 ops/sec ±0.26% (95 runs sampled)
lockup ip: 2a02:d247:5000:: x 64,113 ops/sec ±0.27% (101 runs sampled)
```

## Misc Wiki
* [create detector vpn and bad ip](https://github.com/sanchezzzhak/node-ip-collection/wiki/Create-detector-vpn-and-bad%E2%80%90ip-by-ip)
* [convert ip to integer in php](https://github.com/sanchezzzhak/node-ip-collection/wiki/Convert-ip-to-bigint-in-php)