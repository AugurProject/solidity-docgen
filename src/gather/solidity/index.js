import { readFile } from 'async-file';
import { extractDocsPerDirectory } from './extract';

export async function gatherSolidityDocs(solcOutputFile, directory, ignore) {
  const solcOutput = JSON.parse(await readFile(solcOutputFile, "utf8"));
  return extractDocsPerDirectory(solcOutput, "");
}
