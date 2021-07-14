const IpCollection = require('./ip-collection.js');
const {Address6, Address4} = require('ip-address');
const {extractKeyCurrent, binarySearch} = require('./utils');

//IpCollection

const PART_V6 = 1334440654591915542993625911497130241n;
const PART_V4 = 16843009n;
const IP_PARTS = 225n;
// 8192




let a = new Address6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
let a2 = new Address6('2001:0db8:85a3:0000:0000:8a2e:0370:7339')


let a4 = new Address4('31.169.120.25')
console.log(a4.bigInteger().toString());


console.log(a.decimal().split(':'))
console.log(a2.decimal().split(':').map(d => parseInt(d, 10)));
// console.log(a.bigInteger().toString())

class MainCollection extends IpCollection {
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
    super();
    this.initMapIndexes();
  }
  
  getIpInfo(rawIp){
    let ipInt = this.ipNum(rawIp);
    let format = this.getIpFormat(rawIp);
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

    let index = this.getIndexIdByIp()
    console.log({index})
    
    
  }
  
}


// test
let m = new MainCollection;
m.lookup('31.169.120.22')