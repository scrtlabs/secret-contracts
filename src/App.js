// App.js, Andrew Tam
// Some notes:
//  -Need to add encryption

import EnigmaSetup from './utils/getContracts';
import Token from './Token';
import Poll from './Poll';
import Vote from './Vote';
import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      curPoll: 0,  // global counter of which poll ID were are on
      curAccount: 0,
      tokenBalances: new Array(10).fill(0),
      contractsObj: null
    }

    this.changeTokenBalances = this.changeTokenBalances.bind(this);
    this.accountChange = this.accountChange.bind(this);
    this.incrementCurPoll = this.incrementCurPoll.bind(this);
  }

  componentWillMount() {
    let contractsObj = new EnigmaSetup();
    contractsObj.init().then(() => {
      contractsObj.setup();
      this.setState({contractsObj: contractsObj});
    })
  }

  accountChange(event) {
    this.setState({curAccount: event.target.value});
  }

  changeTokenBalances(balances) {
    this.setState({ tokenBalances: balances});
  }

  incrementCurPoll() {
    this.setState({ curPoll: parseInt(this.state.curPoll) + parseInt(1) });
  }

  render() {
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
        </div>
        <hr />

        <Token objects={this.state.contractsObj} update={this.changeTokenBalances} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount}/>
        <hr />
        <Poll objects={this.state.contractsObj} update={this.incrementCurPoll} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount} />
        <hr />
        <Vote objects={this.state.contractsObj} update={this.changeTokenBalances} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount} />
      </div>
    );
  }
}


export default App;
