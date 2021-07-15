const {ipNum} = require('./utils');
const {getIpFormat} = require('./utils');

class AbstractIpCollection {
  
  collectionName = '';
  fixturePath = '';
  
  __ipv4 = {};
  __ipv6 = {};
  
  /**
   * insert range to object
   *
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
  
  /**
   * find object
   *
   * @param {string} rawIp
   * @param {boolean} all
   * @returns {[]}
   */
  lookup(rawIp, all = false) {
    
    const findCollection = (keyPath, collection) => {
      if (typeof keyPath == 'string') keyPath = keyPath.split('.');
      let current = collection[keyPath[0]];
      if (current === void 0) {
        return null;
      }
      let lastKeyIndex = keyPath.length - 1;
      for (let i = 1; i <= lastKeyIndex; ++i) {
        let key = keyPath[i];
        if (current[key] === void 0) {
          return null;
        }
        current = current[key];
      }
      return current;
    };
    const findRange = (ipNum, collection, all = false) => {
      let result = [];
      for (let value in collection)
        for (let i = 0, l = collection[value].length; i < l; i++) {
          let range = collection[value][i];
          let rangeStart = range[0];
          let rangeEnd = range[1];
          let check = ip >= rangeStart && ip <= rangeEnd;
          if (check) {
            result.indexOf(value) === -1 && result.push(value);
            if (!all) {
              return result;
            }
            break;
          }
        }
      return result;
    };
    
    let result = [];
    let ip = ipNum(rawIp);
    let format = IpCollection.getIpFormat(rawIp);
    let splitPath = 2;
    if (format === 0) {
      return [];
    }
    let path = ip.toString().split('', splitPath);
    let collection = findRange(path, format === 4
      ? this.__ipv4
      : this.__ipv6,
    );
    if (collection === null) {
      return [];
    }
    result = findCollection(ip, collection, all);
    
    return result;
  }
  
  
  loadFixtures(){}
  
  /**
   * load collection
   * format the argument text
   * ```txt
   * 103.18.156.0-103.18.157.255
   * 103.18.158.0-103.18.159.255
   * 103.197.28.0-103.197.29.255
   * ```
   * @param {string} text
   * @param {*} value
   */
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
      let format = getIpFormat(ipPart[0]);
      if (!format) {
        continue;
      }
      
      let left = ipNum(ipPart[0]);
      let right = ipNum(ipPart[1]);
      
      let path = [];
      if (format === 4) {
        path = left.toString().split('', 2);
        path.push(String(value));
        this.insert(this.__ipv4, path, [left, right]);
      }
      if (format === 6) {
        path = left.toString().split('', 2);
        path.push(String(value));
        this.insert(this.__ipv6, path, [left, right]);
      }
    }
  }
}

module.exports = AbstractIpCollection;