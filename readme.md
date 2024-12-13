# [node-ip-collection](https://www.npmjs.com/package/node-ip-collection)
⭐ fast search ip in range collection ipv4 and ipv6 (it is based on nesting Trie)
* support range format:
1) ip CIDR range: 5.151.236.0/23
2) ip-ip range string: 103.18.156.0-103.18.157.255
3) ip-ip range bigint: 42540528726795050063891204319802818560-42540528806023212578155541913346768895 or 2548867325-2548867326

# base usage
```js
const IpCollection = new require('node-ip-collection');
const ip = new IpCollection({
  useHash: false,     // default value false
  maxSearch: 70,      // default value 70
});

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
| method                                 | description                             |
|:---------------------------------------|:----------------------------------------|
| castIpV6ToNum(ip)                      | convert ipv6 to bingint string          |
| castIpV4ToNum(ip)                      | convert ipv4 to bingint string          |
| castBigIntIpToV4Str(ip)                | convert bigint to ipv4 string           |
| castBigIntIpToV6Str(ip)                | convert bigint to ipv6 string           |
| loadFromString(rangeList, value)       | load data to database                   |
| loadFromString(rangeList, value)       | load data to database                   |
| import(data)                           | import data from result export() method |
| export()                               | export data to json string              |
| insertRange(start, end, ipType, value) | insert range to database                |
| clear()                                | clear all data                          |


# Benchmark maxmind v4 city
full load data ~58sec (yes it’s long, but don’t rush to give up)
```js
await (new Promise((resolve, reject) => {
  fs.createReadStream(__dirname + '/GeoLite2-City-Blocks-IPv4.csv')
  .pipe(csv.parse({headers: true}))
  .on('error', error => console.error(error))
  .on('data', row => {
  	 ip.loadFromString(row.network, row.geoname_id)
  })
  .on('end', () => {
  	resolve();
  })
}));
```
search geoname_id ~0.736ms
```js
console.time('test')
console.log('result', '151.236.160.253', ip.lookup('151.236.160.253', true));
console.timeEnd('test')
```
* is export data to json and load data from json
* full load data ~8sec
* search geoname_id ~0.736ms

## Misc Wiki
* [create detector vpn and bad ip] (https://github.com/sanchezzzhak/node-ip-collection/wiki/Create-detector-vpn-and-bad%E2%80%90ip-by-ip)
