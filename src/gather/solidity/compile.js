import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const globAsync = promisify(glob);
const readFileAsync = promisify(fs.readFile);

const compilerSettings = {
  outputSelection: {
    '*': {
      '': [
        'ast',
      ],
      '*': [
        'abi',
        'devdoc',
        'evm.methodIdentifiers',
      ],
    },
  },
};

const readdirP = promisify(fs.readdir)
const statP = promisify(fs.stat)
async function asyncFilter(arr, filterFunction) {
  const fail = Symbol()
  return (await Promise.all(arr.map(async item => (await filterFunction(item)) ? item : fail))).filter(i=>i!==fail)
}

async function recursiveReadDir(dir, ignore, allFiles = []) {
    let files = (await readdirP(dir)).map(f => join(dir, f));
    allFiles.push(...files);
    await Promise.all(
        files.map(
            async f => (await statP(f)).isDirectory() && recursiveReadDir(f, ignore, allFiles)
        )
    )
    return await asyncFilter(allFiles, async (file) => {
        const stat = await statP(file);
        return stat.isFile() && !ignore(file, stat);
    });
}

async function generateCompilerInput(directory, configuration) {
  const ignoreFile = function(file, stats) {
    if (['IAugur', 'IAuction', 'IAuctionToken', 'IDisputeOverloadToken', 'IDisputeCrowdsourcer', 'IDisputeWindow', 'IUniverse', 'IMarket', 'IReportingParticipant', 'IReputationToken', 'IOrders', 'IShareToken', 'Order', 'IV2ReputationToken', 'IInitialReporter', 'ZeroXExchange'].includes(path.parse(file).base.replace(".sol", ""))) return true;
    return stats.isFile() && path.extname(file) !== ".sol";
  }
  const filePaths = await recursiveReadDir(directory, ignoreFile);
  let filesPromises;
  if (configuration.useFlattener) {
    filesPromises = filePaths.map(async filePath => (await this.generateFlattenedSolidity(filePath)));
  } else {
    filesPromises = filePaths.map(async filePath => (await readFileAsync(filePath)).toString('utf8'));
  }
  const files = await Promise.all(filesPromises);

  let inputJson = {
    language: "Solidity",
    settings: {
      remappings: [ `ROOT=${directory}/`],
      optimizer: {
        enabled: true,
        runs: 500
      },
      outputSelection: {
        "*": {
          "": [ "ast" ],
          "*": [ "abi", "devdoc", "userdoc", "evm.bytecode.object", "evm.methodIdentifiers" ]
        }
      }
    },
    sources: {}
  };
  if (configuration.enableSdb) {
      inputJson.settings.optimizer = {
          enabled: false
      }
      inputJson.settings.outputSelection["*"][""] = [ "legacyAST" ];
      inputJson.settings.outputSelection["*"]["*"].push("evm.bytecode.sourceMap");
      inputJson.settings.outputSelection["*"]["*"].push("evm.deployedBytecode.object");
      inputJson.settings.outputSelection["*"]["*"].push("evm.deployedBytecode.sourceMap");
      inputJson.settings.outputSelection["*"]["*"].push("evm.methodIdentifiers");
  }
  for (var file in files) {
      const filePath = filePaths[file].replace(directory, "").replace(/\\/g, "/").replace(/^\//, "");;
      inputJson.sources[filePath] = { content : files[file] };
  }

  return inputJson;
}

async function getCommandOutputFromInput(childProcess, stdin) {
  return ((resolve, reject) => {
    if (childProcess.stdout === null || childProcess.stdin === null || childProcess.stderr == null) {
      throw Error("ChildProcess fields stdin, stdout, and stderr must not be null.");
    }

    const buffers = [];
    childProcess.stdout.on('data', function (data) {
      buffers.push(data);
    });
    const errorBuffers = [];
    childProcess.stderr.on('data', function (data) {
      errorBuffers.push(data);
    });
    childProcess.on('close', function (code) {
      const errorMessage = Buffer.concat(errorBuffers).toString();
      if (code > 0) return reject(new Error(`Process Exit Code ${code}\n${errorMessage}`))
      return resolve(Buffer.concat(buffers).toString());
    });
    childProcess.stdin.write(stdin);
    childProcess.stdin.end();
  })
}

// TODO: Use solcjs compileStandardWrapper when it works, 0.5.4 giving error: "Runtime.functionPointers[index] is not a function"
async function compileCustomWrapper(compilerInputJson) {
  const childProcess = spawn("solc", ["--standard-json"]);
  const compilerOutputJson = await getCommandOutputFromInput(childProcess, JSON.stringify(compilerInputJson));
  return JSON.parse(compilerOutputJson);
}

export async function compile(directory, ignore) {
  const configuration = {
    enableSdb: false,
    useFlattener: false,
  };
  const compilerInputJson = await generateCompilerInput(directory, configuration);
  const compilerOutput = await compileCustomWrapper(compilerInputJson);
  return compilerOutput;

  // Original code for this function is below
  
  // const files = await globAsync(path.join(directory, '**/*.sol'), {
  //   ignore: ignore.map(i => path.join(i, '**/*')),
  // });

  // const sources = _.fromPairs(await Promise.all(files.map(async file => [
  //   file,
  //   { content: await readFileAsync(file, 'utf8') },
  // ])));

  // const inputJSON = {
  //   language: "Solidity",
  //   sources: sources,
  //   settings: compilerSettings,
  // };

  // const solcOutputString = solc.compile(JSON.stringify(inputJSON));
  // const solcOutput = JSON.parse(solcOutputString);

  // if (_.some(solcOutput.errors, ['severity', 'error'])) {
  //   console.error(solcOutput.errors);
  //   throw new Error();
  // }

  // return solcOutput;
}
