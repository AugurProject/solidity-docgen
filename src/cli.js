#!/usr/bin/env node

import program from 'commander';
import { version } from '../package.json';
import { renderAndWriteDirectoryDocs } from '.';

program
  .version(version, '-v, --version')
  .option(
    '-s, --solcOutputFile <filename>',
    'solcOutputFile where comppiled solc output is saved',
    'contracts_full.json',
  )
  .option(
    '-c, --contractsDir <directory>',
    'directory where contracts will be taken from',
    'contracts',
  )
  .option(
    '-o, --outDir <directory>',
    'directory where generated docs will be written',
    'docs',
  )
  .option(
    '-i, --ignore <pattern>',
    'ignore directories that match the pattern',
    (val, arr) => arr.concat(val),
    [],
  )
  .parse(process.argv);

const { solcOutputFile, contractsDir, outDir, ignore } = program;

renderAndWriteDirectoryDocs(solcOutputFile, contractsDir, outDir, ignore).catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
