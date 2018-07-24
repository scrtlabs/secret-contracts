import React, { Component } from 'react';

const CALLABLE = 'countVotes(uint256,uint256[],uint256[])';
const CALLBACK = 'updatePollStatus(uint256,uint256,uint256)';
const ENG_FEE = 1;
const GAS = 4712388;

class Poll extends Component {

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
  }

  newPoll(event) {
    if (event) event.preventDefault();
    this.props.objects.Voting.createPoll(parseInt(this.curQuorumPct.value), String(this.curPollDescription.value), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })
    .then(result => {
      this.props.update();
      alert("Poll was created!");
      document.getElementById("new_form").reset();
    })
    .catch(error => {
      alert("Unable to create poll. The quorum percentage must be less than or equal to 100.");
    })
  }

  /* LEAVE THIS FOR LATER */
  // 1. Create task and set ENG_FEE
  endPoll(event) {
    if (event) event.preventDefault();
    this.props.objects.Voting.endPoll(parseInt(this.endPollID.value), {
      from: this.props.objects.accounts[this.props.curAccount],
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

    this.props.objects.Voting.getInfoForPoll.call(parseInt(pollID), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })
    .then(result => {
      console.log("Get all of the votes and weights");
      encryptedVotes = result[0].map(encryptedVote => encryptedVote.toNumber());
      weights = result[1].map(weight => {
        return parseInt(this.props.objects.web3.utils.fromWei(String(weight.toNumber()), "Ether"));
      });
      return this.props.objects.web3.eth.getBlockNumber();
    })
    .then(blockNumber => {
      console.log("Create task.");
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
      return task.approveFee({
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      });
    })
    .then(result => {
      console.log("Compute task.");
      return task.compute({
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      });
    })
    .then(result => {
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

  getPollStatus(event) {
    if (event) event.preventDefault();
    this.props.objects.Voting.getPollStatus(parseInt(this.statusPollID.value), {
      from: this.props.objects.accounts[this.props.curAccount]
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

  render() {
    return (
      <div>
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
    )
  }
}

export default Poll;
