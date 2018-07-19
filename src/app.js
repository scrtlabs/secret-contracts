// Import libraries
const Web3 = require('web3');
const contract = require('truffle-contract');

// Import Enigma libraries
const testUtils = require ('../enigma-lib/test-utils'); // for predicting gas prices
const web3Utils = require ('web3-utils');  // needed for converting to Wei amounts
const engUtils = require('../enigma-lib/enigma-utils');  // for simulating principal node
const eng = require('../enigma-lib/Enigma');  // used to create worker tasks

// constants
const GAS = 4712388;

import getWeb3 from './utils/getWeb3';
import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      curPoll: 0,  // global counter of which poll ID were are on
      // Depends on which Ganache account the user has selected
      curAccount: 0,
      tokenBalances: new Array(10).fill(0),
      // related to web3 setup
      web3: null,
      accounts: null,
      // Contract/Enigma specific variables
      Voting: null,
      VotingToken: null,
      TokenFactory: null,
      enigma: null,
      Enigma: null,
      EnigmaToken: null,
      principal: null,
      task: null,
      encryptedVotes: [],
      encryptedWeights: []
    }

    this.curTokenPurchase;
    this.curQuorumPct;
    this.curPollDescription;
    this.curPollID;
    this.curVote;
    this.tokenPurchase = this.tokenPurchase.bind(this);
    this.enigmaSetup = this.enigmaSetup.bind(this);
    this.accountChange = this.accountChange.bind(this);
    this.newPoll = this.newPoll.bind(this);
  }

  componentDidMount = async() => {
    try {
      // Use ganache for the web3 instance.
      console.log("Get web3");
      const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545')
      const web3 = new Web3(provider);

      // Use web3 to get the user's accounts.
      console.log("Get accounts");
      const accounts = await web3.eth.getAccounts();

      // Get the contracts
      console.log("Get contracts");
      const votingContract = contract(require('../build/contracts/Voting.json'));
      const tokenFactoryContract = contract(require('../build/contracts/TokenFactory.json'));
      const votingTokenContract = contract(require('../build/contracts/VotingToken.json'));
      const enigmaContract = contract(require('../build/contracts/Enigma.json'));
      const enigmaTokenContract = contract(require('../build/contracts/EnigmaToken.json'));
      enigmaContract.setNetwork(1);

      // Workaround for this issue: https://github.com/trufflesuite/truffle-contract/issues/57
      [enigmaContract, enigmaTokenContract, votingContract, tokenFactoryContract, votingTokenContract].forEach (instance => {
          instance.setProvider (provider);
          if (typeof instance.currentProvider.sendAsync !== "function") {
              instance.currentProvider.sendAsync = function () {
                  return instance.currentProvider.send.apply (
                      instance.currentProvider, arguments
                  );
              };
          }
      });

      // Get the deployed instances
      const Voting = await votingContract.deployed();
      const VotingToken = await votingTokenContract.deployed();
      const TokenFactory = await tokenFactoryContract.deployed();
      const Enigma = await enigmaContract.deployed();
      const EnigmaToken = await enigmaTokenContract.deployed();
      const enigma = new eng.Enigma(Enigma, EnigmaToken);
      const principal = new testUtils.Principal(Enigma, accounts[9]);

      this.setState({ web3, accounts, Voting, VotingToken, TokenFactory, enigma,
        Enigma, EnigmaToken, principal });
      this.enigmaSetup();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(`Failed to load web3, accounts, or contracts. Check console for details.`)
      console.log(error)
    }
  }

  enigmaSetup = async() => {
    this.state.principal.register()
    .then (result => {
      const event = result.logs[0];
      if (!event.args._success) {
        throw 'Unable to register worker';
      }
      return this.state.principal.setWorkersParams();
    })
    .then (result => {
      const event = result.logs[0];
      if (!event.args._success) {
        throw 'Unable to set worker params';
      }
      console.log ('network using random seed:', event.args.seed.toNumber ());
    })
    .catch(err => {
      console.log(err);
    })

  }

  accountChange(event) {
    this.setState({curAccount: event.target.value});
  }

  tokenPurchase(event){
    if (event) event.preventDefault();
    // Contribute to the Mintable Token Factory
    this.state.TokenFactory.contribute({
      from: this.state.accounts[this.state.curAccount],
      value: this.state.web3.utils.toWei(String(this.curTokenPurchase.value/10), "ether"),
      gas: GAS
    })
    .then(result => {
      // Update the state token balances
      const balances = this.state.tokenBalances;
      balances[this.state.curAccount] = parseInt(this.state.tokenBalances[this.state.curAccount]) + parseInt(this.curTokenPurchase.value);
      this.setState({
        tokenBalances: balances}, () => {
        alert('You purchased '+ this.curTokenPurchase.value + ' tokens.');
        document.getElementById("token_form").reset();
      });

      // Approve the token transfer
      this.state.VotingToken.approve(this.state.Voting.address, this.state.web3.utils.toWei(String(balances[this.state.curAccount]), "ether"), {
        from: this.state.accounts[this.state.curAccount],
        gas: GAS
      })
    })
    .catch(error => {
      alert("User does not have enough Ether. Please enter a smaller amount.");
    })
  }

  newPoll(event) {
    if (event) event.preventDefault();
    this.state.Voting.createPoll(parseInt(this.curQuorumPct.value), String(this.curPollDescription.value), {
      from: this.state.accounts[this.state.curAccount],
      gas: GAS
    })
    .then(result => {
      this.setState({curPoll: parseInt(this.state.curPoll) + parseInt(1) }, () => {
        alert("Poll was created!");
        document.getElementById("poll_form").reset();
      });
    })
    .catch(error => {
      alert("Unable to create poll. The quorum percentage must be less than or equal to 100.");
    })
  }

  /* LEAVE THIS FOR LATER */
  endPoll(event) {
    if (event) event.preventDefault();
  }

  vote(event) {
    if (event) event.preventDefault();
  }

  render() {
    if (!this.state.web3) {
      return <div> Loading web3... </div>
    }
    return(
      <div className="App">
        <hr />
        <div id="dashboard">
        <h3> Dashboard: </h3>
          <label> Current Poll ID: {this.state.curPoll} </label> <br />
          <label>
            Current Ganache Account:
            <select value={this.state.curAccount} onChange={this.accountChange}>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </label> <br />
          <label> Current Token Balance: {this.state.tokenBalances[this.state.curAccount]} </label>< br />
        </div>
        <hr />

        <div id="setup">
          <h3> Setup with Voting Tokens: </h3>
          <form onSubmit={this.tokenPurchase} id="token_form">
            <label> Insert the number of Voting Tokens you would like to purchase: </label>
            <input type="text" ref={(element) => { this.curTokenPurchase = element }} />
            <button> Submit </button>
          </form>
        </div>
        <hr />

        <div id="poll">
          <h3> Poll Operations: </h3>
          <form onSubmit={this.newPoll} id="poll_form">
            <label> Create a new poll with quorum percentage </label>
            <input type="text" ref={(element) => { this.curQuorumPct = element }} />
            <label> and poll description: </label>
            <input type="text" ref={(element) => { this.curPollDescription = element }} />
            <button> New Poll </button>
          </form>
          <br />

          <form onSubmit={this.endPoll} id="poll_form">
            <label> End poll with poll ID: </label>
            <input type="text" ref={(element) => { this.curPollID = element }} />
            <button> End Poll </button>
          </form>
        </div>
        <hr />

        <div id="voting">
          <h3> Voting Operations: </h3>
          <form onSubmit={this.vote} id="vote_form">
            <label> Vote with value </label>
            <input type="text" ref={(element) => { this.curVote = element }} />
            <label> in poll with poll ID: </label>
            <input type="text" ref={(element) => { this.curPollID = element }} />
            <button> Vote </button>
          </form>
        </div>
        <hr />

      </div>
    );
  }
}

export default App;
