const AbstractIpCollection = require('./abstract-ip-collection');

class IpFileCollection extends AbstractIpCollection
{
  #__path;
  #__entity;
  
  constructor(options = {}) {
    super();
  }
  
  lookup(rawIp, all = false) {
  
  }
  
  
}

module.exports = IpFileCollection;