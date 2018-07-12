// voting.js, Andrew Tam
// This script simulates an Ethereum dApp that uses a secret voting contract.
// Check awaits
// Highly modeled after: https://github.com/enigmampc/enigma-contract/blob/master/integration/coin-mixer.js

const testUtils = require ('../enigma-lib/test-utils'); // for predicting gas prices
const web3Utils = require ('web3-utils');  // needed for converting to Wei amounts
const engUtils = require('../enigma-lib/enigma-utils');  // for simulating principal node
const eng = require('../enigma-lib/Enigma');  // used to create worker tasks
const EthCrypto = require('eth-crypto');  // also for simulating principal node
const Web3 = require('web3');
const contract = require('truffle-contract');
const data = require ('../data/data');  // used for principal node data

// Import contract objects (use truffle-contract objects)
const Enigma = contract(require('../build/contracts/Enigma.json'));
const EnigmaToken = contract(require('..build/contracts/EnigmaToken.json'));
const Voting = contract(require('../build/contracts/Voting.json'));
const TokenFactory = contract(require('../build/contracts/TokenFactory.json'));
const VotingToken = contract(require('../build/contracts/VotingToken.json'));

Enigma.setNetwork(1);  // unsure about this line

// set up web3 object
const url = process.env.GANACHE_URL || 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(url));

// set up gas amounts
const GAS_PRICE_GWEI = '9'  // this is a magic number that comes from https://ethgasstation.info/
let gasTracker = new testUtils.GasTracker(web3, GAS_PRICE_GWEI);

// simulate the principal node using this Intel certificate
const principal = data.principal;

/* TODO
const callable = ...
const callback = ...
*/
const encryptedVotes = [
  1, 0
]

// Declare variables
let enigma;
let Register;
let enigmaContract;
let enigmaTokenContract;

let votingContract;
let tokenFactoryContract;
let votingTokenContract;

let principalCustodian;
let votingAccounts;

web3.eth.getAccounts()
  .then (accounts => {
    // Set the web3 default account to the first Ganache account and set the principal node to the last account
    web3.eth.defaultAccount = accounts[0];
    principalCustodian = accounts[9];

    // Create two voting accounts(which are neither the default account nor the custodial account)
    votingAccounts = [];
    for (let i = 1; i < 3; i++) {
      votingAccounts.push(accounts[i]);
    }

    // create Enigma contract objects
    enigmaContract = await Enigma.deployed();
    enigmaTokenContract = await EnigmaToken.deployed();
    enigma = new eng.Enigma(enigmaContract, enigmaTokenContract);

    // create Voting contract objects
    votingContract = await Voting.deployed();
    tokenFactoryContract = await TokenFactory.deployed();
    votingTokenContract = await VotingToken.deployed();

    // Need to know more about this
    Register = enigmaContract.Register({ fromBlock: 0 });
    Register.watch(handleRegister);
    console.log('Waiting for Register events...');

    /* Simulate the registering of the principal node. */
    console.log('registering principal', principal[0]);
    const report = engUtils.encodeReport(
      principal[1],
      principal[2],
      principal[3]
    );

    return enigmaContract.register(
      principal[0], report, {
          from: principalCustodian,
          gas: 4712388,
          gasPrice: web3Utils.toWei(GAS_PRICE_GWEI, 'gwei')
      }
    );
  })
  .then(result => {
    const event = result.logs[0];
    if (!event.args._success) {
      throw 'Unable to register principal node.';
    }
  });
  /* End of simulation */

function handleRegister(err, event) {
  console.log('Check that Register event was received: ', JSON.stringify (event.args));
  // Make sure that the given worker is not the principal node
  if (web3Utils.toChecksumAddress(event.args.custodian) == principalCustodian) {
    return false;
  }

  // Generate a random seed
  const seed = Math.floor(Math.random() * 100000);
  const hash = web3Utils.soliditySha3({ t: 'uint256', v: seed });

  /* Simulate principal node operations. */
  let task;
  let dealId;
  const depositAmount = web3Utils.toWei('1', 'ether');
  const sig = engUtils.sign(principal[4], hash);
  const signer = EthCrypto.recoverPublicKey(sig, hash);
  if (engUtils.toAddress(signer) !== principal[0]) throw 'Invalid principal signature';

  console.log('Updating workers parameters with seed', seed);
  enigmaContract.setWorkersParams(seed, sig, {
    from: principalCustodian,
    gas: 4712388,
    gasPrice: web3Utils.toWei(GAS_PRICE_GWEI, 'gwei')
  })
  .then(result => {
    gasTracker.logGasUsed(result, 'setWorkersParams');



  })

}
