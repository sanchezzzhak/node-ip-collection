/**
 * this console script is only needed to generate database
 **/
const fs = require('fs');
const YAML = require('js-yaml');

const loadYMLFile = (file) => {
  return YAML.safeLoad(fs.readFileSync(file));
};
let folder = __dirname + '/../data/'
let ymlFiles = fs.readdirSync(folder);
ymlFiles = ymlFiles.filter(file =>  file.indexOf('.yml') !== -1);
