# `solidity-docgen`

**Documentation generator for Augur's smart contracts.**

`solidity-docgen` combines inline documentation with long form documents to
generate Augur's smart contract documentation pages.

## Install

```sh
npm install solidity-docgen
```

## Usage

1. Document your source code in inline comments using `@dev` tags in the [NatSpec] format.
2. Write longer form documentation in a README.md file next to your smart contracts. (Optional)
3. Run `npm build` in the `augur/augur-core` directory to generate documentation pages in the `augur/docs/docs/contracts` directory.
If the contracts have already been compiled, running `npm build:documentation` will have the same effect. 

[NatSpec]: https://solidity.readthedocs.io/en/develop/natspec-format.html
