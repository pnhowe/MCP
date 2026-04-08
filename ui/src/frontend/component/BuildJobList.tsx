import React from 'react';
import { connect } from 'react-redux';
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Dialog, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchBuildJobList, invalidateBuildJobs } from '../store/buildJobsSlice';
import { Processor_BuildJob } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { mcp } from '../store';
import { dateStr } from '../lib/utils';

interface OwnProps {
  projectName?: string;
  showProject?: boolean;
}

interface StateProps {
  list: Processor_BuildJob[] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

type Props = OwnProps & StateProps & { dispatch: AppDispatch };

interface LocalState {
  expanded: Record<string, boolean>;
  detailOpen: boolean;
  detailContent: string;
}

class BuildJobList extends React.Component<Props, LocalState>
{
  state: LocalState = { expanded: {}, detailOpen: false, detailContent: '' };

  componentDidMount()
  {
    this.update( this.props );
  }

  componentDidUpdate( prevProps: Props )
  {
    if ( prevProps.projectName !== this.props.projectName ||
         ( !prevProps.authenticated && this.props.authenticated ) ||
         ( prevProps.list !== null && this.props.list === null ) )
    {
      this.update( this.props );
    }
  }

  update( props: Props )
  {
    props.dispatch( invalidateBuildJobs() );
    props.dispatch( fetchBuildJobList( props.projectName ) );
  }

  toggleExpand( key: string )
  {
    this.setState( ( s ) => ( { expanded: { ...s.expanded, [key]: !s.expanded[key] } } ) );
  }

  async handleAcknowledge( id: number )
  {
    if ( !confirm( 'Acknowledge this job?' ) ) return;
    await mcp.Processor_BuildJob_call_acknowledge( id );
    alert( 'Acknowledged.' );
    this.update( this.props );
  }

  async handleJobRan( id: number )
  {
    if ( !confirm( 'Force mark this job as ran?' ) ) return;
    await mcp.Processor_BuildJob_call_jobRan( id );
    alert( 'Marked as ran.' );
    this.update( this.props );
  }

  async handleDetail( instanceId: number )
  {
    const result = await mcp.Processor_BuildJobResourceInstance_call_getHostDetail( instanceId );
    this.setState( { detailOpen: true, detailContent: JSON.stringify( result, null, 2 ) } );
  }

  stateColor( state: string ): 'default' | 'info' | 'success' | 'error' | 'warning'
  {
    if ( state === 'reported' ) return 'warning';
    if ( state === 'build' ) return 'info';
    if ( state === 'error' ) return 'error';
    return 'default';
  }

  render()
  {
    if ( this.props.loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
    if ( this.props.error ) return <Alert severity="error">{ this.props.error }</Alert>;

    const list = this.props.list || [];

    if ( list.length === 0 ) return <Typography variant="body2" color="text.secondary">No build jobs.</Typography>;

    if ( this.props.showProject )
    {
      return (
        <Box>
          { this.renderDetailDialog() }
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
              { list.map( ( item ) => (
                <TableRow key={ item.id.toString() }>
                  <TableCell>{ item.project?.name }</TableCell>
                  <TableCell>{ item.target }</TableCell>
                  <TableCell><Chip label={ item.state } color={ this.stateColor( item.state ?? '' ) } size="small" /></TableCell>
                  <TableCell>{ item.manual ? 'Yes' : 'No' }</TableCell>
                  <TableCell>{ item.succeeded ? 'Yes' : 'No' }</TableCell>
                  <TableCell>{ dateStr( item.created ) }</TableCell>
                  <TableCell>{ dateStr( item.updated ) }</TableCell>
                  <TableCell>{ this.renderActions( item ) }</TableCell>
                </TableRow>
              ) ) }
            </TableBody>
          </Table>
        </Box>
      );
    }

    return (
      <Box>
        { this.renderDetailDialog() }
        { list.map( ( item ) =>
        {
          const key = item.id.toString();
          const expanded = !!this.state.expanded[key];
          return (
            <Box key={ key } sx={{ mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1, cursor: 'pointer' }} onClick={ () => this.toggleExpand( key ) }>
                <Chip label={ item.state } color={ this.stateColor( item.state ?? '' ) } size="small" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>{ item.target }</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>user: { item.user }</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>build #{ item.id }</Typography>
                <Typography variant="body2" color="text.secondary">succeeded: { item.succeeded ? 'yes' : 'no' }</Typography>
                <Box sx={{ flexGrow: 1 }} />
                { this.renderActions( item ) }
                <IconButton size="small" sx={{ ml: 1 }}>{ expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> }</IconButton>
              </Box>
              <Collapse in={ expanded }>
                <Box sx={{ px: 2, pb: 1 }}>
                  { Object.entries( item.instance_summary || {} ).map( ( [resType, instances] ) =>
                    ( instances as any[] ).map( ( inst ) => (
                      <Box key={ inst.id } sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Chip label={ inst.success ? 'ok' : 'fail' } color={ inst.success ? 'success' : 'error' } size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ mr: 1 }}>{ resType }</Typography>
                        <Chip label={ inst.state } size="small" variant="outlined" sx={{ mr: 1 }} />
                        { inst.message && <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>{ inst.message }</Typography> }
                        { inst.score ? <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>score: { inst.score }</Typography> : null }
                        <Button size="small" variant="outlined" onClick={ () => this.handleDetail( inst.id ) }>Detail</Button>
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
  }

  renderActions( item: Processor_BuildJob )
  {
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        { item.state === 'reported' && ( item.manual || !item.succeeded ) &&
          <Button size="small" variant="contained" onClick={ ( e ) => { e.stopPropagation(); this.handleAcknowledge( item.id ); } }>Acknowledge</Button>
        }
        { item.state === 'build' && ( item.manual || !item.succeeded ) &&
          <Button size="small" variant="contained" color="error" onClick={ ( e ) => { e.stopPropagation(); this.handleJobRan( item.id ); } }>Force Ran</Button>
        }
      </Box>
    );
  }

  renderDetailDialog()
  {
    return (
      <Dialog open={ this.state.detailOpen } onClose={ () => this.setState( { detailOpen: false } ) } maxWidth="md" fullWidth>
        <DialogTitle>Resource Detail</DialogTitle>
        <DialogContent>
          <Box component="pre" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            { this.state.detailContent }
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
}

const mapStateToProps = ( state: RootState ) => ( {
  list: state.buildJobs.list,
  authenticated: state.app.authenticated,
  loading: state.buildJobs.loading,
  error: state.buildJobs.error,
} );

export default connect( mapStateToProps )( BuildJobList );
