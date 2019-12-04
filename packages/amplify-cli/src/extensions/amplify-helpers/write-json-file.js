const fs = require('fs-extra');
const yaml = require('js-yaml');

function writeJsonFile(jsonFilePath, encoding = 'utf8') {
  return yaml.safeDump(fs.writeFileSync(jsonFilePath, { encoding }));
}

module.exports = {
  writeJsonFile,
};
