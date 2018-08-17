// Vote.js, Andrew Tam

import React, { Component } from 'react';
import '../App.css';

// Material UI Components
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

const engUtils = require('../../enigma-lib/enigma-utils');
const GAS = 4712388;

const styles = theme => ({
  button: {
    marginLeft: '10px'
  },
  textField: {
    marginLeft: '20px',
    width: '75px'
  }
});

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
    var BN = this.props.objects.web3.utils.BN;
    if (event) event.preventDefault();

    let encryptedVote = getEncryptedVote(new BN(this.curVote.value));
    console.log("vote " + encryptedVote);

    // cast vote
    this.props.objects.Voting.castVote(parseInt(this.votePollID.value), encryptedVote,
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
      console.log(error);
      alert("Unable to cast vote. Either you have already voted, the poll has ended, or your parameters are invalid.");
    })
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <h3> Voting Operations: </h3>

        <List component="nav" disablePadding={true}>
          <ListItem>
            <form onSubmit={this.vote} id="vote_form">
              <label> Enter 0 to cast a "no" vote and enter 1 to cast a "yes" vote. Weight refers to the number
                      of voting credits that you will use.
              </label> <br />  <br /> 
              Vote:
              <TextField className={classes.textField} placeholder="Value" inputRef={element => this.curVote = element}/>
              <TextField className={classes.textField} placeholder="Weight" inputRef={element => this.curWeight = element}/>
              <TextField className={classes.textField} placeholder="Poll ID" inputRef={element => this.votePollID = element}/>
              <Button className={classes.button} type="submit" variant="outlined" size="small">Vote</Button>
            </form>
          </ListItem>
        </List>

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


Vote.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Vote);
