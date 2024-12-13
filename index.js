const {Address6, Address4} = require('ip-address');
const {Trie} = require('data-structure-typed');

const IP4 = 'v4';
const IP6 = 'v6';
const IP_UNK = 'unk';

const IP4_OFFSET = 3;
const IP6_OFFSET = 14;

class IpCollection {

  constructor(options = {
    useHash: false,
    maxSearch: 70,
    dataV4: [],
    dataV6: [],
    dataValue: {},
    dataRange: {}
  }) {
    this.useHash = options.useHash ?? false;
    this.maxSearch = options.maxSearch ?? 70;
    this.dataV4 = new Trie(options.dataV4 ?? [], {caseSensitive: false});
    this.dataV6 = new Trie(options.dataV6 ?? [], {caseSensitive: false});
    this.dataValue = options.dataValue ?? {};
    this.dataRange = options.dataRange ?? {};
  }

  /**
   * cast ip v6 string to ip bigint string
   * @param {string} ip
   * @return {string}
   */
  castIpV6ToNum(ip) {
    return new Address6(ip, void 0).bigInteger().toString();
  }

  /**
   * cast ip v4 string to ip bigint string
   * @param {string} ip
   * @return {string}
   */
  castIpV4ToNum(ip) {
    return new Address4(ip).bigInteger().toString();
  }

  /**
   * cast bigint to ip v4 string
   * @param {bigint} val
   * @return {String}
   */
  castBigIntIpToV4Str(val) {
    return Address4.fromBigInteger(val).correctForm();
  }

  /**
   * cast bigint to ip v6 string
   * @param {bigint} val
   * @return {String}
   */
  castBigIntIpToV6Str(val) {
    return Address6.fromBigInteger(val).correctForm();
  }

  /**
   * @param {*} ipNum
   * @param {Trie} collection
   * @param {"v6"|"v4"} ipType
   * @param {boolean} all
   * @returns {[]}
   * @private
   */
  #eachLookup(ipNum, collection, ipType, all = true) {
    const ipPart = ipNum.split('');
    const len = ipPart.length;
    const maxOffset = ipType === IP4 ? IP4_OFFSET : IP6_OFFSET;

    // find all prefix numbers
    let matches = [];
    for (let i = 3; i < len; i++) {
      const offset = len - i;
      if (offset === maxOffset) {
        break;
      }
      const str = ipPart.slice(0, offset).join('')
      const words =  collection.getWords(str, this.maxSearch)
      if (words.length > 0) {
        matches.push(...words);
      }
    }

    matches = [...new Set(matches)];

    const ip = BigInt(ipNum);
    const result = [];
    // find entering and getting the result
    // n - end range, i hash index
    loopStart: for (let start of matches) {
      for (let index in this.dataRange[start] ?? []) {
        const record = this.dataRange[start][index];
        const rangeStart = BigInt(start);
        const rangeEnd = BigInt(record.n);
        const check = ip >= rangeStart && ip <= rangeEnd;
        if (check) {
          if (this.useHash) {
            const value = this.dataValue[record.i] ?? '';
            result.push(value);
          } else {
            result.push(record.v ?? '');
          }

          if (!all) {
            break loopStart;
          }
        }
      }
    }

    return result;
  }


  /**
   * find ip in range collection
   * @param {string} ip
   * @param {boolean} all
   * @return {*}
   */
  lookup(ip, all = false) {
    const format = this.formatIP(ip);
    if (format === IP4) {
      return this.#eachLookup(this.castIpV4ToNum(ip), this.dataV4, format, all);
    }
    if (format === IP6) {
      return this.#eachLookup(this.castIpV6ToNum(ip), this.dataV6, format, all);
    }
    return [];
  }

  /**
   * get format ip name by ip
   * @param {string} ip
   * @return {string}
   */
  formatIP(ip) {
    if (Address4.isValid(ip)) {
      return IP4;
    }
    if (Address6.isValid(ip)) {
      return IP6;
    }
    return IP_UNK;
  }

  /**
   * insert range to data
   * @param {string} start         - string bigInt ip range start
   * @param {string} end           - string bigInt ip range end
   * @param {"v4"|"v6"} ipType     - ip type
   * @param {string|number} value
   */
  insertRange(start, end, ipType, value) {
    if (IP6 === ipType) {
      this.dataV6.add(start);
    }
    if (IP4 === ipType) {
      this.dataV4.add(start);
    }
    if (!this.dataRange[start]) {
      this.dataRange[start] = [];
    }

    if (this.useHash) {
      const hash = this.stringHash(value);
      if (!this.dataValue[hash]) {
        this.dataValue[hash] = value;
      }
      this.dataRange[start].push({n: end, i: hash});
    } else {
      this.dataRange[start].push({n: end, v: value});
    }
  }

  /**
   * insert range by Address object to data
   * @param {Address6|Address4} startAddr
   * @param {Address6|Address4} endAddr
   * @param {"v4"|"v6"} ipType
   * @param {string|number} value
   */
  insertRangeAddress(startAddr, endAddr , ipType, value) {
    this.insertRange(
      startAddr.bigInteger().toString(),
      endAddr.bigInteger().toString(), ipType, value
    );
  }
  /**
   * load ips to database
   * format line:
   * 1) ip-ip
   * 2) ip/mask
   * 3) string bigint-string bigint
   * @param listString
   * @param {string|number} value
   */
  loadFromString(listString, value = 0) {
    let list = listString.split('\n');
    for (let i in list) {
      let range = list[i];
      if (!range) {
        continue;
      }
      let ipType = '';
      // is CIDR range
      if (/\/\d+$/.test(range)) {
        ipType = range.split('.').length === 4 ? IP4: IP6;
        let addrCIDR = ipType === IP6 ? new Address6(range) : new Address4(range);
        this.insertRangeAddress(addrCIDR.startAddress(), addrCIDR.endAddress(), ipType, value);
        continue;
      }
      // is range delimiter '-'
      let [startRange, endRange] = range.split('-');
      ipType = startRange.split('.').length === 4 ? IP4: IP6;
      // is range bignumber string
      if (/^\d+$/.test(startRange)) {
        ipType = startRange.length <= 14 ? IP4: IP6;
        this.insertRange(startRange, endRange, ipType, value);
      } else {
        let startAddr = ipType === IP6 ? new Address6(startRange) : new Address4(startRange)
        let endAddr = ipType === IP6 ? new Address6(endRange) : new Address4(endRange)
        this.insertRangeAddress(startAddr, endAddr, ipType, value);
      }
    }
  }

  /**
   * hash big string to number hash
   * @param {string} str
   * @return {number}
   */
  stringHash(str) {
    if (typeof str === 'number') {
      return str;
    }
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i = i + 1) {
      const c = str.charCodeAt(i);
      hash = (((hash << 5) - hash) + c) | 0;
    }
    return hash;
  };

  export() {
    return JSON.stringify({
      dataV6: this.dataV6.toArray(),
      dataV4: this.dataV4.toArray(),
      dataRange: this.dataRange
    })
  }

  import(data) {
    this.clear();
    this.dataV4.addMany(data.dataV4 ?? [])
    this.dataV6.addMany(data.dataV6 ?? [])
    this.dataRange = data.dataRange ?? {};
    this.dataValue = data.dataValue ?? {}
  }

  /**
   * clear all data
   */
  clear() {
    this.dataV4.clear();
    this.dataV6.clear();
    this.dataRange = {};
    this.dataValue = {};
  }

}

module.exports = IpCollection;
