import React, { Component } from 'react';
import Snackbar from '@material-ui/core/Snackbar';

class Alert extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      dialog: ""
    }
  }

  openAlert(message) {
    this.setState({open: true});
    this.setState({dialog: message});
  }

  render() {
    return (
      <div>
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={this.state.open}
          onClose={ () => {this.setState({ open: false })}}
          autoHideDuration={2000}
          message={<span id="message-id">{this.state.dialog}</span>}
        />
      </div>
    )
  }
}

export default Alert;
