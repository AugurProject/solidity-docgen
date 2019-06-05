import { readFile } from 'async-file';
// import { compile } from './compile';
import { extractDocsPerDirectory } from './extract';

export async function gatherSolidityDocs(solcOutputFile, directory, ignore) {
  // This code has been modified to use a solc output file as input rather  
  // than compiling a specified directory. This was done as a workaround for
  // the sake of expediency, since attempting to compile the existing Augur 
  // directory structure was causing errors.

  // Much of the code from ContractCompiler.ts has been copied to compile.js,
  // but is not working in its current state.

  // const solcOutput = await compile(directory, ignore);
  // return extractDocsPerDirectory(solcOutput, directory);
  
  const solcOutput = JSON.parse(await readFile(solcOutputFile, "utf8"));
  return extractDocsPerDirectory(solcOutput, "");
}
