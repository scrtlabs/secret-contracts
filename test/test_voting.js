// THIS TEST IS OUTDATED

const Voting = artifacts.require("./VotingAlt.sol");
const VotingToken = artifacts.require("./VotingToken.sol");
const TokenFactory = artifacts.require("./TokenFactory.sol");
const Enigma = artifacts.require("./Enigma.sol");
const EnigmaToken = artifacts.require("./EnigmaToken.sol");

contract('TokenFactory', async(accounts) => {
  it("Should give account 1 10 tokens in return for 1 Ether and then vote in a poll.", function() {
    return TokenFactory.deployed().then(async function(instance) {
      // 1. Buy 10 voting tokens from account 1.
      const transaction = await instance.contribute({from: web3.eth.accounts[1], gas:300000, value: web3.toWei(1, "ether")});
      const tokenAddr = await instance.token.call();
      const tokenInstance = VotingToken.at(tokenAddr);
      let amount = await tokenInstance.balanceOf(accounts[1]);
      assert.equal(amount.toNumber(), web3.toWei(10, "ether"), "Contributer did not receive 10 tokens.");

      // 2. Approve token transfer for account 1.
      const voting = await Voting.deployed();
      const token = await VotingToken.deployed();
      const approveResult = await token.approve(voting.address, web3.toWei(10, "ether"), {from:web3.eth.accounts[1]});

      // 3. Create poll 1 from account 0.
      await voting.createPoll(50, "Test Poll 1", {from: web3.eth.accounts[0]});
      let status = await voting.getPollStatus(1);
      const pollId = await voting.pollCount.call();
      assert.equal(status, 0, "Poll has expired.");
      assert.equal(pollId, 1, "Poll ID is not 1.");

      // 3. Create poll 2 from account 0.
      await voting.createPoll(50, "Test Poll 2", {from: web3.eth.accounts[0]});

      // 4. Stake 1 voting tokens.
      await voting.stakeVotingTokens(web3.toWei(10, "ether"), {from:web3.eth.accounts[1]});

      // 4. Vote in poll 1 with account 1.
      // NOTE for TESTING: Change pollId and/or Ether amount for testing.
      await voting.castVote(1, 1, web3.toWei(8, "ether"), {from: web3.eth.accounts[1]});
      let hasVoted = await voting.userHasVoted(1, web3.eth.accounts[1]);
      assert.equal(hasVoted, true, "User vote boolean did not change.");

      // 4. Vote in poll 2 with account 1.
      // NOTE for TESTING: Change pollId and/or Ether amount for testing.
      await voting.castVote(2, 1, web3.toWei(2, "ether"), {from: web3.eth.accounts[1]});
      hasVoted = await voting.userHasVoted(2, web3.eth.accounts[1]);
      assert.equal(hasVoted, true, "User vote boolean did not change.");

      // 5. End poll from account 0.
      // NOTE for TESTING: Change account for testing.
      await voting.endPoll(1, {from: web3.eth.accounts[0]});
      status = await voting.getPollStatus(1);
      assert.equal(status, 1, "Poll did not end.");

      // 6. Count votes and update the poll status.
      // NOTE for TESTING: Change arguments to countVotes & assertions
      const enigma = await Enigma.deployed();
      let [id, yeaVotes, nayVotes] = await voting.countVotes(1, [1], [10]);
      assert.equal(yeaVotes.toNumber(), 10);
      assert.equal(nayVotes.toNumber(), 0);
      await voting.updatePollStatus(id.toNumber(), yeaVotes.toNumber(), nayVotes.toNumber());
      const newPollStatus = await voting.getPollStatus(1);
      assert.equal(newPollStatus.toNumber(), 2, "Poll was not passed.");

      // 7. Withdraw tokens.
      // NOTE: Change withdrawal amount for testing.
      await voting.withdrawTokens(web3.toWei(8, "ether"), {from: web3.eth.accounts[1]});
      amount = await tokenInstance.balanceOf(accounts[1]);
      assert.equal(amount.toNumber(), web3.toWei(2, "ether"), "Contributer did not withdraw 2 tokens.");

    });
  });
})
