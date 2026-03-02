const Suite = require('benchmark').Suite;
const fs = require('node:fs');
const IpCollection = require('../index');

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

console.log('--- Data Analytics ---');
console.table(ip.analytics().counts);
console.log('--- Memory status ---');
console.table(ip.analytics().memory);

const suite = new Suite;

suite.on('cycle', function(event) {
  console.log(String(event.target));
});

const ips = [
  '2.205.41.192',
  '188.65.247.97',
  '46.216.70.223',
  '46.216.70.224',
  '46.56.157.2',
  '134.17.140.22',
  '217.118.78.211',
  '178.178.81.220',
  '2a02:d247:5000::'
]
for (let i of ips) {
  suite.add(`lockup ip: ${i}`, function() {
    ip.lookup(i);
  });
}
suite.run({ 'async': false});