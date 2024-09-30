
const util = require('node:util')

const log = (obj) => console.log(util.inspect(obj, {showHidden: false, depth: null, colors: true}));
const IpCollection = require('../index');

const collection = new IpCollection();

collection.loadFromString('103.18.157.0-103.18.159.255', 'ya1');
collection.loadFromString('103.18.157.0-103.18.159.255', 'ya2');
collection.loadFromString('103.197.28.0-103.197.29.255', 'ya2');
collection.loadFromString('103.199.184.0-103.199.185.255', 'ya3');


/*

* */



log(collection.lookup('103.18.158.1', true))

