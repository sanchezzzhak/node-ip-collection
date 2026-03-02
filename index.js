const { Address6, Address4 } = require('ip-address');
const Timer = require('./utils/timer');
const { bigIntMax } = require('./utils/helper');

const IP4 = 'v4';
const IP6 = 'v6';
const IP_UNK = 'unk';
const RESULT_FORMAT_DEFAULT = 'default';
const RESULT_FORMAT_STAT = 'stat-result';

const getV4Bucket = (bigIntIp) => {
  return Number(BigInt(bigIntIp) >> 24n);
};

const getV6Bucket = (bigIntIp) => {
  return Number(BigInt(bigIntIp) >> 112n);
};

const getBuckets = (start, end, ipType) => {
  const s = (ipType === IP4) ? getV4Bucket(start) : getV6Bucket(start);
  const e = (ipType === IP4) ? getV4Bucket(end) : getV6Bucket(end);
  return {s, e};
};

class IntervalNode {
  /**
   *
   * @param {Interval} interval
   * @param {*} value
   */
  constructor(interval, value) {
    this.interval = interval; // { start: BigInt, end: BigInt }
    this.value = value;
    this.left = null;
    this.right = null;
    this.maxEnd = interval.end; // Maximum end of any interval in this subtree
    this.intervals = [interval]; // Store all intervals for this node
  }
}

class IntervalMultiTree {

  /**
   * @type {IntervalNode|null}
   */
  root = null;

  /**
   * @param {Interval} a
   * @param {Interval} b
   * @return {boolean}
   * @private
   */
  #overlaps(a, b) {
    return a.start <= b.end && b.start <= a.end;
  }

  /**
   *
   * @param {IntervalNode} node
   * @param {Interval} interval
   * @param {any} value
   * @return {IntervalNode|*}
   * @private
   */
  #insertNode(node, interval, value) {
    if (!node) {
      return new IntervalNode(interval, value);
    }
    // Decide where to insert based on the start of the interval
    if (interval.start < node.interval.start) {
      node.left = this.#insertNode(node.left, interval, value);
    } else {
      node.right = this.#insertNode(node.right, interval, value);
    }
    // Update maxEnd for the node
    node.maxEnd = bigIntMax(node.maxEnd, interval.end);
    // Add the interval to the node if it overlaps
    if (this.#overlaps(node.interval, interval)) {
      node.intervals.push(interval);
    }
    return node;
  }

  /**
   * Insert range to tree
   * @param {string|number|bigint} start
   * @param {string|number|bigint} end
   * @param {any} value
   */
  insert(start, end, value) {
    this.root = this.#insertNode(this.root, { start: BigInt(start), end: BigInt(end) }, value);
  }

  /**
   * Search range for ip bigint string
   * @param {string|number|bigint} ip
   * @return {*[]}
   */
  search(ip) {
    const results = [];
    this.#searchNode(this.root, BigInt(ip), results);
    return results;
  }

  /**
   * search avl nodes ang aggregate result to results argument
   * @param {IntervalNode|null} node
   * @param {bigint} ip
   * @param {any[]} results
   */
  #searchNode(node, ip, results) {
    if (!node) return;

    // if the ip is in the current node
    if (ip >= node.interval.start && ip <= node.interval.end) {
      results.push(node.value);
    }

    // Go to the left subtree if there may be a suitable interval there
    if (node.left && ip <= node.left.maxEnd) {
      this.#searchNode(node.left, ip, results);
    }

    // We always check the right one, since there may be intervals starting later
    this.#searchNode(node.right, ip, results);
  }
}

class IpCollection {
  /**
   * @type {DataCollection}
   */
  dataV4 = {};
  /**
   * @type {DataCollection}
   */
  dataV6 = {};
  /**
   * @type {ResultFormat}
   */
  resultFormat = RESULT_FORMAT_DEFAULT;

  /**
   * @param {IpCollectionOptions} options
   */
  constructor(options = {}) {
    this.clear()
    if (options.resultFormat) {
      this.resultFormat = options.resultFormat;
    }
  }

  /**
   * Method for obtaining detailed analytics
   */
  analytics() {
    const memory = process.memoryUsage();
    return {
      counts: {
        v4TotalNodes: this.stats.v4Nodes,
        v6TotalNodes: this.stats.v6Nodes,
        v4ActiveBuckets: Object.keys(this.dataV4).length,
        v6ActiveBuckets: Object.keys(this.dataV6).length,
      },
      memory: {
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`, // Shared process memory
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`, // Really busy with objects
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB` // V8 highlighted
      },
      averageNodesPerBucket: {
        v4: (this.stats.v4Nodes / (Object.keys(this.dataV4).length || 1)).toFixed(2),
        v6: (this.stats.v6Nodes / (Object.keys(this.dataV6).length || 1)).toFixed(2)
      }
    };
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
   * @param {bigint|*} val
   * @return {string}
   */
  castBigIntIpToV4Str(val) {
    return Address4.fromBigInteger(val).correctForm();
  }

  /**
   * cast bigint to ip v6 string
   * @param {bigint|*} val
   * @return {string}
   */
  castBigIntIpToV6Str(val) {
    return Address6.fromBigInteger(val).correctForm();
  }

  /**
   * @param {string} ipNum
   * @param {DataCollection} collection
   * @param {boolean} all
   * @return {DefaultResult|StatResult}
   * @private
   */
  #eachLookup(ipNum, collection, all = true) {
    const result = [];
    const timer = new Timer();
    const ip = BigInt(ipNum);
    const isV6 = ip > 4294967295n;
    const bucketIdx = isV6 ? getV6Bucket(ip) : getV4Bucket(ip);

    if (!collection[bucketIdx]) {
      return this.#result({ result: [], time: timer.end() });
    }

    result.push(...(collection[bucketIdx].search(ip) || []));
    return this.#result({
      result, time: timer.end()
    });
  }

  /**
   * @param {*[]} result
   * @param {number|string} time
   * @return {DefaultResult|StatResult}
   */
  #result({ result = [], time = 0 }) {
    const uniqueResult = [...new Set(result)];
    if (this.resultFormat === RESULT_FORMAT_STAT) {
      return {
        time, result: uniqueResult
      };
    }
    return uniqueResult;
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
      return this.#eachLookup(this.castIpV4ToNum(ip), this.dataV4, all);
    }
    if (format === IP6) {
      return this.#eachLookup(this.castIpV6ToNum(ip), this.dataV6, all);
    }
    return this.#result({ result: [] });
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
   * @param {string|number} value  - certain identifier value
   */
  insertRange(start, end, ipType, value) {
    const s = BigInt(start);
    const e = BigInt(end);
    const tree = ipType === IP6 ? this.dataV6 : this.dataV4;
    const { s: startBucket, e: endBucket } = getBuckets(s, e, ipType);

    for (let i = startBucket; i <= endBucket; i++) {
      if (!tree[i]) {
        tree[i] = new IntervalMultiTree();
        if (ipType === IP4) this.stats.v4Buckets++; else this.stats.v6Buckets++;
      }
      tree[i].insert(s, e, value);
      // Node counter increment
      if (ipType === IP4) this.stats.v4Nodes++; else this.stats.v6Nodes++;
    }
  }

  /**
   * insert range by Address object to data
   * @param {Address6|Address4} startAddr
   * @param {Address6|Address4} endAddr
   * @param {'v4'|'v6'} ipType
   * @param {string|number} value
   */
  insertRangeAddress(startAddr, endAddr, ipType, value) {
    this.insertRange(startAddr.bigInteger().toString(), endAddr.bigInteger().toString(), ipType, value);
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
        ipType = range.split('.').length === 4 ? IP4 : IP6;
        let addrCIDR = ipType === IP6 ? new Address6(range) : new Address4(range);
        this.insertRangeAddress(addrCIDR.startAddress(), addrCIDR.endAddress(), ipType, value);
        continue;
      }
      // is range delimiter '-'
      let [startRange, endRange] = range.split('-');
      ipType = startRange.split('.').length === 4 ? IP4 : IP6;
      // is range bignumber string
      if (/^\d+$/.test(startRange)) {
        ipType = startRange.length <= 14 ? IP4 : IP6;
        this.insertRange(startRange, endRange, ipType, value);
      } else {
        let startAddr = ipType === IP6 ? new Address6(startRange) : new Address4(startRange);
        let endAddr = ipType === IP6 ? new Address6(endRange) : new Address4(endRange);
        this.insertRangeAddress(startAddr, endAddr, ipType, value);
      }
    }

  }

  /**
   * clear all data
   */
  clear() {
    this.dataV4 = {};
    this.dataV6 = {};
    this.stats = {
      v4Nodes: 0,
      v6Nodes: 0,
      v4Buckets: 0,
      v6Buckets: 0
    }
  }

}

module.exports = IpCollection;
