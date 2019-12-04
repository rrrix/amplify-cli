import fs from 'fs-extra';
const yaml = require('js-yaml');
const schema = require('cloudformation-schema-js-yaml');

function stripBOM(content: string) {
  // tslint:disable-next-line
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

export function readJsonFileSync(jsonFilePath: string, encoding: string = 'utf8'): any {
  return yaml.safeLoad(stripBOM(fs.readFileSync(jsonFilePath, encoding)), { schema });
}

export async function readJsonFile(jsonFilePath: string, encoding: string = 'utf8'): Promise<any> {
  const contents = await fs.readFile(jsonFilePath, encoding);
  return yaml.safeLoad(stripBOM(contents), { schema });
}
