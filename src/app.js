// Import libraries
const Web3 = require('web3');
const contract = require('truffle-contract');
import React, { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Need to fill this in later
      numPolls: 0,
      web3: null
    }
  }

  componentDidMount() {
    // Initialize web3
    if (typeof web3 !== 'undefined') {
      console.log("Using web3 detected from external source like Metamask.");
      this.web3 = new Web3(this.web3.currentProvider);
    } else {
      console.log("No web3 detected. Using http://localhost:8545. Consider switching to Metamask.")
      this.web3 = new Web3(new this.web3.providers.HttpProvider("http://localhost:8545"));
    }
    this.web3.eth.getBlock('latest').then(console.log)
  }

  //   // Import contracts
  //   const Voting = contract(require ('../build/contracts/Voting.json'));
  //   const TokenFactory = contract(require('../build/contracts/TokenFactory.json'));
  //   const Token = contract(require('../build/contracts/VotingToken.json'));
  //
  // }
  render() {
    return(
      <div> Testing </div>
    );
  }
}

export default App;
