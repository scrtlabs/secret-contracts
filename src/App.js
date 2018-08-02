// App.js, Andrew Tam
// Creates a simple dApp for secret voting.
// Note: Need to add encryption

// Import helper components
import EnigmaSetup from './utils/getContracts';
import Token from './Token';
import Poll from './Poll';
import Vote from './Vote';
import React, { Component } from 'react';
import './App.css';

class App extends Component {

  /* CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.state = {
      curPoll: 0,  // global counter of which poll ID were are on
      curAccount: 0,
      tokenBalances: new Array(10).fill(0),
      stakedTokens: new Array(10).fill(0),
      contractsObj: null
    }

    this.changeTokenBalances = this.changeTokenBalances.bind(this);
    this.changeStakedTokens = this.changeStakedTokens.bind(this);
    this.accountChange = this.accountChange.bind(this);
    this.incrementCurPoll = this.incrementCurPoll.bind(this);
  }

  /*
   * Invoked after the component is mounted.
   */
  componentDidMount() {
    let contractsObj = new EnigmaSetup();
    contractsObj.init().then(() => {
      contractsObj.setup();
      this.setState({contractsObj: contractsObj});
    })
  }

  /*
   * Update the account used by the dApp.
   */
  accountChange(event) {
    this.setState({curAccount: event.target.value});
  }

  /*
   * Update the token balances.
   */
  changeTokenBalances(balances) {
    this.setState({ tokenBalances: balances});
  }

  changeStakedTokens(tokens) {
    this.setState({ stakedTokens: tokens});
  }

  /*
   * Increment the poll ID by 1.
   */
  incrementCurPoll() {
    this.setState({ curPoll: parseInt(this.state.curPoll) + parseInt(1) });
  }

  /*
   * React render function.
   */
  render() {
    // wait for web3 and the contracts to be set up
    if (!this.state.contractsObj) {
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
          <label> Number of Staked Tokens: {this.state.stakedTokens[this.state.curAccount]} </label>
        </div>
        <hr />

        <Token objects={this.state.contractsObj} updateToken={this.changeTokenBalances} updateStake={this.changeStakedTokens}
          tokenBalances={this.state.tokenBalances} stakedTokens={this.state.stakedTokens} curAccount={this.state.curAccount}/>
        <hr />
        <Poll objects={this.state.contractsObj} update={this.incrementCurPoll} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount} />
        <hr />
        <Vote objects={this.state.contractsObj} update={this.changeTokenBalances} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount} />
      </div>
    );
  }
}


export default App;
