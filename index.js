const IpCollection = require('./ip-collection.js');
const {Address6} = require('ip-address')


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
  while (true) {
    let i = Math.round((high - low) / 2) + low;
    if (item < extractKey(list[i])) {
      if (i === high && i === low) {
        return -1;
      }
      else if (i === high) {
        high = low;
      }
      else {
        high = i;
      }
    }
    else if (item >= extractKey(list[i]) && (i === (list.length - 1) || item < extractKey(list[i + 1]))) {
      return i;
    }
    else {
      low = i;
    }
  }
}

const extractKeyCurrent = (item) => {
  return item;
}
//IpCollection

const PART_V6 = 1334440654591915542993625911497130241n;
const PART_V4 = 16843009n;
const IP_PARTS = 225n;
const MAX_SIZE_BLOCK = 1024 * 1024 * 2;

// let a = new Address6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
//
// console.log(a.decimal().split(':').map(a => parseInt(a, 16)).join(''))
// console.log(a.bigInteger().toString())


class MainCollection  extends IpCollection
{
  __indexV4 = [];
  __indexV6 = [];
  
  generateFileIndexes() {
    const put = (multiplier, collection) => {
      for (let i = 1n, l = IP_PARTS; i<=l; i++){
        collection.push(i * multiplier);
      }
    };
    put(PART_V4, this.__indexV4)
    put(PART_V6, this.__indexV4)
  }
  
  
  constructor() {
    super();
    this.generateFileIndexes();
    
  }

  
}

let m = new MainCollection;

// console.log(m.__indexV4, m.__indexV6);
