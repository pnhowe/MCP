import React from 'react';
import { connect } from 'react-redux';
import { Alert, Box, Button, CircularProgress, Collapse, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchBuildList, invalidateBuilds } from '../store/buildsSlice';
import { Project_Build } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { mcp } from '../store';

interface OwnProps {
  projectName?: string;
}

interface StateProps {
  list: Project_Build[] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

type Props = OwnProps & StateProps & { dispatch: AppDispatch };

interface LocalState {
  expanded: Record<string, boolean>;
}

class BuildList extends React.Component<Props, LocalState>
{
  state: LocalState = { expanded: {} };

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
    props.dispatch( invalidateBuilds() );
    if ( props.projectName )
    {
      props.dispatch( fetchBuildList( props.projectName ) );
    }
  }

  toggleExpand( key: string )
  {
    this.setState( ( s ) => ( { expanded: { ...s.expanded, [key]: !s.expanded[key] } } ) );
  }

  async handleQueue( item: Project_Build )
  {
    if ( !confirm( `Queue build "${ item.name }"?` ) ) return;
    await mcp.Processor_QueueItem_call_queue( item, item.project?.release_branch ?? 'master', 50 );
    alert( 'Queued.' );
  }

  render()
  {
    if ( this.props.loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
    if ( this.props.error ) return <Alert severity="error">{ this.props.error }</Alert>;

    const list = this.props.list || [];

    if ( list.length === 0 ) return <Typography variant="body2" color="text.secondary">No builds.</Typography>;

    return (
      <Box>
        { list.map( ( item ) =>
        {
          const expanded = !!this.state.expanded[item.key];
          return (
            <Box key={ item.key } sx={{ mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, cursor: 'pointer', flexGrow: 1 }} onClick={ () => this.toggleExpand( item.key ) }>
                  { item.name }
                </Typography>
                <Button size="small" variant="contained" onClick={ () => this.handleQueue( item ) }>
                  Queue Build
                </Button>
                <IconButton size="small" sx={{ ml: 0.5 }} onClick={ () => this.toggleExpand( item.key ) }>
                  { expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> }
                </IconButton>
              </Box>
              <Collapse in={ expanded }>
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
      </Box>
    );
  }
}

const mapStateToProps = ( state: RootState ) => ( {
  list: state.builds.list,
  authenticated: state.app.authenticated,
  loading: state.builds.loading,
  error: state.builds.error,
} );

export default connect( mapStateToProps )( BuildList );
