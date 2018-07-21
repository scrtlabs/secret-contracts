// App.js, Andrew Tam
// Some notes:
//  -Apparently I'm doing this.setState wrong
//  -Urgently need to decompose this into multiple files(decompose sections into their own components?)
//  -Not sure if the convention is right of having so many state variables
//  -Need to add encryption
//  -Be consistent with let/var

// Import libraries
const Web3 = require('web3');
const contract = require('truffle-contract');

// Import Enigma libraries
const testUtils = require ('../enigma-lib/test-utils'); // for predicting gas prices
const web3Utils = require ('web3-utils');  // needed for converting to Wei amounts
const engUtils = require('../enigma-lib/enigma-utils');  // for simulating principal node
const eng = require('../enigma-lib/Enigma');  // used to create worker tasks

// constants
const CALLABLE = 'countVotes(uint256,uint256[],uint256[])';
const CALLBACK = 'updatePollStatus(uint256,uint256,uint256)';
const ENG_FEE = 1;
const GAS = 4712388;

import getWeb3 from './utils/getWeb3';
import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      curPoll: 0,  // global counter of which poll ID were are on
      curAccount: 0,
      tokenBalances: new Array(10).fill(0),
      web3: null,
      accounts: null,
      Voting: null,
      VotingToken: null,
      TokenFactory: null,
      enigma: null,
      Enigma: null,
      EnigmaToken: null,
      principal: null
    }

    this.curTokenPurchase;
    this.curQuorumPct;
    this.curPollDescription;
    this.votePollID;
    this.endPollID;
    this.curVote;
    this.curWeight;
    this.statusPollID;
    this.withdrawAmount;
    this.withdrawPollID;
    this.tokenPurchase = this.tokenPurchase.bind(this);
    this.enigmaSetup = this.enigmaSetup.bind(this);
    this.accountChange = this.accountChange.bind(this);
    this.newPoll = this.newPoll.bind(this);
    this.vote = this.vote.bind(this);
    this.endPoll = this.endPoll.bind(this);
    this.enigmaTask = this.enigmaTask.bind(this);
    this.getPollStatus = this.getPollStatus.bind(this);
    this.withdraw = this.withdraw.bind(this);
  }

  componentDidMount = async() => {
    try {
      // Use ganache for the web3 instance.
      console.log("Get web3");
      // const argv = require('minimist') (process.argv.slice(2));
      // const url = argv.url || 'http://localhost:8545';
      const provider = new Web3.providers.HttpProvider ("http://ibm.enigma.co:10000");
      const web3 = new Web3 (provider);

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
        document.getElementById("new_form").reset();
      });
    })
    .catch(error => {
      alert("Unable to create poll. The quorum percentage must be less than or equal to 100.");
    })
  }

  /* LEAVE THIS FOR LATER */
  // 1. Create task and set ENG_FEE
  endPoll(event) {
    if (event) event.preventDefault();
    this.state.Voting.endPoll(parseInt(this.endPollID.value), {
      from: this.state.accounts[this.state.curAccount],
      gas: GAS
    })
    .then(result => {
      this.enigmaTask(parseInt(this.endPollID.value));
      alert("The poll was successfully ended and an Enigma task will be created.");
      document.getElementById("end_form").reset();
    })
    .catch(error => {
      console.log(error);
      alert("Unable to end poll. You must be the creator of the original poll.");
    })

  }

  enigmaTask = async(pollID) => {
    let voters;
    let voterInfo;
    let encryptedVotes;
    let weights;
    let task;

    this.state.Voting.getInfoForPoll.call(parseInt(pollID), {
      from: this.state.accounts[this.state.curAccount],
      gas: GAS
    })
    .then(result => {
      console.log("Get all of the votes and weights");
      encryptedVotes = result[0].map(encryptedVote => encryptedVote.toNumber());
      weights = result[1].map(weight => {
        return parseInt(this.state.web3.utils.fromWei(String(weight.toNumber()), "Ether"));
      });
      return this.state.web3.eth.getBlockNumber();
    })
    .then(blockNumber => {
      console.log("Create task.");
      return this.state.enigma.createTask(
        blockNumber,
        this.state.Voting.address,
        CALLABLE,
        [parseInt(pollID), encryptedVotes, weights],
        CALLBACK,
        ENG_FEE,
        []
      );
    })
    .then(_task => {
      console.log("Approve task fee.");
      task = _task;
      return task.approveFee({
        from: this.state.accounts[this.state.curAccount],
        gas: GAS
      });
    })
    .then(result => {
      console.log("Compute task.");
      return task.compute({
        from: this.state.accounts[this.state.curAccount],
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
    })
    .catch(error => {
      console.log(error);
    })
  }

  // TODO: Add encryption
  vote(event) {
    if (event) event.preventDefault();
    this.state.Voting.castVote(parseInt(this.votePollID.value), parseInt(this.curVote.value),
      this.state.web3.utils.toWei(String(parseInt(this.curWeight.value)), "ether"), {
      from: this.state.accounts[this.state.curAccount],
      gas: GAS
    })
    .then(result => {
      const balances = this.state.tokenBalances;
      balances[this.state.curAccount] = parseInt(this.state.tokenBalances[this.state.curAccount]) - parseInt(this.curWeight.value);
      this.setState({ tokenBalances: balances}, () => {
        document.getElementById("vote_form").reset();
        alert('Vote casted!');
      });
    })
    .catch(error => {
      alert("Unable to cast vote. Either you have already voted, the poll has ended, or your parameters are invalid.");
    })
  }

  getPollStatus(event) {
    if (event) event.preventDefault();
    this.state.Voting.getPollStatus(parseInt(this.statusPollID.value), {
      from: this.state.accounts[this.state.curAccount]
    })
    .then(result => {
      let status = result.toNumber();
      if (status == 0) {
        alert("Poll is in progress.");
      }
      else if (status == 1) {
        alert("The votes are being tallied right now...");
      }
      else if (status == 2) {
        alert("The poll was passed!");
      }
      else {
        alert("The poll was rejected.");
      }
      document.getElementById("status_form").reset();
    })
    .catch(error => {
      alert("Invalid poll ID entered.");
    })
  }

  withdraw(event) {
    if (event) event.preventDefault();
    this.state.Voting.withdrawTokens(
      this.state.web3.utils.toWei(String(this.withdrawAmount.value), "Ether"), parseInt(this.withdrawPollID.value), {
        from: this.state.accounts[this.state.curAccount],
        gas: GAS
    })
    .then(result => {
      alert("You have successfully withdrawn " + this.withdrawAmount.value + " tokens.");
      document.getElementById("withdraw_form").reset();
    })
    .catch(error => {
      alert("Either you are trying to withdraw too many tokens, you did not vote in the poll, or the poll ID is invalid.");
    })
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

        <div id="tokens">
          <h3> Tokens Operations: </h3>
          <form onSubmit={this.tokenPurchase} id="token_form">
            <label> Insert the number of Voting Tokens you would like to purchase: </label>
            <input type="text" ref={(element) => { this.curTokenPurchase = element }} />
            <button> Submit </button>
          </form> <br />

          <form onSubmit={this.withdraw} id="withdraw_form">
            <label> Insert the number of Voting Tokens you would like to withdraw: </label>
            <input type="text" ref={(element) => { this.withdrawAmount = element }} />

            <label> from poll ID: </label>
            <input type="text" ref={(element) => { this.withdrawPollID = element }} />
            <button> Submit </button>
          </form>
        </div>
        <hr />

        <div id="poll">
          <h3> Poll Operations: </h3>
          <form onSubmit={this.newPoll} id="new_form">
            <label> Create a new poll with quorum percentage </label>
            <input type="text" ref={(element) => { this.curQuorumPct = element }} />
            <label> and poll description: </label>
            <input type="text" ref={(element) => { this.curPollDescription = element }} />
            <button> New Poll </button>
          </form>
          <br />

          <form onSubmit={this.endPoll} id="end_form">
            <label> End poll with poll ID: </label>
            <input type="text" ref={(element) => { this.endPollID = element }} />
            <button> End Poll </button>
          </form>
          <br />

          <form onSubmit={this.getPollStatus} id="status_form">
            <label> Get the status of the poll with ID: </label>
            <input type="text" ref={(element) => { this.statusPollID = element }} />
            <button> Get Status </button>
          </form>
        </div>

        <hr />
        <div id="voting">
          <h3> Voting Operations: </h3>
          <p> Enter a 0 for "no" and a 1 for "yes". Weight refers to the number of voting tokens that you will use. </p>
          <form onSubmit={this.vote} id="vote_form">
            <label> Vote with value </label>
            <input type="text" ref={(element) => { this.curVote = element }} />

            <label> and weight </label>
            <input type="text" ref={(element) => { this.curWeight = element }} />

            <label> in poll with poll ID: </label>
            <input type="text" ref={(element) => { this.votePollID = element }} />
            <button> Vote </button>
          </form>
        </div>
        <hr />
      </div>
    );
  }
}

// NOT USED YET
function getEncryptedVote(vote) {
  let clientPrivKey = '853ee410aa4e7840ca8948b8a2f67e9a1c2f4988ff5f4ec7794edf57be421ae5';
  let enclavePubKey = '0061d93b5412c0c99c3c7867db13c4e13e51292bd52565d002ecf845bb0cfd8adfa5459173364ea8aff3fe24054cca88581f6c3c5e928097b9d4d47fce12ae47';
  let derivedKey = engUtils.getDerivedKey (enclavePubKey, clientPrivKey);
  let encrypted = engUtils.encryptMessage (derivedKey, vote);
  return encrypted;
}


export default App;
