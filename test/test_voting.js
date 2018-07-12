/*
 * Biggest issue: Converting from wei to token weights. Have to make sure the user cannot withdrawal more than allowed
 * since we're dealing with really large numbers(I think we get weird floating point arithmetic at some point).
 */

var Voting = artifacts.require("./Voting.sol");
var VotingToken = artifacts.require("./VotingToken.sol");
var TokenFactory = artifacts.require("./TokenFactory.sol");
var Enigma = artifacts.require("./Enigma.sol");
var EnigmaToken = artifacts.require("./EnigmaToken.sol");
const sleep = require('util').promisify(setTimeout)

contract('Voting', async(accounts) => {
  it("Should create a poll and the new poll ID should be 1.", function() {
    return Voting.deployed().then(async function(instance) {
      await instance.createPoll(50, 10000, "Test Poll", {from: web3.eth.accounts[1]});
      const isExpired = await instance.isPollExpired(1);
      const pollId = await instance.pollCount.call();
      assert.equal(false, isExpired);
      assert.equal(pollId, 1);
    });
  });
})

contract('TokenFactory', async(accounts) => {
  it("Should give account 1 10 tokens in return for 1 Ether and then vote in a poll.", function() {
    return TokenFactory.deployed().then(async function(instance) {
      // 1. Buy 10 voting tokens.
      const transaction = await instance.contribute({from: web3.eth.accounts[1], gas:300000, value: web3.toWei(1, "ether")});
      const tokenAddr = await instance.token.call();
      const tokenInstance = VotingToken.at(tokenAddr);
      let amount = await tokenInstance.balanceOf(accounts[1]);
      assert.equal(amount.toNumber(), web3.toWei(10, "ether"), "Contributer did not receive 10 tokens.");

      // 2. Approve token transfer.
      const voting = await Voting.deployed();
      const token = await VotingToken.deployed();
      const approveResult = await token.approve(voting.address, web3.toWei(10, "ether"), {from:web3.eth.accounts[1]});

      // 3. Create poll.
      // NOTE: Second argument of createPoll is in seconds.
      await voting.createPoll(50, 1, "Test Poll", {from: web3.eth.accounts[1]});
      const isExpired = await voting.isPollExpired(1);
      const pollId = await voting.pollCount.call();
      assert.equal(false, isExpired, "Poll has expired.");
      assert.equal(pollId, 1, "Poll ID is not 1.");

      // 4. Vote in poll.
      // NOTE: Change pollId and/or Ether amount for testing.
      await voting.castVote(1, true, web3.toWei(10, "ether"), {from: web3.eth.accounts[1]});
      const hasVoted = await voting.userHasVoted(1, web3.eth.accounts[1]);
      assert.equal(hasVoted, true, "User vote boolean did not change.");


      // 5. Withdraw tokens.
      // NOTE: Change withdrawal amount for testing.
      await sleep(1000);
      const enigma = await Enigma.deployed();




      const passed = await voting.isPollPassed(1);
      assert.equal(passed, true, "Poll was not passed.");
      await voting.withdrawTokens(web3.toWei(10, "ether"), 1, {from: web3.eth.accounts[1]});
      amount = await tokenInstance.balanceOf(accounts[1]);
      assert.equal(amount.toNumber(), web3.toWei(10, "ether"), "Contributer did not withdraw 10 tokens.");

    });
  });
})
