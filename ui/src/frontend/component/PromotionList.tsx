import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ErrorPanel from './ErrorPanel';
import { Box, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { fetchPromotionList } from '../store/promotionsSlice';
import type { RootState, AppDispatch } from '../store';
import { dateStr } from '../lib/utils';

const PromotionList: React.FC = () =>
{
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector( ( s: RootState ) => s.app.authenticated );
  const { list, loading, error } = useSelector( ( s: RootState ) => s.promotions );

  const fetchData = useCallback( () =>
  {
    if ( !authenticated ) return;
    dispatch( fetchPromotionList() );
  }, [authenticated, dispatch] );

  useEffect( () => { fetchData(); }, [fetchData] );

  if ( loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
  if ( error ) return <ErrorPanel error={ error } onRetry={ fetchData } />;

  const items = list || [];

  if ( items.length === 0 ) return <Typography variant="body2" color="text.secondary">No promotions in process.</Typography>;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tag</TableCell>
          <TableCell>Result Map</TableCell>
          <TableCell>Created</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        { items.map( ( item ) => (
          <TableRow key={ item.id.toString() }>
            <TableCell>{ item.tag }</TableCell>
            <TableCell>{ JSON.stringify( item.result_map ) }</TableCell>
            <TableCell>{ dateStr( item.created ) }</TableCell>
          </TableRow>
        ) ) }
      </TableBody>
    </Table>
  );
};

export default PromotionList;
