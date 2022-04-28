const AbstractIpCollection = require('./abstract-ip-collection');
const crypto = require('crypto');

const IPV4_SPLIT = 2;
const IPV6_SPLIT = 2;

const IPV6 = 'v6';
const IPV4 = 'v4';

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

const findPartition = (keyPath, collection) => {
  if (typeof keyPath === 'string') keyPath = keyPath.split('.');
  let current = collection[keyPath[0]];
  if (current === void 0) {
    return null;
  }
  let lastKeyIndex = keyPath.length - 1;
  for (let i = 1; i <= lastKeyIndex; ++i) {
    let key = keyPath[i];
    if (current[key] === void 0) {
      return null;
    }
    current = current[key];
  }
  return current;
};

class IpCollection extends AbstractIpCollection {
  
  #__dataV4 = {};
  #__dataV6 = {};
  #__dataHash = {};
  
  
  /**
   * Private looking for IP in collection
   *
   * @param {*} ipNum
   * @param {Object[]} collection
   * @param {boolean }all
   * @returns {[]}
   * @private
   */
  __eachLookup(ipNum, collection, all) {
    let ip = BigInt(ipNum);
    let result = [];
    for (let hash in collection)
      for (let i = 0, l = collection[hash].length; i < l; i++) {
        let range = collection[hash][i];
        let rangeStart = BigInt(range[0]);
        let rangeEnd = BigInt(range[1]);
        let check = ip >= rangeStart && ip <= rangeEnd;
        if (check) {
          let value = this.#__dataHash[hash] ?? null;
          !result.includes(value) && result.push(value);
          if (!all) {
            return result;
          }
          break;
        }
      }
    
    return result;
  }
  
  /**
   * find ip in range
   * @param rawIp
   * @param all
   * @returns {[]|*[]}
   */
  lookup(rawIp, all = false) {
    let format = this.formatIP(rawIp);
    let result = [];
    
    if (format === 'unk') {
      return [];
    }
    
    if (format === IPV4) {
      let ip = this.castIpV4ToNum(rawIp);
      let path = String(ip).split('', IPV4_SPLIT);
      let collection = findPartition(path, this.#__dataV4);
      if (collection === null) {
        return [];
      }
      result = this.__eachLookup(ip, collection, all);
    }
    
    if (format === IPV6) {
      let ip = this.castIpV6ToNum(rawIp);
      let path = String(ip).split('', IPV6_SPLIT);
      let collection = findPartition(path, this.#__dataV6);
      if (collection === null) {
        return [];
      }
      result = this.__eachLookup(ip, collection, all);
    }
    
    return result;
  }
  
  /**
   * parse ip and insert to a boring collection
   *
   * @param startIp
   * @param endIp
   * @param value
   */
  __insert(startIp, endIp, value = 0) {
    
    let format = this.formatIP(startIp);
    if (format === 'unk') {
      return;
    }
    
    if (format === IPV4) {
      let left = this.castIpV4ToNum(startIp);
      let right = this.castIpV4ToNum(endIp);
      let path = String(left).split('', IPV4_SPLIT);
      path.push(String(value));
      insertPartition(this.#__dataV4, path, [left, right]);
    }
    
    if (format === IPV6) {
      let left = this.castIpV6ToNum(startIp);
      let right = this.castIpV6ToNum(endIp);
      let path = String(left).split('', IPV6_SPLIT);
      path.push(String(value));
      insertPartition(this.#__dataV6, path, [left, right]);
    }
  }
  
  /**
   * load ips to database
   * @param list
   * @param value
   */
  loadFromString(list, value = 0) {
    list = list.split('\n');
    
    let hash = crypto.createHash('md5').
    update(JSON.stringify(value)).
    digest('hex');
    
    this.#__dataHash[hash] = value;
    
    for (let row of list) {
      if (!row) {
        continue;
      }
      let ipPart = row.split('-').map(v => v.trim());
      ipPart.length === 2 && this.__insert(ipPart[0], ipPart[1], hash);
    }
  }
  
  /**
   * clear collections
   */
  clear() {
    this.#__dataV4 = {};
    this.#__dataV6 = {};
    this.#__dataHash = {};
  }
}

module.exports = IpCollection;
