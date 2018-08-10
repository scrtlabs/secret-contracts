// Import Enigma libraries
const testUtils = require ('../../enigma-lib/test-utils'); // for predicting gas prices
const web3Utils = require ('web3-utils');  // needed for converting to Wei amounts
const engUtils = require('../../enigma-lib/enigma-utils');  // for simulating principal node
const eng = require('../../enigma-lib/Enigma');  // used to create worker tasks

// Import web3 related libraries
const Web3 = require('web3');
const contract = require('truffle-contract');

// Import contract objects (use truffle-contract objects)
const Enigma = contract(require('../../build/contracts/Enigma.json'));
const EnigmaToken = contract(require('../../build/contracts/EnigmaToken.json'));
const Auction = contract(require('../../build/contracts/Auction.json'));
const AuctionFactory = contract(require('../../build/contracts/AuctionFactory.json'));

Enigma.setNetwork(1);

// set up web3 object
const argv = require('minimist') (process.argv.slice(2));
const url = argv.url || 'http://localhost:8545';
const provider = new Web3.providers.HttpProvider (url);
const web3 = new Web3 (provider);

// callable and callback can't have any whitespace
const CALLABLE = 'getHighestBidder(address[],uint[])';
const CALLBACK = 'updateWinner(address,uint)';
const ENG_FEE = 1;
const GAS = 4712388;

// Workaround for this issue: https://github.com/trufflesuite/truffle-contract/issues/57
[Enigma, EnigmaToken, Auction, AuctionFactory].forEach (instance => {
    instance.setProvider (provider);
    if (typeof instance.currentProvider.sendAsync !== "function") {
        instance.currentProvider.sendAsync = function () {
            return instance.currentProvider.send.apply (
                instance.currentProvider, arguments
            );
        };
    }
});

/////////////////////////////////////////////

let encryptedBids = [];
let addresses = [];

// Declare variables
let enigma;
let principal;
let enigmaContract;
let enigmaTokenContract;
let auctionAddress;
let auctionContract;
let auctionFactoryContract;
let accounts;
let auctionAccounts;

async function testAuction() {
  console.log('Test the auction contract.');

  let task;
  let auctionAddress;

  console.log("Create auction");
  return auctionFactoryContract.createAuction(10, {
    from: auctionAccounts[0],
    gas: GAS
  })
    .then(result => {
      console.log("Get auction address");
      return auctionFactoryContract.getAuctionAddresses();
    })
    .then(result => {
      console.log("Initialize auction contract instace")
      auctionAddress = result[0];
      auctionContract = Auction.at(auctionAddress);

      encryptedBids.push(10);
      addresses.push(auctionAccounts[0]);

      console.log("Bid from account 0");
      return auctionContract.bid(10, {
        from: auctionAccounts[0], gas: GAS
      });
    })
    .then(result => {

      encryptedBids.push(20);
      addresses.push(auctionAccounts[1]);

      console.log("Bid from account 1");
      return auctionContract.bid(20, {
        from: auctionAccounts[1], gas: GAS
      });
    })
    .then(result => {
      console.log("End auction from account 0");
      return auctionContract.endAuction({
        from: auctionAccounts[0], gas: GAS
      });
    })
    .then(result => {
      return web3.eth.getBlockNumber();
    })
    .then(blockNumber => {
      // Create an Enigma task
      console.log(addresses);

      console.log("Create task.");
      return enigma.createTask(
        blockNumber,
        auctionAddress,
        CALLABLE,
        [addresses, encryptedBids],
        CALLBACK,
        ENG_FEE,
        []
      );
    })
    .then(_task => {
      // Approve a fee for the task
      console.log("Approve task fee.");
      task = _task;
      return task.approveFee({
        from:web3.eth.defaultAccount,
        gas: GAS
      });
    })
    .then(result => {
      // Compute the task
      console.log("Compute task.");
      return task.compute({
        from: web3.eth.defaultAccount,
        gas: GAS
      });
    })
    .then(result => {
      // Check the transaction
      console.log ('got tx:', result.tx, 'for task:', task.taskId, '');
      console.log ('mined on block:', result.receipt.blockNumber);
      for (var i = 0; i < result.logs.length; i++) {
        var log = result.logs[i];
        console.log(log);
      }
      console.log("Get the winner");
      return auctionContract.getWinner();
    })
    .then(result => {
      console.log(result);
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

    // Create two auction accounts(which are neither the default account nor the custodial account)
    auctionAccounts = [];
    for (let i = 1; i < 3; i++) {
      auctionAccounts.push(accounts[i]);
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

    return AuctionFactory.deployed();
  })
  .then(result => {
    auctionFactoryContract = result;
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
    testAuction();
  })
  .catch(err => {
    console.log(err);
  })
