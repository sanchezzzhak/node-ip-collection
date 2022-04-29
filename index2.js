const IpCollection = require('./ip-collection.js');
const {Address6, Address4} = require('ip-address');
const {
  extractKeyCurrent,
  binarySearch,
  ipNum,
  getIpFormat,
} = require('./utils');


const IPV6_MAX = '2001:0db8:0000:0000:0000:ff00:0042:8329';
const IPV4_MAX = '255.255.255.255';

let address1 = new Address4(IPV4_MAX)
console.log('ipv4', address1.parsedAddress.map(d => parseInt(d, 10)))
let address2 = new Address6(IPV6_MAX)
console.log('ipv6', address2.decimal().split(':').map(d => parseInt(d, 10)))

let treeData = {

};

const insertPartition = (collection, keyPath, value) => {
  if (typeof keyPath === 'string') keyPath = keyPath.split('.');
  let lastKeyIndex = keyPath.length - 1;
  for (let i = 0; i <= lastKeyIndex; ++i) {
    let key = keyPath[i];
    if (collection[key] === void 0) {
      collection[key] = i === lastKeyIndex ? [] : {};
    }
    collection = collection[key];
  }
  collection.push(value);
};

//https://proxylist.geonode.com/api/proxy-list?limit=50&page=1&sort_by=lastChecked&sort_type=desc

function insetTree(rangeStart, rangeEnd, value) {
  const cast = (ip) => {
    return (new Address6(rangeStart)).decimal().split(':').map(d => parseInt(d, 10));
  }
  //
  if(treeData[addressStart[0]] === void 0) {
    treeData[addressStart[0]]
  }
  
  
  let addressStart = cast(rangeStart);
  let addressEnd = cast(rangeEnd);
  
  
  
  
  treeData.push([
    addressStart, addressEnd, value
  ])
}

insetTree(
  '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  '2001:0db8:85a3:0000:0000:8a2e:0370:7339',
  'test_value'
)
let a = new Address6('2a02:6b8:0:1a00::/56');


insetTree(
  a.startAddress().correctForm(),
  a.endAddress().correctForm(),
  'yandex'
)

console.log(treeData)


function lookup(ip) {
  let address = new Address6(ip);
  let decimalIp = address.decimal().split(':').map(d => parseInt(d, 10));
  for (let i =0, l = treeData.length; i < l; i++) {
    let item = treeData[i];
  }


  
}



/*
function findTree(decimalIp, decimals) {
  let address = new Address6(ip);
  let decimalIp = address.decimal().split(':').map(d => parseInt(d, 10));
  
  let lastCheck = false;
  for (let i = 0; i < 8; i++) {
    let part = decimalIp[i];
    
    if ()
    
    // let lastCheck =
    
  }
}*/



return;



class MainCollection {
  __indexV4 = [];
  __indexV6 = [];
  __cache = false;
  
  get cache() {
    return this.__cache;
  }
  
  set cache(stage) {
    this.__cache = !!stage;
  }
  
  /**
   * generate hash range (to search for a file)
   */
  initMapIndexes() {
    const put = (multiplier, collection) => {
      for (let i = 1n, l = IP_PARTS; i <= l; i++) {
        collection.push(i * multiplier);
      }
    };
    put(PART_V4, this.__indexV4);
    put(PART_V6, this.__indexV6);
  }
  
  constructor() {
    this.initMapIndexes();
    
    console.log('indexv6', this.__indexV4.length);
    console.log('indexv6', this.__indexV6.length);
    
  }
  
  getIpInfo(rawIp) {
    let ipInt = ipNum(rawIp);
    let format = getIpFormat(rawIp);
    let index = binarySearch(
      format === 4 ? this.__indexV4
        : this.__indexV6, ipInt, extractKeyCurrent);
    
    return {ipInt, format, index};
  }
  
  /**
   * Detect ip by collection (main method)
   * @param rawIp
   * @param all
   * @returns {Promise<void>}
   */
  async lookup(rawIp, all = false) {
    let {index, format, ipInt} = this.getIpInfo(rawIp);
    
    console.log(index, format, ipInt);
    console.log(this.__indexV4.length);
    console.log(this.__indexV6.length);
  }
  
}

// test
let m = new MainCollection;

m.lookup('2001:0db8:85a3:0000:0000:8a2e:0370:7339');