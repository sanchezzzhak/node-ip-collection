

/**
 * hash big string to number hash
 * @param {string|number} str
 * @return {number}
 */
const stringHash = (str) => {
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

/**
 * Fix Math.max(min, max) for BigInt range 128bit
 * @param args
 * @return {*}
 */
const bigIntMax = (...args) => args.reduce((m, e) => e > m ? e : m);

module.exports = {
  bigIntMax, stringHash
}