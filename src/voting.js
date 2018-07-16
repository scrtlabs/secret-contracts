// voting.js, Andrew Tam
// This script simulates an Ethereum dApp that uses a secret voting contract.
// Check awaits
// Highly modeled after: https://github.com/enigmampc/enigma-contract/blob/develop/integration/coin-mixer.js

// Import Enigma libraries
const testUtils = require ('../enigma-lib/test-utils'); // for predicting gas prices
const web3Utils = require ('web3-utils');  // needed for converting to Wei amounts
const engUtils = require('../enigma-lib/enigma-utils');  // for simulating principal node
const eng = require('../enigma-lib/Enigma');  // used to create worker tasks

// Import web3 related libraries
const Web3 = require('web3');
const contract = require('truffle-contract');

// Import contract objects (use truffle-contract objects)
const Enigma = contract(require('../build/contracts/Enigma.json'));
const EnigmaToken = contract(require('../build/contracts/EnigmaToken.json'));
const Voting = contract(require('../build/contracts/Voting.json'));
const TokenFactory = contract(require('../build/contracts/TokenFactory.json'));
const VotingToken = contract(require('../build/contracts/VotingToken.json'));

Enigma.setNetwork(1);  // unsure about this line

// set up web3 object
const argv = require('minimist') (process.argv.slice(2));
const url = argv.url || 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(url));

const CALLABLE = 'countVotes(uint256, uint256[], uint256[])';
const CALLBACK = 'updatePollStatus(uint256, uint256, uint256)';
const ENG_FEE = 1;
/* TODO
Other constants here...
*/

let encryptedVotes;
let weights;

// Declare variables
let enigma;
let principal;
let Register;
let enigmaContract;
let enigmaTokenContract;
let votingContract;
let tokenFactoryContract;
let votingTokenContract;
let votingAccounts;
let accounts;

function handleRegister(err, event) {
  console.log('Confirm that Register event was received: ', JSON.stringify (event.args));
  // Make sure that the given worker is not the principal node
  if (web3Utils.toChecksumAddress(event.args.custodian) == principalCustodian) {
    return false;
  }

  /* Simulate principal node operations. */
  principal.setWorkersParams().then(result => async() => {
    const event = result.logs[0];
    if (!event.args._success) {
      throw 'Unable to set workers parameters.';
    }
    /* End simulation */

    // Buy voting tokens from the first voting account
    await tokenFactoryContract.contribute({ from: votingAccounts[0], value: web3.toWei(1, "ether")});

    // Approve token transfer for Voting contract
    await votingTokenContract.approve(votingContract.address, web3.toWei(10, "ether"), {from:votingAccounts[0]});

    // Create poll from default account
    await votingContract.createPoll(50, "Test Poll", {from: web3.eth.defaultAccount});

    // Have the first voting account vote in the new poll
    await votingContract.castVote(1, 1, web3.toWei(10, "ether"), {from:votingAccounts[0]});
    encryptedVotes.push(1);
    weights.push(10);

    // End poll from the default account
    await votingContract.endPoll(1, {from: web3.eth.defaultAccount});

    // Count votes and update poll status
    const task = await enigma.createTask(web3.eth.getBlockNumber(),
      votingContract.address,
      CALLABLE,
      [1, encryptedVotes, weights],
      CALLBACK,
      ENG_FEE
    );

    await task.approveFee({from:web3.eth.defaultAccount});
    return task.compute({from: web3.eth.defaultAccount});
  })
  .then(result => {
    console.log ('got tx:', result.tx, 'for task:', task.taskId, '');
    console.log ('mined on block:', result.receipt.blockNumber);
    setTimeout (() => {
      console.log ('waiting for the next worker to register...');
    }, 300);
  })
  .catch(err => {
    console.error(err);
    Register.stopWatching();
  })
}

web3.eth.getAccounts()
  .then (_accounts => async() => {
    accounts = _accounts;
    // Set the web3 default account to the first Ganache account
    web3.eth.defaultAccount = accounts[0];

    // Create two voting accounts(which are neither the default account nor the custodial account)
    votingAccounts = [];
    for (let i = 1; i < 3; i++) {
      votingAccounts.push(accounts[i]);
    }

    // create Enigma contract objects
    enigmaContract = await Enigma.deployed();
    enigmaTokenContract = await EnigmaToken.deployed();
    enigma = new eng.Enigma(enigmaContract, enigmaTokenContract);

    // set up principal node
    principal = new testUtils.Principal(enigmaContract, accounts[9]);

    // create Voting contract objects
    votingContract = await Voting.deployed();
    tokenFactoryContract = await TokenFactory.deployed();
    votingTokenContract = await VotingToken.deployed();

    // Need to know more about this
    Register = enigmaContract.Register({ fromBlock: 0 });
    Register.watch(handleRegister);
    console.log('Waiting for Register events...');

    /* Simulate the registering of the principal node. */
    return principal.register();
  })
  .catch (err => {
    console.log(err);
  });
  /* End of simulation */

// NOT USED YET
function getEncryptedVote(vote) {
  let clientPrivKey = '853ee410aa4e7840ca8948b8a2f67e9a1c2f4988ff5f4ec7794edf57be421ae5';
  let enclavePubKey = '0061d93b5412c0c99c3c7867db13c4e13e51292bd52565d002ecf845bb0cfd8adfa5459173364ea8aff3fe24054cca88581f6c3c5e928097b9d4d47fce12ae47';
  let derivedKey = engUtils.getDerivedKey (enclavePubKey, clientPrivKey);
  let encrypted = engUtils.encryptMessage (derivedKey, vote);
  return encrypted;
}
