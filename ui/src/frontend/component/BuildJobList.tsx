import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ErrorPanel from './ErrorPanel';
import { Box, Button, Chip, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchBuildJobList } from '../store/buildJobsSlice';
import type { Processor_BuildJob } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { mcp } from '../store';
import { dateStr } from '../lib/utils';

interface Props {
  projectName?: string;
  showProject?: boolean;
}

const jobStateColor = ( state: string ): 'default' | 'info' | 'success' | 'error' | 'warning' =>
{
  if ( state === 'reported' ) return 'warning';
  if ( state === 'build' ) return 'info';
  if ( state === 'error' ) return 'error';
  return 'default';
};

const BuildJobList: React.FC<Props> = ( { projectName, showProject } ) =>
{
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector( ( s: RootState ) => s.app.authenticated );
  const { list, loading, error } = useSelector( ( s: RootState ) => s.buildJobs );
  const [expanded, setExpanded] = useState<Record<string, boolean>>( {} );
  const [detailOpen, setDetailOpen] = useState( false );
  const [detailContent, setDetailContent] = useState( '' );
  const [confirmAction, setConfirmAction] = useState<{ type: 'acknowledge' | 'jobRan'; id: number } | null>( null );
  const [actionDone, setActionDone] = useState( false );

  const fetchData = useCallback( () =>
  {
    if ( !authenticated ) return;
    dispatch( fetchBuildJobList( projectName ) );
  }, [authenticated, dispatch, projectName] );

  useEffect( () => { fetchData(); }, [fetchData] );

  const toggleExpand = ( key: string ) =>
    setExpanded( ( e ) => ( { ...e, [key]: !e[key] } ) );

  const handleConfirm = async () =>
  {
    if ( !confirmAction ) return;
    if ( confirmAction.type === 'acknowledge' )
      await mcp.Processor_BuildJob_call_acknowledge( confirmAction.id );
    else
      await mcp.Processor_BuildJob_call_jobRan( confirmAction.id );
    setActionDone( true );
    dispatch( fetchBuildJobList( projectName ) );
  };

  const handleConfirmClose = () =>
  {
    setConfirmAction( null );
    setActionDone( false );
  };

  const handleDetail = async ( instanceId: number ) =>
  {
    const result = await mcp.Processor_BuildJobResourceInstance_call_getHostDetail( instanceId );
    setDetailOpen( true );
    setDetailContent( JSON.stringify( result, null, 2 ) );
  };

  const renderActions = ( item: Processor_BuildJob ) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      { item.state === 'reported' && ( item.manual || !item.succeeded ) &&
        <Button size="small" variant="contained" onClick={ ( e ) => { e.stopPropagation(); setConfirmAction( { type: 'acknowledge', id: item.id } ); setActionDone( false ); } }>Acknowledge</Button>
      }
      { item.state === 'build' && ( item.manual || !item.succeeded ) &&
        <Button size="small" variant="contained" color="error" onClick={ ( e ) => { e.stopPropagation(); setConfirmAction( { type: 'jobRan', id: item.id } ); setActionDone( false ); } }>Force Ran</Button>
      }
    </Box>
  );

  const detailDialog = (
    <Dialog open={ detailOpen } onClose={ () => setDetailOpen( false ) } maxWidth="md" fullWidth>
      <DialogTitle>Resource Detail</DialogTitle>
      <DialogContent>
        <Box component="pre" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
          { detailContent }
        </Box>
      </DialogContent>
    </Dialog>
  );

  const confirmLabel = confirmAction?.type === 'acknowledge' ? 'Acknowledge this job?' : 'Force mark this job as ran?';
  const confirmDoneLabel = confirmAction?.type === 'acknowledge' ? 'Acknowledged.' : 'Marked as ran.';
  const confirmDialog = (
    <Dialog open={ confirmAction !== null } onClose={ handleConfirmClose }>
      <DialogTitle>Confirm</DialogTitle>
      <DialogContent>
        <Typography>{ actionDone ? confirmDoneLabel : confirmLabel }</Typography>
      </DialogContent>
      <DialogActions>
        { actionDone
          ? <Button onClick={ handleConfirmClose }>Close</Button>
          : <>
              <Button onClick={ handleConfirmClose }>Cancel</Button>
              <Button variant="contained" onClick={ handleConfirm }>Confirm</Button>
            </>
        }
      </DialogActions>
    </Dialog>
  );

  if ( loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
  if ( error ) return <ErrorPanel error={ error } onRetry={ fetchData } />;

  const items: Processor_BuildJob[] = list || [];

  if ( items.length === 0 ) return <Typography variant="body2" color="text.secondary">No build jobs.</Typography>;

  if ( showProject )
  {
    return (
      <Box>
        { detailDialog }
        { confirmDialog }
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Manual</TableCell>
              <TableCell>Succeeded</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { items.map( ( item ) => (
              <TableRow key={ item.id.toString() }>
                <TableCell>{ item.project?.name }</TableCell>
                <TableCell>{ item.target }</TableCell>
                <TableCell><Chip label={ item.state } color={ jobStateColor( item.state ?? '' ) } size="small" /></TableCell>
                <TableCell>{ item.manual ? 'Yes' : 'No' }</TableCell>
                <TableCell>{ item.succeeded ? 'Yes' : 'No' }</TableCell>
                <TableCell>{ dateStr( item.created ) }</TableCell>
                <TableCell>{ dateStr( item.updated ) }</TableCell>
                <TableCell>{ renderActions( item ) }</TableCell>
              </TableRow>
            ) ) }
          </TableBody>
        </Table>
      </Box>
    );
  }

  return (
    <Box>
      { detailDialog }
      { confirmDialog }
      { items.map( ( item ) =>
      {
        const key = item.id.toString();
        const isExpanded = !!expanded[key];
        return (
          <Box key={ key } sx={{ mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, cursor: 'pointer' }} onClick={ () => toggleExpand( key ) }>
              <Chip label={ item.state } color={ jobStateColor( item.state ?? '' ) } size="small" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ mr: 1 }}>{ item.target }</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>user: { item.user }</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>build #{ item.id }</Typography>
              <Typography variant="body2" color="text.secondary">succeeded: { item.succeeded ? 'yes' : 'no' }</Typography>
              <Box sx={{ flexGrow: 1 }} />
              { renderActions( item ) }
              <IconButton size="small" sx={{ ml: 1 }}>{ isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> }</IconButton>
            </Box>
            <Collapse in={ isExpanded }>
              <Box sx={{ px: 2, pb: 1 }}>
                { Object.entries( item.instance_summary || {} ).map( ( [resType, instances] ) =>
                  ( instances as any[] ).map( ( inst ) => (
                    <Box key={ inst.id } sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Chip label={ inst.success ? 'ok' : 'fail' } color={ inst.success ? 'success' : 'error' } size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ mr: 1 }}>{ resType }</Typography>
                      <Chip label={ inst.state } size="small" variant="outlined" sx={{ mr: 1 }} />
                      { inst.message && <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>{ inst.message }</Typography> }
                      { inst.score ? <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>score: { inst.score }</Typography> : null }
                      <Button size="small" variant="outlined" onClick={ () => handleDetail( inst.id ) }>Detail</Button>
                    </Box>
                  ) )
                ) }
              </Box>
            </Collapse>
          </Box>
        );
      } ) }
    </Box>
  );
};

export default BuildJobList;
