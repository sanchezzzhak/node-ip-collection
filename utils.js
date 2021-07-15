const Net = require('net');
const {Address6, Address4} = require('ip-address');

/**
 *
 * @param list
 * @param item
 * @param extractKey
 * @returns {number}
 */
const binarySearch = (list, item, extractKey) => {
  let low = 0;
  let high = list.length - 1;
  let count  = 0;
  while (true) {
    let i = Math.round((high - low) / 2) + low;
    if (item < extractKey(list[i])) {
      if (i === high && i === low) {
        return -1;
      } else if (i === high) {
        high = low;
      } else {
        high = i;
      }
    } else if (item >= extractKey(list[i]) &&
      (i === (list.length - 1) || item < extractKey(list[i + 1]))) {
      return i;
    } else {
      low = i;
    }
  }
};

const getIpFormat =(ip) => {
  let version = Net.isIP(ip);
  if (version === 4 || version === 6) {
    return version;
  }
  return 0;
}


const extractKeyCurrent = (item) => {
  return item;
};

/**
 * convert ip to bigint
 *
 * @param {string} ip
 * @returns {BigInt}
 */
const ipNum = (ip) => {
  let format = getIpFormat(ip);
  if (format === 4) {
    return BigInt((new Address4(ip)).bigInteger().toString());
  }
  if (format === 6) {
    return BigInt((new Address6(ip)).bigInteger().toString());
  }
}



module.exports = {
  ipNum,
  getIpFormat,
  binarySearch,
  extractKeyCurrent
};