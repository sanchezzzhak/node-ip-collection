const {Address6, Address4} = require('ip-address');
const {getIpFormat} = require('./utils');

const IPV6 = 'v6';
const IPV4 = 'v4';

class AbstractIpCollection {
  
  castIpV6ToNum(ip) {
    return BigInt(new Address6(ip, 8).bigInteger()).toString();
  }
  
  castBigIntIpToV4Str(val) {
    return Address4.fromBigInteger(val).correctForm();
  }
  
  castBigIntIpToV6Str(val) {
    return Address6.fromBigInteger(val).correctForm();
  }
  
  castIpV4ToNum(ip) {
    return new Address4(ip).bigInteger().toString();
  }
  
  /**
   * find ip in range
   * @param rawIp
   * @param all
   * @returns {[]|*[]}
   */
  lookup(rawIp, all = false) {
    throw new Error('method need implemented');
  }
  
  /**
   * get format ip name by ip
   *
   * @param ip
   * @returns {string}
   */
  formatIP(ip) {
    let format = getIpFormat(ip);
    if (4 === format) {
      return IPV4;
    }
    if (6 === format) {
      return IPV6;
    }
    return 'unk';
  }

}

module.exports = AbstractIpCollection;
