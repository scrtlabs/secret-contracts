// App.js, Andrew Tam
// Creates a simple dApp for secret voting.
// Note: Need to add encryption

// Import helper components
import EnigmaSetup from './utils/getContracts';
import Token from './components/Token';
import Poll from './components/Poll';
import Vote from './components/Vote';
import Instructions from './components/Instructions'
import React, { Component } from 'react';
import './App.css';

// Material UI Components
import PropTypes from 'prop-types';
import { withStyles, createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#000000'
    },
    secondary: {
      main: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: '"Titillium Web"'
  }
});

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    color: "primary"
  }
});

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
    const { classes } = this.props;

    // wait for web3 and the contracts to be set up
    if (!this.state.contractsObj) {
      return <div> Loading web3... </div>
    }
    return(
      <MuiThemeProvider theme={theme}>
      <div className="App">
        <Instructions />
        <Grid item xs={12}>
          <Paper>
            <div id="dashboard">
              <h3> Dashboard: </h3>
                <List style={{ display: 'flex', flexDirection: 'row'}}>
                <Grid item xs={3}>
                  <label> Current Poll ID: {this.state.curPoll} </label> <br />
                </Grid>
                <Grid item xs={3}>
                  <label>
                    Current Ganache Account:
                    <Select value={this.state.curAccount} onChange={this.accountChange} style={{ marginLeft: '10px' }}>
                      <MenuItem value={0}>0</MenuItem>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={4}>4</MenuItem>
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={7}>7</MenuItem>
                      <MenuItem value={8}>8</MenuItem>
                    </Select>
                  </label>
                </Grid>
                <Grid item xs={3}>
                  <label> Current Token Balance: {this.state.tokenBalances[this.state.curAccount]} </label>
                </Grid>
                <Grid item xs={3}>
                  <label> Number of Staked Tokens: {this.state.stakedTokens[this.state.curAccount]} </label>
                </Grid>
              </List>
            </div>
          </Paper>
        </Grid>
        <Grid container className={classes.root} spacing={16}>
          <Grid item xs={4}>
            <Paper className={classes.paper}>
              <Token objects={this.state.contractsObj} updateToken={this.changeTokenBalances} updateStake={this.changeStakedTokens}
              tokenBalances={this.state.tokenBalances} stakedTokens={this.state.stakedTokens} curAccount={this.state.curAccount}/>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper className={classes.paper}>
              <Poll objects={this.state.contractsObj} update={this.incrementCurPoll} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount} />
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper className={classes.paper}>
              <Vote objects={this.state.contractsObj} update={this.changeTokenBalances} tokenBalances={this.state.tokenBalances} curAccount={this.state.curAccount} />
            </Paper>
          </Grid>
        </Grid>
      </div>
      </MuiThemeProvider>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};


export default withStyles(styles)(App);
