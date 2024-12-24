const { assert } = require('chai');
const {describe} = require('mocha')
const fs= require('node:fs')
const IpCollection = require('../index');
const { iPv4RangeToCIDR } = require('../helper');

const IpDataOperators = JSON.parse(fs.readFileSync(__dirname + '/fixtures/data-operators.json', 'utf8'))

const ip = new IpCollection({
  useHash: false
});

ip.loadFromString('103.18.157.0-103.18.159.255', 'ya1');
ip.loadFromString('103.18.157.0-103.18.159.255', 'ya2');
ip.loadFromString('103.197.28.0-103.197.29.255', 'ya2');
ip.loadFromString('103.199.184.0-103.199.185.255', 'ya3');
ip.loadFromString('5.151.236.0/23', 'geonode-2635167');
ip.loadFromString('42540528726795050063891204319802818560-42540528806023212578155541913346768895', 'test-ipv6');
ip.loadFromString('2001:470:36:63::/64\n2001:470:36:64::/64', 'geonode-6252001');
ip.loadFromString('2001:470:36:60::/64\n2001:470:36:61::/64\n2001:470:36:62::/64', 'geonode-6252001');
ip.loadFromString('2001:470:36:65::/64\n2001:470:36:66::/64\n2001:470:36:67::/64', 'geonode-6252001');

for (let operatorId in IpDataOperators) {
  ip.loadFromString(IpDataOperators[operatorId], operatorId);
}

console.log('size database:', ip.size, 'height levels:', ip.height);

describe('tests', function() {

  this.timeout(8_000)

  it('lookup 103.18.158.1', () => {
    assert.deepEqual(ip.lookup('103.18.158.1', true), ['ya1', 'ya2']);
  });

  it('lookup 2.205.41.192', () => {
    assert.deepEqual(ip.lookup('2.205.41.192', true), ['28']);
  });

  it('lookup 2.205.41.192 + result stat-format ', () => {
    ip.resultFormat = 'stat-result'
    const data = ip.lookup('2.205.41.192', true);
    assert.hasAllKeys(data, [  "countFound", "countIterate", "countWordsIterate", "result", "time"]);
    const {result} = data;
    ip.resultFormat = 'default'
    assert.deepEqual(result, ['28']);
    console.log(data);
  });


  it('lookup 5.151.236.0/23', () => {
    assert.deepEqual(ip.lookup('5.151.237.59', true), ['geonode-2635167']);
  });

  it('lookup 2001:0470:0036:0065:3E0B:385A:F353:A049', () => {
    assert.deepEqual(ip.lookup('2001:0470:0036:0065:3E0B:385A:F353:A049', true), ['geonode-6252001']);
  });

  it('lookup 2001:0470:0036:0065:60DC:916E:DDD5:FFCA', () => {
    assert.deepEqual(ip.lookup('2001:0470:0036:0065:60DC:916E:DDD5:FFCA', true), ['geonode-6252001']);
  });

  it('lookup all ranges: 2.72.0.0-2.79.255.255', () => {
    const range = '2.72.0.0-2.79.255.255';
    const [start, end] = range.split('-');
    const startNum = BigInt(ip.castIpV4ToNum(start));
    const endNum = BigInt(ip.castIpV4ToNum(end));
    for (let i = startNum; i <= endNum; i++) {
      const ipStr = ip.castBigIntIpToV4Str(i);
        const operators = [...new Set(ip.lookup(ipStr, true))];
        const errorMessage =  'ip:' + ipStr + ' operators ids: [' + operators.join() + '] ' +
          'current num:' + i +
          ' range num: ' + startNum + '-' + endNum +
          ' range by: ' + range;
        assert.equal(true, operators.includes('13'), errorMessage)
    }
  });
})