const fs = require('fs-extra');
const yaml = require('js-yaml');
const schema = require('cloudformation-schema-js-yaml');

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

function readJsonFile(jsonFilePath, encoding = 'utf8') {
  return yaml.safeLoad(stripBOM(fs.readFileSync(jsonFilePath, encoding)), { schema });
}

module.exports = {
  readJsonFile,
};
