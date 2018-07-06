// INCOMPLETE

var VotingToken = artifacts.require("./VotingToken.sol");
var TokenFactory = artifacts.require("./TokenFactory.sol");
var Voting = artifacts.require("./Voting.sol");

module.exports = function(deployer) {
  return deployer
    .then(() => {
      return deployer.deploy(VotingToken);
    })
    .then(() => {
      return deployer.deploy(TokenFactory, VotingToken.address);
    })
    .then(() => {
      return deployer.deploy(Voting, VotingToken.address);
    })
};
