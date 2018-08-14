// Poll.js, Andrew Tam

import React, { Component } from 'react';
import './App.css';

const CALLABLE = 'countVotes(uint,uint[],uint[])';
const CALLBACK = 'updatePollStatus(uint,uint,uint)';
const ENG_FEE = 1;
const GAS = 4712388;

class Poll extends Component {

  /* CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.newPoll = this.newPoll.bind(this);
    this.endPoll = this.endPoll.bind(this);
    this.enigmaTask = this.enigmaTask.bind(this);
    this.getPollStatus = this.getPollStatus.bind(this);
    this.curQuorumPct;
    this.curPollDescription;
    this.endPollID;
    this.statusPollID;
    this.votingPeriod
  }

  /*
   * Creates a new poll.
   */
  newPoll(event) {
    if (event) event.preventDefault();
    // create a new poll
    this.props.objects.Voting.createPoll(parseInt(this.curQuorumPct.value), String(this.curPollDescription.value),
      parseInt(this.votingPeriod.value), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })
    .then(result => {
      // update the App state
      this.props.update();
      alert("Poll was created!");
      document.getElementById("new_form").reset();
    })
    .catch(error => {
      alert("Unable to create poll. The quorum percentage must be less than or equal to 100.");
    })
  }

  /*
   * Allow a user to end a poll.
   */
  endPoll(event) {
    if (event) event.preventDefault();
    // end the poll
    this.props.objects.Voting.endPoll(parseInt(this.endPollID.value), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })
    .then(result => {
      // call the helper function to create an Enigma task
      this.enigmaTask(parseInt(this.endPollID.value));
      alert("The poll was successfully ended and an Enigma task will be created.");
      document.getElementById("end_form").reset();
    })
    .catch(error => {
      console.log(error);
      alert("Unable to end poll. Either the voting period has not expired or you are not the creator of the original poll.");
    })

  }

  /*
   * Creates an Enigma task to be computed by the network.
   */
  enigmaTask = async(pollID) => {
    let voters;
    let encryptedVotes = [];
    let weights = [];
    let task;

    // retrieve voter list
    voters = await this.props.objects.Voting.getVotersForPoll.call(parseInt(pollID), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })

    // get votes and weights for each voter
    for (let i = 0; i < voters.length; i++) {
      await this.props.objects.Voting.getPollInfoForVoter.call(parseInt(pollID), voters[i], {
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      })
      .then(result => {
        console.log(this.props.objects.web3.utils.toAscii(result[0]));
        encryptedVotes.push(this.props.objects.web3.utils.toAscii(result[0]));
        weights.push(parseInt(this.props.objects.web3.utils.fromWei(String(result[1].toNumber()), "Ether")))
      })
    }

    return this.props.objects.web3.eth.getBlockNumber()
    .then(blockNumber => {
      console.log("Create task.");
      // create an Enigma task
      return this.props.objects.enigma.createTask(
        blockNumber,
        this.props.objects.Voting.address,
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
      // approve a task fee
      return task.approveFee({
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      });
    })
    .then(result => {
      console.log("Compute task.");
      // compute the task
      return task.compute({
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      });
    })
    .then(result => {
      // check that the task was computed
      console.log ('got tx:', result.tx, 'for task:', task.taskId, '');
      console.log ('mined on block:', result.receipt.blockNumber);
      for (let i = 0; i < result.logs.length; i++) {
        let log = result.logs[i];
        console.log(log);
      }
    })
    .catch(error => {
      console.log(error);
    })
  }

  /*
   * Gets the status of a given poll.
   */
  getPollStatus(event) {
    if (event) event.preventDefault();
    // get the result
    return this.props.objects.Voting.getPollStatus(parseInt(this.statusPollID.value), {
      from: this.props.objects.accounts[this.props.curAccount]
    })
    // parse the output
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

  render() {
    return (
      <div>
        <h3> Poll Operations: </h3>
        <form onSubmit={this.newPoll} id="new_form">
          <label> Create a new poll with quorum percentage </label>
          <input type="text" ref={(element) => { this.curQuorumPct = element }} />
          <label> poll description </label>
          <input type="text" ref={(element) => { this.curPollDescription = element }} />
          <label> and voting period: (enter number of seconds): </label>
          <input type="text" ref={(element) => { this.votingPeriod = element }} />
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
    )
  }
}


export default Poll;
