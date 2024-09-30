# [node-ip-collection](https://www.npmjs.com/package/node-ip-collection)
⭐ fast search ip in range collection ipv4 and ipv6

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


# Misc Wiki
* [create detector vpn and bad ip] (/create-detector-vpn-and-bad-ip-by-ip)
