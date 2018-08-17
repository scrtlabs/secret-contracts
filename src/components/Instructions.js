// Template courtesy of: https://material-ui.com/demos/steppers/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = theme => ({
  root: {
    width: '90%',
  },
  button: {
    marginTop: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  actionsContainer: {
    marginBottom: theme.spacing.unit * 2,
  },
  resetContainer: {
    padding: theme.spacing.unit * 3,
  }
});

function getSteps() {
  return ['Select an account.', 'Buy voting tokens.', 'Stake voting tokens in the contract.',
          'Create a poll.', 'Vote in the poll.', 'End the poll.', 'Check the poll result.', 'Withdraw your tokens.'];
}

function getStepContent(step) {
  switch (step) {
    case 0:
      return `The default account is the first account (account 0) but you have the
              option of changing to a different account except for account number 9.`;
    case 1:
      return 'The current exchange rate is 1 Ether for 10 voting tokens.';
    case 2:
      return `The dApp will automatically approve the voting token
              transfer for you as well.`;
    case 3:
      return `Each poll is associated with a poll ID. There will be a label in the
              dashboard showing the poll ID of the current poll.`
    case 4:
      return `In the current implementation, a user can only vote
              once and cannot change vote/weights during the poll.`
    case 5:
      return `After the poll period has expired, only the creator of a poll can end that poll. Once the poll
              has ended, a selected SGX node on the Enigma Network will privately tally the votes and update the result of the poll.`
    case 6:
      return `All poll metrics are public including the final status of the poll and the
              number of "yes"and "no" votes casted. However, due to secret voting, there is no way to match voters with their vote choice.`
    case 7:
      return `You can only withdraw tokens that are not being used in other active polls.`
    default:
      return 'Unknown step';
  }
}

class Instructions extends Component {
  state = {
    activeStep: 0,
  };

  handleNext = () => {
    this.setState(state => ({
      activeStep: state.activeStep + 1,
    }));
  };

  handleBack = () => {
    this.setState(state => ({
      activeStep: state.activeStep - 1,
    }));
  };

  handleReset = () => {
    this.setState({
      activeStep: 0,
    });
  };

  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep } = this.state;

    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <h3>Instructions:</h3>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <div className={classes.root}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => {
              return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    <Typography>{getStepContent(index)}</Typography>
                    <div className={classes.actionsContainer}>
                      <div>
                        <Button disabled={activeStep === 0} onClick={this.handleBack} className={classes.button}>
                          Back
                        </Button>
                        <Button variant="contained" color="primary" onClick={this.handleNext} className={classes.button}>
                          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                      </div>
                    </div>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
          {activeStep === steps.length && (
            <Paper square elevation={0} className={classes.resetContainer}>
              <Button onClick={this.handleReset} className={classes.button} variant="outlined" size="small">
                Reset
              </Button>
            </Paper>
          )}
        </div>
        </ExpansionPanelDetails>
      </ExpansionPanel>

    );
  }
}

Instructions.propTypes = {
  classes: PropTypes.object,
};

export default withStyles(styles)(Instructions);
