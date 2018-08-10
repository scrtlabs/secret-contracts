// Voting
const VotingToken = artifacts.require("./VotingToken.sol");
const TokenFactory = artifacts.require("./TokenFactory.sol");
const Voting = artifacts.require("./Voting.sol");
const EnigmaToken = artifacts.require("./EnigmaToken.sol");
const Enigma = artifacts.require("./Enigma.sol");
const Registry = artifacts.require("./Registry.sol");
const data = require('../data/data');

// Auctions
const Auction = artifacts.require("./Auction.sol");
const AuctionFactory = artifacts.require("./AuctionFactory.sol");

module.exports = function(deployer) {
  return deployer
    .then(() => {
      return deployer.deploy(EnigmaToken);
    })
    .then(() => {
      const principal = data.principal[0];
      return deployer.deploy(Enigma, EnigmaToken.address, principal);
    })
    .then(() => {
      return deployer.deploy(AuctionFactory, Enigma.address);
    })
    // .then(() => {
    //   return deployer.deploy(VotingToken);
    // })
    // .then(() => {
    //   return deployer.deploy(TokenFactory, VotingToken.address);
    // })
    // .then(() => {
    //   return deployer.deploy(Voting, VotingToken.address, Enigma.address);
    // })
    // .then(() => {
    //   return VotingToken.deployed().then(instance => instance.transferOwnership(TokenFactory.address))
    // })
    // .then(() => {
    //   return deployer.deploy(Registry, VotingToken.address, Voting.address, "Enigma Registry");
    // })
};
