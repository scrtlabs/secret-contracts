// Token.js, Andrew Tam

import React, { Component } from 'react';
import './App.css';

const GAS = 4712388;

class Token extends Component {

  /* CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.curTokenPurchase;
    this.withdrawPollID;
    this.tokenPurchase = this.tokenPurchase.bind(this);
    this.withdraw = this.withdraw.bind(this);
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
      const balances = this.props.tokenBalances;
      balances[this.props.curAccount] = parseInt(this.props.tokenBalances[this.props.curAccount]) + parseInt(this.curTokenPurchase.value);
      this.props.update(balances);

      alert('You purchased '+ this.curTokenPurchase.value + ' tokens.');
      document.getElementById("token_form").reset();

      // Approve the token transfer
      this.props.objects.VotingToken.approve(this.props.objects.Voting.address, this.props.objects.web3.utils.toWei(String(balances[this.props.curAccount]), "ether"), {
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
      })
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
    return this.props.objects.Voting.withdrawTokens.call(parseInt(this.withdrawPollID.value), {
        from: this.props.objects.accounts[this.props.curAccount],
        gas: GAS
    })
    .then(result => {
      // update the app state
      const balances = this.props.tokenBalances;
      balances[this.props.curAccount] = this.props.objects.web3.utils.fromWei(String(result), 'ether');

      this.props.update(balances);
      alert("You have successfully withdrawn tokens.");
      document.getElementById("withdraw_form").reset();
    })
    .catch(error => {
      console.log(error);
      alert("Either you are trying to withdraw too many tokens, you did not vote in the poll, the poll ID is invalid, or it has not ended.");
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

        <form onSubmit={this.withdraw} id="withdraw_form">
          <label> Withdraw tokens from poll ID: </label>
          <input type="text" ref={(element) => { this.withdrawPollID = element }} />
          <button> Submit </button>
        </form>

      </div>
    )
  }

}

export default Token;
