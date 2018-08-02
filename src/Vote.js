// Vote.js, Andrew Tam

import React, { Component } from 'react';
import './App.css';

const engUtils = require('../enigma-lib/enigma-utils');  // for simulating principal node
const GAS = 4712388;

class Vote extends Component {

  /* CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.curVote;
    this.curWeight;
    this.votePollID;
    this.vote = this.vote.bind(this);
  }

  /*
   * Allows a user to vote for a given poll.
   * TODO: Add encryption
   */
  vote(event) {
    if (event) event.preventDefault();

    // cast vote
    this.props.objects.Voting.castVote(parseInt(this.votePollID.value), parseInt(this.curVote.value),
      this.props.objects.web3.utils.toWei(this.curWeight.value, "ether"), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })
    .then(result => {
      // update app state
      document.getElementById("vote_form").reset();
      alert('Vote casted!');
    })
    .catch(error => {
      alert("Unable to cast vote. Either you have already voted, the poll has ended, or your parameters are invalid.");
    })
  }

  render() {
    return (
      <div>
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
    )
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


export default Vote;
