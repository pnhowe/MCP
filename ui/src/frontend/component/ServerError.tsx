import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface ServerErrorState {
  open: boolean;
  title: string;
  trace: string;
}

class ServerError extends React.Component<{}, ServerErrorState>
{
  state: ServerErrorState = { open: false, title: '', trace: '' };

  show( title: string, trace: string )
  {
    this.setState( { open: true, title, trace } );
  }

  render()
  {
    return (
      <Dialog open={ this.state.open } onClose={ () => this.setState( { open: false } ) } maxWidth="md" fullWidth>
        <DialogTitle>{ this.state.title }</DialogTitle>
        <DialogContent>
          <Typography component="pre" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            { this.state.trace }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => this.setState( { open: false } ) }>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default ServerError;
