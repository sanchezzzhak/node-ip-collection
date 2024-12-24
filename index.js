const {Address6, Address4} = require('ip-address');
const {Trie, TrieNode} = require('data-structure-typed');
const Timer = require('./utils/timer');

const IP4 = 'v4';
const IP6 = 'v6';
const IP_UNK = 'unk';
const IP4_OFFSET = 2;
const IP6_OFFSET = 2;
const MAX_SEARCH = 1000;
const TRIE_OPTIONS = {caseSensitive: true};

class IpCollection {

  /**
   * @param {IpCollectionOptions} options
   */
  constructor(options = {
    useHash: false,
    maxSearch: MAX_SEARCH,
    dataV4: [],
    dataV6: [],
    dataValue: {},
    dataRange: {},
  }) {

    this.offsetIpV4 = options.offsetIpV4 ?? IP4_OFFSET;
    this.offsetIpV6 = options.offsetIpV6 ?? IP6_OFFSET;
    this.useHash = options.useHash ?? false;
    this.maxSearch = options.maxSearch ?? MAX_SEARCH;
    this.dataV4 = new Trie(options.dataV4 ?? [], TRIE_OPTIONS);
    this.dataV6 = new Trie(options.dataV6 ?? [], TRIE_OPTIONS);
    this.dataValue = options.dataValue ?? {};
    this.dataRange = options.dataRange ?? {};
    this.resultFormat = options.resultFormat ?? 'default';
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
   * @return {string}
   */
  castBigIntIpToV4Str(val) {
    return Address4.fromBigInteger(val).correctForm();
  }

  /**
   * cast bigint to ip v6 string
   * @param {bigint} val
   * @return {string}
   */
  castBigIntIpToV6Str(val) {
    return Address6.fromBigInteger(val).correctForm();
  }

  /**
   * check range for matches words
   * @param {string[]} matches
   * @param {string|bigint}ipNum
   * @param {boolean} all
   * @return {*[]}
   */
  #matchLockup(matches, ipNum,  all = false) {
    const result = [];
    const ip = BigInt(ipNum);
    // find entering and getting the result
    // s - start range, n - end range, i - hash index, v - value
    loopStart: for (let position of matches) {
      for (let index in this.dataRange[position] ?? []) {
        const record = this.dataRange[position][index];
        const rangeStart = record.s ? BigInt(record.s) : BigInt(position);
        const rangeEnd = record.n ? BigInt(record.n) : BigInt(position);
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

    return [...new Set(result)];
  }

  /**
   * @param {IpType} ipType
   * @return {number}
   */
  #getMaxOffsetByType(ipType) {
    return ipType === IP4 ? this.offsetIpV4 : this.offsetIpV6;
  }

  /**
   * @param {string} prefix
   * @param {Trie} collection
   * @param {number} max
   * @return {{found: number, words: string[], inc: number}}
   */
  #getWords(prefix = '', collection, max) {
    const words= [];
    let found = 0;
    let inc = 0;
    let startNode = collection.root;

    /**
     * @param {TrieNode} node
     * @param {string} word
     * @param {number} max
     */
    const dfs = (node, word, max) => {
      for (const char of node.children.keys()) {
        const charNode = node.children.get(char);
        inc++;
        if (charNode !== undefined) {
          dfs(charNode, word.concat(char), max);
        }
      }
      if (node.isEnd) {
        if (found > max - 1) return;
        words.push(word);
        found++;
      }
    }

    if (prefix) {
      for (const c of prefix) {
        const nodeC = startNode.children.get(c);
        if (nodeC) {
          startNode = nodeC;
        } else {
          return {found: 0, inc: 0, words: []};
        }
      }
    }

    if (startNode !== collection.root){
      dfs(startNode, prefix, max);
    }

    return {found, inc, words};
  }

  /**
   * @param {string} ipNum
   * @param {Trie} collection
   * @param {IpType} ipType
   * @param {boolean} all
   * @return {DefaultResult|StatResult}
   * @private
   */
  #eachLookup(ipNum, collection, ipType, all = true) {
    let countWordsIterate = 0;
    let countFound = 0;
    let countIterate = 0;

    const ipPart = ipNum.split('');
    const maxOffset = this.#getMaxOffsetByType(ipType)
    const timer = new Timer();

    let matches = [];
    // is root children not exist result empty
    if (!collection.root.children.has(ipPart[0])) {
      return this.#result({ result: [], time:timer.end()});
    }

    // find all prefix numbers
    for (let i = 3, len = ipPart.length; i < len; i++, countIterate++) {
      const offset = len - i;
      const str = ipPart.slice(0, offset).join('');
      const data = this.#getWords(str, collection, this.maxSearch);

      if (data.words.length) {
        matches.push(...data.words);
      }
      countWordsIterate += data.inc;
      countFound += data.found;

      if (offset === maxOffset) {
        break;
      }
    }

    // create a unique matches array
    matches = [...new Set(matches)];
    const result = matches.length ? this.#matchLockup(matches, ipNum, all) : [];

    return this.#result({
      result, countIterate, countFound, countWordsIterate, time: timer.end()
    });
  }

  /**
   * @param {DefaultResult} result
   * @param {number} countIterate
   * @param {number} countFound
   * @param {number} countWordsIterate
   * @param {number} time
   * @return {DefaultResult|StatResult}
   */
  #result({
    result = [],
    countIterate = 0,
    countFound = 0,
    countWordsIterate = 0,
    time = 0
  } = {}){
    if (this.resultFormat === 'stat-result') {
      return {
        countIterate: countIterate,
        countFound: countFound,
        countWordsIterate: countWordsIterate,
        time: time,
        result: result,
      };
    }

    return result;
  }

  /**
   * find ip in range collection
   * @param {string} ip
   * @param {boolean} all
   * @return {DefaultResult|StatResult}
   */
  lookup(ip, all = false) {
    const format = this.formatIP(ip);
    if (format === IP4) {
      return this.#eachLookup(this.castIpV4ToNum(ip), this.dataV4, format, all);
    }
    if (format === IP6) {
      return this.#eachLookup(this.castIpV6ToNum(ip), this.dataV6, format, all);
    }
    return this.#result({result:[]});
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
   * @param {IpType} ipType        - ip type
   * @param {string|number} value
   */
  insertRange(start, end, ipType, value) {
    if (IP6 === ipType) {
      this.dataV6.addMany([start, end]);
    }
    if (IP4 === ipType) {
      this.dataV4.addMany([start, end]);
    }
    if (!this.dataRange[start]) {
      this.dataRange[start] = [];
    }
    if (!this.dataRange[end]) {
      this.dataRange[end] = [];
    }
    this.useHash ? this.#insertDataRangeHash(start, end, value): this.#insertDataRangeValue(start, end, value);
  }

  #insertDataRangeHash(start, end, value) {
    const hash = this.stringHash(value);
    if (!this.dataValue[hash]) {
      this.dataValue[hash] = value;
    }
    this.dataRange[start].push({n: end, i: hash});
    this.dataRange[end].push({s: start, i: hash});
  }

  #insertDataRangeValue(start, end, value) {
    this.dataRange[start].push({n: end, v: value});
    this.dataRange[end].push({s: start, v: value});
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
   * @param {string|number} str
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
  }

  /**
   * export database to json string
   * @return {string}
   */
  export() {
    return JSON.stringify({
      dataV6: this.dataV6.toArray(),
      dataV4: this.dataV4.toArray(),
      dataRange: this.dataRange,
      dataValue: this.dataValue,
    })
  }

  /**
   * import export data to database
   * @param {DataImport} data
   */
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

  /**
   * get size for database
   * @return DataSize
   */
  get size () {
    return {
      v4: this.dataV4.size,
      v6: this.dataV6.size,
    };
  }

  /**
   * get levels deep for database
   * @return DataSize
   */
  get height() {
    return {
      v4: this.dataV4.getHeight(),
      v6: this.dataV6.getHeight(),
    };
  }

}

module.exports = IpCollection;
