const {assert, expect} = require('chai');
const {describe} = require('mocha')
const crypto= require('node:crypto')
const fs= require('node:fs')
const IpCollection = require('../index');

const IpDataOperators = JSON.parse(fs.readFileSync(__dirname + '/fixtures/data-operators.json', 'utf8'))

const ip = new IpCollection();

const errorMessage = (ipStr, operators, ipNum, startNum, endNum, range) => {
  return  'ip:' + ipStr + ' operators ids: [' + operators.join() + '] ' +
    'current num:' + ipNum +
    ' range num: ' + startNum + '-' + endNum +
    ' range by: ' + range;
};

function getRandomBigInt(min, max) {
  const range = max - min + 1n;
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  let bigInt = BigInt(0);
  for (let i = 0; i < randomBytes.length; i++) {
    bigInt = (bigInt << BigInt(8)) | BigInt(randomBytes[i]);
  }
  return bigInt % BigInt(range) + BigInt(min);
}

ip.loadFromString('103.18.157.0-103.18.159.255', 'ya1');
ip.loadFromString('103.18.157.0-103.18.159.255', 'ya2');
ip.loadFromString('103.197.28.0-103.197.29.255', 'ya2');
ip.loadFromString('103.199.184.0-103.199.185.255', 'ya3');
ip.loadFromString('5.151.236.0/23', 'geonode-2635167');
ip.loadFromString('42540528726795050063891204319802818560-42540528806023212578155541913346768895', 'test-ipv6');
ip.loadFromString('2001:470:36:63::/64\n2001:470:36:64::/64', 'geonode-6252001');
ip.loadFromString('2001:470:36:60::/64\n2001:470:36:61::/64\n2001:470:36:62::/64', 'geonode-6252001');
ip.loadFromString('2001:470:36:65::/64\n2001:470:36:66::/64\n2001:470:36:67::/64', 'geonode-6252001');
ip.loadFromString('0000:0000:0000:0000:0000:0000:0000:0000-ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '306');

for (let operatorId in IpDataOperators) {
  ip.loadFromString(IpDataOperators[operatorId], operatorId);
}


describe('tests', function() {

  this.timeout(30_000)

  beforeEach(() => {
    ip.resultFormat = 'default';
  })

  describe('analytic() method', () => {

    it('Must contain all required keys and correct data types', () => {
      ip.lookup('188.65.247.97', true)

      const after = ip.analytics()

      expect(after).to.have.all.keys('counts', 'memory', 'averageNodesPerBucket');

      expect(after.counts).to.be.an('object').and.have.all.keys(
        'v4TotalNodes', 'v6TotalNodes', 'v4ActiveBuckets', 'v6ActiveBuckets'
      );
      expect(after.counts.v4TotalNodes).to.be.a('number');
      expect(after.counts.v6TotalNodes).to.be.a('number');

      expect(after.memory).to.be.an('object').and.have.all.keys('rss', 'heapUsed', 'heapTotal');
      expect(after.memory.rss).to.be.a('string').and.match(/MB$/);

      expect(after.averageNodesPerBucket).to.be.an('object').and.have.all.keys('v4', 'v6');
      expect(after.averageNodesPerBucket.v4).to.be.a('string');
    });

  })

  it('lookup 103.18.158.1', () => {
    assert.deepEqual(ip.lookup('103.18.158.1', true), ['ya1', 'ya2']);
  });

  it('lookup 2.205.41.192', () => {
    assert.deepEqual(ip.lookup('2.205.41.192', true), ['28']);
  });

  it('lookup 2.205.41.192 + result stat-format ', () => {
    ip.resultFormat = 'stat-result'
    const data = ip.lookup('2.205.41.192', true);
    assert.hasAllKeys(data, ['time', "result"])
    assert.deepEqual(data.result, ['28']);
    console.log(data);
  });

  it('lookup 5.151.236.0/23', () => {
    assert.deepEqual(ip.lookup('5.151.237.59', true), ['geonode-2635167']);
  });

  it('lookup 188.65.247.97', () => {
    assert.deepEqual(ip.lookup('188.65.247.97', true), ['22']);
  });

  it('lookup 2001:0470:0036:0065:3E0B:385A:F353:A049', () => {
    const result = ip.lookup('2001:0470:0036:0065:3e0b:385a:f353:a049', true);
    expect(result).to.deep.include('geonode-6252001');
    expect(result).to.deep.include('306');
    expect(result).to.lengthOf(2);
  });

  it('lookup 2001:0470:0036:0065:60DC:916E:DDD5:FFCA', () => {
    const result = ip.lookup('2001:0470:0036:0065:60dc:916e:ddd5:ffca', true);
    expect(result).to.deep.include('geonode-6252001');
    expect(result).to.deep.include('306');
    expect(result).to.lengthOf(2);
  });

  it('lookup 2001:16a2:c0d6:4d6a:680d:f980:f27f:c06', () => {

    function findValueInTree(data, targetValue) {
      const results = [];

      function traverseNode(node, currentKey) {
        if (!node) return;

       // check the value in the node itself
        if (node.value === targetValue) {
          results.push({
            key: currentKey,
            type: 'node',
            interval: node.interval,
            maxEnd: node.maxEnd
          });
        }

        // Checking the elements in the intervals array, if it exists
        if (Array.isArray(node.intervals)) {
          node.intervals.forEach((item, index) => {
            if (item && (item.value === targetValue || item === targetValue)) {
              results.push({
                key: currentKey,
                type: 'array_item',
                index: index,
                data: item
              });
            }
          });
        }

        // We go deeper along the branches of the tree
        if (node.left) traverseNode(node.left, currentKey);
        if (node.right) traverseNode(node.right, currentKey);
      }

      // We go through all the main keys of the object (for example, '60997')
      for (const key in data) {
        if (data.hasOwnProperty(key) && data[key].root) {
          traverseNode(data[key].root, key);
        }
      }

      return results;
    }


  assert.deepEqual(ip.lookup('2001:16a2:c0d6:4d6a:680d:f980:f27f:c06', true), ['306']);
    const foundItems = findValueInTree(ip.dataV6, '306').length;
    console.log(foundItems)
  });

  it('lookup all ranges: 2.72.0.0-2.79.255.255', () => {
    const range = '2.72.0.0-2.79.255.255';
    const [start, end] = range.split('-');
    const startNum = BigInt(ip.castIpV4ToNum(start));
    const endNum = BigInt(ip.castIpV4ToNum(end));
    for (let i = startNum; i <= endNum; i++) {
      const ipStr = ip.castBigIntIpToV4Str(i);
        const operators = ip.lookup(ipStr, true);
        const message = errorMessage(ipStr , operators, i, startNum , endNum ,  range);
        assert.equal(true, operators.includes('13'), message)
    }
  });

  for (let operatorId in IpDataOperators) {
    const ranges = IpDataOperators[operatorId].split('\n');
    for (let range of ranges) {
      const isV4 = range.split('.').length > 1;
      it('lookup operator: ' + operatorId + ' range: ' + range, () => {
        ip.resultFormat = 'stat-result';
        const [start, end] = range.split('-');
        const startNum = isV4 ? BigInt(ip.castIpV4ToNum(start)) : BigInt(ip.castIpV6ToNum(start));
        const endNum = isV4 ? BigInt(ip.castIpV4ToNum(end)) : BigInt(ip.castIpV6ToNum(start));
        const i = getRandomBigInt(startNum, endNum);
        const ipStr = isV4 ? ip.castBigIntIpToV4Str(i): ip.castBigIntIpToV6Str(i);
        const data = ip.lookup(ipStr, true);
        console.log(ipStr, data);
        const operators = data.result;
        const message = errorMessage(ipStr, operators, i, startNum, endNum, range);
        assert.equal(true, operators.includes(operatorId), message);

      });
    }
  }


})