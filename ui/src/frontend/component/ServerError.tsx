import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import type { RootState, AppDispatch } from '../store';
import { clearServerError } from '../store/appSlice';

const ServerError: React.FC = () =>
{
  const dispatch = useDispatch<AppDispatch>();
  const serverError = useSelector( ( s: RootState ) => s.app.serverError );

  return (
    <Dialog open={ serverError !== null } onClose={ () => dispatch( clearServerError() ) } maxWidth="md" fullWidth>
      <DialogTitle>{ serverError?.msg }</DialogTitle>
      <DialogContent>
        <Typography component="pre" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          { serverError?.trace }
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={ () => dispatch( clearServerError() ) }>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServerError;
