// Import libraries and contract ABIs
const Web3 = require('web3');
const EthCrypto = require('eth-crypto');
const contract = require('truffle-contract');
const VotingContract = require ('../build/contracts/Voting.json');
// Contract ABIs below are imaginary
const EnigmaContract = require ('../build/contracts/Enigma.json');
const EnigmaTokenContract = require ('../build/contracts/EnigmaToken.json');

// Create Truffle Contract objects
const Enigma = contract(EnigmaContract);
const EnigmaToken = contract(EnigmaTokenContract);
const Voting = contract(VotingContract);

// Get web3 provider
Enigma.setNetwork(1);
const url = process.env.GANACHE_URL || 'http://localhost:8545';
const provider = new Web3.providers.HttpProvider (url);
const web3 = new Web3 (provider);
