const {Address6, Address4} = require('ip-address');

const IPV4_SPLIT = 2;
const IPV6_SPLIT = 2;

const IP_V4 = 'v4';
const IP_V6 = 'v6';
const IP_UNK = 'unk';

module.exports = class IpCollection {

  dataV4 = {};
  dataV6 = {};

  /**
   * Convert ipv6 to big number
   * @param ip
   * @return {string}
   */
  castIpV6ToNum(ip) {
    return BigInt(new Address6(ip, 8).bigInteger()).toString();
  }

  /**
   * Convert ipv4 to big number
   * @param ip
   * @return {string}
   */
  castIpV4ToNum(ip) {
    return new Address4(ip).bigInteger().toString();
  }

  /**
   * Find partition
   * @param keyPath
   * @param collection
   * @private
   * @return {*|null}
   */
  #findPartition(keyPath, collection) {
    if (typeof keyPath == 'string') keyPath = keyPath.split('.');
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
  }

  /**
   * @param {*} ipNum
   * @param {Object[]} collection
   * @param {boolean} all
   * @return {[]}
   * @private
   */
  eachLookup(ipNum, collection, all) {
    let ip = BigInt(ipNum);
    let result = [];
    for (let value in collection)
      for (let i = 0, l = collection[value].length; i < l; i++) {
        let range = collection[value][i];
        let rangeStart = BigInt(range[0]);
        let rangeEnd = BigInt(range[1]);
        let check = ip >= rangeStart && ip <= rangeEnd;

        if (check) {
          result.indexOf(value) === -1 && result.push(value);
          if (!all) {
            return result;
          }
          break;
        }
      }

    return result;
  }

  /**
   * Find ip in range
   * @param {string} rawIp
   * @param {boolean} all
   * @return {[]|*[]}
   */
  lookup(rawIp, all = false) {
    let format = this.formatIP(rawIp);
    let result = [];

    if (format === IP_UNK) {
      return [];
    }

    if (format === IP_V4) {
      let ip = this.castIpV4ToNum(rawIp);
      let path = ip.split('', IPV4_SPLIT);

      let collection = this.#findPartition(path, this.dataV4);
      if (collection === null) {
        return [];
      }
      result = this.eachLookup(ip, collection, all);
    }

    if (format === IP_V6) {
      let ip = this.castIpV6ToNum(rawIp);
      let path = ip.split('', IPV6_SPLIT);
      let collection = this.#findPartition(path, this.dataV6);
      if (collection === null) {
        return [];
      }
      result = this.eachLookup(ip, collection, all);
    }

    return result;
  }

  /**
   * insert range to object
   * @param {Object} obj
   * @param {string} keyPath
   * @param {*} value
   */
  insert(obj, keyPath, value) {
    if (typeof keyPath == 'string'){
      keyPath = keyPath.split('.');
    }
    const lastKeyIndex = keyPath.length - 1;
    for (let i = 0; i <= lastKeyIndex; ++i) {
      const key = keyPath[i];
      if (obj[key] === void 0) {
        obj[key] = i === lastKeyIndex ? [] : {};
      }
      obj = obj[key];
    }
    obj.push(value);
  }

  /**
   * get format ip name by ip
   * @param ip
   * @returns {string}
   */
  formatIP(ip) {
    if (Address4.isValid(ip)) {
      return IP_V4;
    }
    if (Address6.isValid(ip)) {
      return IP_V6;
    }
    return IP_UNK;
  }

  /**
   * parse ip and insert to a boring collection
   * @param {string} startIp
   * @param {string} endIp
   * @param {string|number} value
   */
  parse(startIp, endIp, value = 0) {
    let format = this.formatIP(startIp);
    if (format === IP_UNK) {
      return;
    }
    if (format === IP_V4) {
      let left = this.castIpV4ToNum(startIp);
      let right = this.castIpV4ToNum(endIp);
      let path = left.split('', IPV4_SPLIT);
      path.push(value);
      this.insert(this.dataV4, path, [left, right]);
      return;
    }
    if (format === IP_V6) {
      let left = this.castIpV6ToNum(startIp);
      let right = this.castIpV6ToNum(endIp);
      let path = left.split('', IPV6_SPLIT);
      path.push(value);
      this.insert(this.dataV6, path, [left, right]);
    }
  }

  /**
   * load ips to database
   * @format
   * ```
   * 1.1.0.1-1.1.0.3
   * 1.1.1.1-1.1.1.4
   * ```
   * @param {string} list
   * @param {string|number} value
   */
  loadFromString(list, value = 0) {
    const data = list.split('\n');
    for (let row of data) {
      if (!row) {
        continue;
      }
      const ipPart = row.split('-');
      ipPart.length === 2 && this.parse(ipPart[0], ipPart[1], value);
    }
  }

  /**
   * clear collections
   */
  clear() {
    this.dataV4 = {};
    this.dataV6 = {};
  }

}
