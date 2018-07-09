/*
var VotingToken = artifacts.require("./VotingToken.sol");
var TokenFactory = artifacts.require("./TokenFactory.sol");

contract('TokenFactory', async(accounts) => {
  it("TokenFactory should contain the token.", function() {
    return TokenFactory.deployed().then(async function(instance) {
      const token = await instance.token.call();
      assert(token, "Couldn't add token to factory.");
    });
  });

  it("Should give 10 tokens in return for 1 Ether.", function() {
    return TokenFactory.deployed().then(async function(instance) {
      const transaction = await instance.contribute({from: web3.eth.accounts[1], gas:300000, value: web3.toWei(1, "ether")});
      const tokenAddr = await instance.token.call();
      const tokenInstance = VotingToken.at(tokenAddr);
      const amount = await tokenInstance.balanceOf(accounts[1]);
      assert.equal(amount.toNumber(), web3.toWei(10, "ether"), "Contributer did not receive 10 tokens.");
    });
  });
})
*/
