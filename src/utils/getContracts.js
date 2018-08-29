// getContracts.js, Andrew Tam
// This file retrieves contracts and other Enigma-related objects for the dApp.

// Import libraries
const Web3 = require('web3');
const contract = require('truffle-contract');

// Import Enigma libraries
const testUtils = require ('../../enigma-lib/test-utils'); // for predicting gas prices
const eng = require('../../enigma-lib/Enigma');  // used to create worker tasks

class EnigmaSetup {

  /* CONSTRUCTOR */
  constructor() {
    this.Voting = null;
    this.VotingToken = null;
    this.TokenFactory = null;
    this.Enigma = null;
    this.EnigmaToken = null;
    this.enigma = null;
    this.principal = null;
    this.web3 = null;
    this.accounts = null;
  }

  /*
   * Initializes web3 and imports the deployed contracts.
   */
  async init() {
    try {
      // Use ganache on the SGX server for the web3 instance.
      console.log("Get web3");
      const argv = require('minimist') (process.argv.slice(2));
      const url = argv.url || 'http://localhost:8545';
      const provider = new Web3.providers.HttpProvider (url);
      // const provider = new Web3.providers.HttpProvider("http://ibm.enigma.co:10000");
      this.web3 = new Web3 (provider);

      // Use web3 to get the user's accounts.
      console.log("Get accounts");
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contracts
      console.log("Get contracts");
      const votingContract = contract(require('../../build/contracts/Voting.json'));
      const tokenFactoryContract = contract(require('../../build/contracts/TokenFactory.json'));
      const votingTokenContract = contract(require('../../build/contracts/VotingToken.json'));
      const enigmaContract = contract(require('../../build/contracts/Enigma.json'));
      const enigmaTokenContract = contract(require('../../build/contracts/EnigmaToken.json'));
      enigmaContract.setNetwork(1);

      // Workaround for this issue: https://github.com/trufflesuite/truffle-contract/issues/57
      [enigmaContract, enigmaTokenContract, votingContract, tokenFactoryContract, votingTokenContract].forEach (instance => {
          instance.setProvider (provider);
          if (typeof instance.currentProvider.sendAsync !== "function") {
              instance.currentProvider.sendAsync = function () {
                  return instance.currentProvider.send.apply (
                      instance.currentProvider, arguments
                  );
              };
          }
      });

      // Get the deployed instances
      this.Voting = await votingContract.deployed();
      this.VotingToken = await votingTokenContract.deployed();
      this.TokenFactory = await tokenFactoryContract.deployed();
      this.Enigma = await enigmaContract.deployed();
      this.EnigmaToken = await enigmaTokenContract.deployed();
      this.enigma = new eng.Enigma(this.Enigma, this.EnigmaToken);
      this.principal = new testUtils.Principal(this.Enigma, this.accounts[9]);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(`Failed to load web3, accounts, or contracts. Check console for details.`)
      console.log(error)
    }
  }

  /*
   * Simulates the setup of the principal node.
   */
  async setup() {
    // register the principal node
    this.principal.register()
    .then (result => {
      const event = result.logs[0];
      if (!event.args._success) {
        throw 'Unable to register worker';
      }
      // set workers parameters
      return this.principal.setWorkersParams();
    })
    .then (result => {
      const event = result.logs[0];
      if (!event.args._success) {
        throw 'Unable to set worker params';
      }
      console.log ('network using random seed:', event.args.seed.toNumber());
    })
    .catch(err => {
      console.log(err);
    })
  }
}

module.exports = EnigmaSetup
