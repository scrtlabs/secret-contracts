// Token.js, Andrew Tam

import React, { Component } from 'react';
import './App.css';

const GAS = 4712388;

class Token extends Component {

  /* CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.curTokenPurchase;
    this.withdrawValue;
    this.stakeAmount;
    this.tokenPurchase = this.tokenPurchase.bind(this);
    this.withdraw = this.withdraw.bind(this);
    this.stakeTokens = this.stakeTokens.bind(this);
  }

  /*
   * Purchase tokens.
   */
  tokenPurchase(event){
    if (event) event.preventDefault();
    // Contribute to the Mintable Token Factory
    console.log("Contribute to the crowdsale");
    this.props.objects.TokenFactory.contribute({
      from: this.props.objects.accounts[this.props.curAccount],
      value: this.props.objects.web3.utils.toWei(String(this.curTokenPurchase.value/10), "ether"),
      gas: GAS
    })
    .then(result => {
      console.log("Update the state token balances")
      // Update the App state
      let balances = this.props.tokenBalances;
      balances[this.props.curAccount] = parseInt(this.props.tokenBalances[this.props.curAccount]) + parseInt(this.curTokenPurchase.value);
      this.props.updateToken(balances);

      alert('You purchased '+ this.curTokenPurchase.value + ' tokens.');
      document.getElementById("token_form").reset();
    })
    .catch(error => {
      alert("User does not have enough Ether. Please enter a smaller amount.");
    })
  }

  /*
   * Allow a user to withdraw tokens.
   */
  withdraw(event) {
    if (event) event.preventDefault();
    // withdraw tokens
    let amount = this.props.objects.web3.utils.toWei(this.withdrawValue.value, "ether");
    return this.props.objects.Voting.withdrawTokens(String(amount), {
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
    })
    .then(result => {
      // update the app state
      let balances = this.props.tokenBalances;
      balances[this.props.curAccount] += parseInt(this.withdrawValue.value);
      this.props.updateToken(balances);

      let staked = this.props.stakedTokens;
      staked[this.props.curAccount] -= parseInt(this.withdrawValue.value);
      this.props.updateStake(staked);


      alert("You have successfully withdrawn tokens.");
      document.getElementById("withdraw_form").reset();
    })
    .catch(error => {
      console.log(error);
      alert("You are trying to withdraw too many tokens.");
    })
  }

  stakeTokens(event) {
    if (event) event.preventDefault();
    // approve transfer
    this.props.objects.VotingToken.approve(this.props.objects.Voting.address,
      this.props.objects.web3.utils.toWei(this.stakeAmount.value, "ether"), {
      from: this.props.objects.accounts[this.props.curAccount],
      gas: GAS
    })
    .then(result => {
      // stake tokens
      let amount = this.props.objects.web3.utils.toWei(this.stakeAmount.value, "ether");
      return this.props.objects.Voting.stakeVotingTokens(String(amount), {
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      })
    })
    .then(result => {
      // update the app state

      // update token balance
      let balances = this.props.tokenBalances;
      balances[this.props.curAccount] -= parseInt(this.stakeAmount.value);
      this.props.updateToken(balances);

      // update staked token balance
      let staked = this.props.stakedTokens;
      staked[this.props.curAccount] += parseInt(this.stakeAmount.value)
      this.props.updateStake(staked);

      alert("You have successfully staked tokens.");
      document.getElementById("stake_form").reset();
    })
    .catch(error => {
      console.log(error);
      alert("You are trying to stake too many tokens.");
    })
  }

  render() {
    return(
      <div>
        <h3> Tokens Operations: </h3>

        <form onSubmit={this.tokenPurchase} id="token_form">
          <label> Insert the number of Voting Tokens you would like to purchase: </label>
          <input type="text" ref={(element) => { this.curTokenPurchase = element }} />
          <button> Submit </button>
        </form> <br />

        <form onSubmit={this.stakeTokens} id="stake_form">
          <label> Insert the number of Voting Tokens you would like to stake: </label>
          <input type="text" ref={(element) => { this.stakeAmount = element }} />
          <button> Submit </button>
        </form> <br />

        <form onSubmit={this.withdraw} id="withdraw_form">
          <label> Insert the number of Voting Tokens you would like to withdraw: </label>
          <input type="text" ref={(element) => { this.withdrawValue = element }} />
          <button> Submit </button>
        </form>

      </div>
    )
  }

}

export default Token;
