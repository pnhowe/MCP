import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ErrorPanel from './ErrorPanel';
import { Box, Button, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchBuildList } from '../store/buildsSlice';
import type { Project_Build } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { mcp } from '../store';

interface Props {
  projectName?: string;
}

const BuildList: React.FC<Props> = ( { projectName } ) =>
{
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector( ( s: RootState ) => s.app.authenticated );
  const { list, loading, error } = useSelector( ( s: RootState ) => s.builds );
  const [expanded, setExpanded] = useState<Record<string, boolean>>( {} );
  const [confirmItem, setConfirmItem] = useState<Project_Build | null>( null );
  const [queued, setQueued] = useState( false );

  const fetchData = useCallback( () =>
  {
    if ( !authenticated ) return;
    if ( projectName ) dispatch( fetchBuildList( projectName ) );
  }, [authenticated, dispatch, projectName] );

  useEffect( () => { fetchData(); }, [fetchData] );

  const toggleExpand = ( key: string ) =>
    setExpanded( ( e ) => ( { ...e, [key]: !e[key] } ) );

  const handleQueueConfirm = async () =>
  {
    if ( !confirmItem ) return;
    await mcp.Processor_QueueItem_call_queue( confirmItem, confirmItem.project?.release_branch ?? 'master', 50 );
    setQueued( true );
  };

  const handleQueueClose = () =>
  {
    setConfirmItem( null );
    setQueued( false );
  };

  if ( loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
  if ( error ) return <ErrorPanel error={ error } onRetry={ fetchData } />;

  const items: Project_Build[] = list || [];

  if ( items.length === 0 ) return <Typography variant="body2" color="text.secondary">No builds.</Typography>;

  return (
    <Box>
      { items.map( ( item ) =>
      {
        const isExpanded = !!expanded[item.key];
        return (
          <Box key={ item.key } sx={{ mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, cursor: 'pointer', flexGrow: 1 }} onClick={ () => toggleExpand( item.key ) }>
                { item.name }
              </Typography>
              <Button size="small" variant="contained" onClick={ () => { setConfirmItem( item ); setQueued( false ); } }>
                Queue Build
              </Button>
              <IconButton size="small" sx={{ ml: 0.5 }} onClick={ () => toggleExpand( item.key ) }>
                { isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> }
              </IconButton>
            </Box>
            <Collapse in={ isExpanded }>
              <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Dependencies</Typography>
                  <List dense disablePadding>
                    { ( item.dependancies || [] ).map( ( d ) => (
                      <ListItem key={ d.name } disablePadding>
                        <ListItemText primary={ d.name } primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ) ) }
                  </List>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Resources</Typography>
                  <List dense disablePadding>
                    { ( item.resources || [] ).map( ( r ) => (
                      <ListItem key={ r.name } disablePadding>
                        <ListItemText primary={ r.name } primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ) ) }
                  </List>
                </Box>
              </Box>
            </Collapse>
          </Box>
        );
      } ) }
      <Dialog open={ confirmItem !== null } onClose={ handleQueueClose }>
        <DialogTitle>Queue Build</DialogTitle>
        <DialogContent>
          { queued
            ? <Typography>Build "{ confirmItem?.name }" queued.</Typography>
            : <Typography>Queue build "{ confirmItem?.name }"?</Typography>
          }
        </DialogContent>
        <DialogActions>
          { queued
            ? <Button onClick={ handleQueueClose }>Close</Button>
            : <>
                <Button onClick={ handleQueueClose }>Cancel</Button>
                <Button variant="contained" onClick={ handleQueueConfirm }>Queue</Button>
              </>
          }
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuildList;
