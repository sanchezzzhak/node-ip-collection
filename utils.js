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

const extractKeyCurrent = (item) => {
  return item;
};

module.exports = {
  binarySearch,
  extractKeyCurrent
};