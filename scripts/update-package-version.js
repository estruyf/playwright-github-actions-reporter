import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

packageJson.version += `-beta.${process.argv[process.argv.length - 1].substr(0, 7)}`;
console.log(packageJson.version);
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));