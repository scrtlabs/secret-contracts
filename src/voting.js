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
const provider = new Web3.providers.HttpProvider (url);
const web3 = new Web3 (provider);

const CALLABLE = 'countVotes(uint256, uint256[], uint256[])';
const CALLBACK = 'updatePollStatus(uint256, uint256, uint256)';
const ENG_FEE = 1;
const GAS = 4712388;

// Workaround for this issue: https://github.com/trufflesuite/truffle-contract/issues/57
[Enigma, EnigmaToken, Voting, TokenFactory, VotingToken].forEach (instance => {
    instance.setProvider (provider);
    if (typeof instance.currentProvider.sendAsync !== "function") {
        instance.currentProvider.sendAsync = function () {
            return instance.currentProvider.send.apply (
                instance.currentProvider, arguments
            );
        };
    }
});


/* TODO
Other constants here...
*/

let encryptedVotes = [];
let weights = [];

// Declare variables
let enigma;
let principal;
let enigmaContract;
let enigmaTokenContract;
let votingContract;
let tokenFactoryContract;
let votingTokenContract;
let votingAccounts;
let accounts;

function testVoting() {
  console.log('Test the voting contract.');

  let task;

  // Buy voting tokens from the first voting account
  console.log("Buy voting tokens.");
  return tokenFactoryContract.contribute({
    from: votingAccounts[0],
    value: web3.utils.toWei("1", "ether"),
    gas: GAS
  })
    .then(result => {
      // Approve token transfer for Voting contract
      console.log("Approve token transfer.");
      return votingTokenContract.approve(votingContract.address, web3.utils.toWei("10", "ether"), {
        from:votingAccounts[0],
        gas: GAS
      });
    })
    .then(result => {
      // Create poll from default account
      console.log("Create poll.");
      return votingContract.createPoll(50, "Test Poll", {
        from: web3.eth.defaultAccount,
        gas: GAS
      });
    })
    .then(result => {
      // Have the first voting account vote in the new poll
      encryptedVotes.push(1);
      weights.push(10);
      console.log("Vote in poll.");
      return votingContract.castVote(1, 1, web3.utils.toWei("10", "ether"), {
        from:votingAccounts[0],
        gas: GAS
      });
    })
    .then(result => {
      // End poll from the default account
      console.log("End poll.");
      return votingContract.endPoll(1, {
        from: web3.eth.defaultAccount,
        gas: GAS
      });
    })
    .then(result => {
      return web3.eth.getBlockNumber();
    })
    .then(blockNumber => {
      console.log("Create task.");
      return enigma.createTask(
        blockNumber,
        votingContract.address,
        CALLABLE,
        [1, encryptedVotes, weights],
        CALLBACK,
        ENG_FEE,
        []
      );
    })
    .then(_task => {
      console.log("Approve task fee.");
      task = _task;
      return task.approveFee({
        from:web3.eth.defaultAccount,
        gas: GAS
      });
    })
    .then(result => {
      console.log("Compute task.");
      return task.compute({
        from: web3.eth.defaultAccount,
        gas: GAS
      });
    })
    .then(result => {
      console.log ('got tx:', result.tx, 'for task:', task.taskId, '');
      console.log ('mined on block:', result.receipt.blockNumber);
      for (var i = 0; i < result.logs.length; i++) {
        var log = result.logs[i];
        console.log(log);
      }
      setTimeout (() => {
        console.log ('waiting for the next worker to register...');
      }, 300);
    })
    .catch(err => {
      console.error(err);
    })
}

web3.eth.getAccounts()
  .then(_accounts => {
    accounts = _accounts;
    // Set the web3 default account to the first Ganache account
    web3.eth.defaultAccount = accounts[0];

    // Create two voting accounts(which are neither the default account nor the custodial account)
    votingAccounts = [];
    for (let i = 1; i < 3; i++) {
      votingAccounts.push(accounts[i]);
    }

    // create Enigma contract objects
    return Enigma.deployed();
  })
  .then(result => {
    enigmaContract = result;
    return EnigmaToken.deployed();
  })
  .then(result => {
    enigmaTokenContract = result;
    enigma = new eng.Enigma(enigmaContract, enigmaTokenContract);

    // set up principal node
    principal = new testUtils.Principal(enigmaContract, accounts[9]);

    return Voting.deployed();
  })
  .then(result => {
    votingContract = result;
    return TokenFactory.deployed();
  })
  .then(result => {
    tokenFactoryContract = result;
    return VotingToken.deployed();
  })
  .then(result => {
    votingTokenContract = result;
    return principal.register();
  })
  .then (result => {
    const event = result.logs[0];
    if (!event.args._success) {
      throw 'Unable to register worker';
    }
    return principal.setWorkersParams();
  })
  .then (result => {
    const event = result.logs[0];
    if (!event.args._success) {
      throw 'Unable to set worker params';
    }

    console.log ('network using random seed:', event.args.seed.toNumber ());

    testVoting();
  })
  .catch(err => {
    console.log(err);
  })

var altVoting = new web3.eth.Contract(require('../build/contracts/Voting.json').abi, '0x7b77acb30998e41685337b5413c2d71840b0ff38');
altVoting.events.pollPassed(function(error, result) {
  console.log("really??? nothing?????");
  console.log(result);
})


// NOT USED YET
function getEncryptedVote(vote) {
  let clientPrivKey = '853ee410aa4e7840ca8948b8a2f67e9a1c2f4988ff5f4ec7794edf57be421ae5';
  let enclavePubKey = '0061d93b5412c0c99c3c7867db13c4e13e51292bd52565d002ecf845bb0cfd8adfa5459173364ea8aff3fe24054cca88581f6c3c5e928097b9d4d47fce12ae47';
  let derivedKey = engUtils.getDerivedKey (enclavePubKey, clientPrivKey);
  let encrypted = engUtils.encryptMessage (derivedKey, vote);
  return encrypted;
}
