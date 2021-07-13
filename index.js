const Net = require('net')
const {Address6, Address4} = require('ip-address');





class IpCollection {

  values = [];
  __ipv4 = {};
  __ipv6 = {};

  static validate(rawIP){
    return getIpFormat(rawIP) !== 0;
  };

  static getIpFormat(ipRaw){
    let version = Net.isIP(ipRaw)
    if (version === 4 || version === 6) {
      return 'v4';
    }
    return 0;
  }

  /**
   * insert range to object
   * @param obj
   * @param keyPath
   * @param value
   */
  insert(obj, keyPath, value) {
    if (typeof keyPath == 'string') keyPath = keyPath.split('.');
    let lastKeyIndex = keyPath.length - 1;
    for (let i = 0; i <= lastKeyIndex; ++i) {
      let key = keyPath[i];
      if (obj[key] === void 0) {
        obj[key] = i === lastKeyIndex ? [] : {};
      }
      obj = obj[key];
    }
    obj.push(value);
  }

  lookup(rawIp){
    let ip = this.ipNum(rawIp);
    let format = IpCollection.getIpFormat(rawIp);




  }

  ipNum(ip){
    let format = IpCollection.getIpFormat(ip);
    if (format === 4) {
      return (new Address4(ip)).bigInteger();
    }
    if (format === 6) {
      return (new Address6(ip)).bigInteger();
    }
  }


  load(text, value) {
    let rows = text.split('\n');
    for (let row of rows) {
      if (!row) {
        continue;
      }
      let ipPart = row.split('-');
      if (ipPart.length !== 2) {
        continue;
      }
      let format = IpCollection.getIpFormat(ipPart[0]);
      if (!format) {
        continue;
      }

      let left = this.ipNum(ipPart[0])
      let right = this.ipNum(ipPart[1])

      let path = [];

      if (format === 4) {
        path = left.toString().split('', 2);
      }
      if (format === 6) {
        path = left.toString().split('', 2);
      }
      path.push(String(value));
      // this.insert(this.__dataV6, path, [left, right]);
    }
  }


}
