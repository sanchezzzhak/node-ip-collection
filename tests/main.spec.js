const util = require('util');
const {should, assert, expect} = require('chai');
const TIMEOUT = 6000;
const {IpCollection, IpFileCollection} = require('./../index');

const log = (...args) => {
  console.log(
    util.inspect(args, {showHidden: false, depth: null, colors: true}),
  );
};

describe('IpCollection', function() {
  this.timeout(TIMEOUT);
  
  let collection = new IpCollection;
  collection.loadFromString(`187.210.78.0-187.210.78.255
    187.210.139.0-187.210.139.255
    187.210.141.0-187.210.142.255
    187.210.189.0-187.210.189.255
    187.210.230.0-187.210.230.255
    187.210.247.0-187.210.247.255
    187.216.136.0-187.216.136.255
    187.216.232.0-187.216.232.255
    187.217.195.0-187.217.195.255`, {name: 'mx-telcel', id: 1});
  
  collection.loadFromString(`80.10.4.0-80.10.9.255
    80.10.11.0-80.10.39.255
    80.10.47.0-80.10.79.255
    80.12.212.0-80.12.213.63
    90.84.144.0-90.84.145.127
    90.84.146.0-90.84.146.255`, {name: 'fr-orange', id: 2});
  
  it('lockup found', function() {
    
    expect(collection.lookup('187.216.136.127', true))
    .deep.equal([{name: 'mx-telcel', id: 1}]);
    
    expect(collection.lookup('90.84.145.126', true))
    .deep.equal([{name: 'fr-orange', id: 2}]);
    
  });
  
  it('lockup not found', function() {
    expect(collection.lookup('187.210.140.1', true)).deep.equal([]);
  });
});