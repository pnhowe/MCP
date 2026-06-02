import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ErrorPanel from './ErrorPanel';
import { Box, CircularProgress, Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { fetchQueueItemList } from '../store/queueItemsSlice';
import type { Processor_QueueItem } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { dateStr } from '../lib/utils';

interface Props {
  projectName?: string;
}

const QueueItemList: React.FC<Props> = ( { projectName } ) =>
{
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector( ( s: RootState ) => s.app.authenticated );
  const { list, loading, error } = useSelector( ( s: RootState ) => s.queueItems );
  const [expandedIds, setExpandedIds] = useState<Set<number>>( new Set() );

  const fetchData = useCallback( () =>
  {
    if ( !authenticated ) return;
    dispatch( fetchQueueItemList( projectName ) );
  }, [authenticated, dispatch, projectName] );

  useEffect( () => { fetchData(); }, [fetchData] );

  const toggleExpand = ( id: number ) =>
    setExpandedIds( ( prev ) =>
    {
      const next = new Set( prev );
      if ( next.has( id ) ) next.delete( id );
      else next.add( id );
      return next;
    } );

  const renderResourceStatusMap = ( map: Record<string, any> | undefined ) =>
  {
    if ( !map || Object.keys( map ).length === 0 )
      return <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>No resource status entries.</Typography>;
    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Resource</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          { Object.entries( map ).map( ( [resource, status] ) => (
            <TableRow key={ resource }>
              <TableCell>{ resource }</TableCell>
              <TableCell>{ typeof status === 'object' ? JSON.stringify( status ) : String( status ) }</TableCell>
            </TableRow>
          ) ) }
        </TableBody>
      </Table>
    );
  };

  if ( loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
  if ( error ) return <ErrorPanel error={ error } onRetry={ fetchData } />;

  const items: Processor_QueueItem[] = list || [];

  if ( items.length === 0 ) return <Typography variant="body2" color="text.secondary">No queued items.</Typography>;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox" />
          { projectName === undefined && <TableCell>Project</TableCell> }
          <TableCell>Priority</TableCell>
          <TableCell>Build</TableCell>
          <TableCell>Branch</TableCell>
          <TableCell>Target</TableCell>
          <TableCell>Manual</TableCell>
          <TableCell>Created</TableCell>
          <TableCell>Updated</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        { items.map( ( item ) =>
        {
          const expanded = expandedIds.has( item.id );
          const colSpan = ( projectName === undefined ? 9 : 8 );
          return (
            <React.Fragment key={ item.id.toString() }>
              <TableRow>
                <TableCell padding="checkbox">
                  <IconButton size="small" onClick={ () => toggleExpand( item.id ) }>
                    { expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" /> }
                  </IconButton>
                </TableCell>
                { projectName === undefined && <TableCell>{ item.project?.name }</TableCell> }
                <TableCell>{ item.priority }</TableCell>
                <TableCell>{ item.build?.key }</TableCell>
                <TableCell>{ item.branch }</TableCell>
                <TableCell>{ item.target }</TableCell>
                <TableCell>{ item.manual ? 'Yes' : 'No' }</TableCell>
                <TableCell>{ dateStr( item.created ) }</TableCell>
                <TableCell>{ dateStr( item.updated ) }</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={ colSpan } sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
                  <Collapse in={ expanded } unmountOnExit>
                    <Box sx={{ py: 1, pl: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Resource Status Map</Typography>
                      { renderResourceStatusMap( item.resource_status_map as Record<string, any> | undefined ) }
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          );
        } ) }
      </TableBody>
    </Table>
  );
};

export default QueueItemList;
