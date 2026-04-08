import React from 'react';
import { connect } from 'react-redux';
import { Alert, Box, Chip, CircularProgress, Link, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SyncIcon from '@mui/icons-material/Sync';
import { Link as RouterLink } from 'react-router-dom';
import { fetchProjectList, fetchProject } from '../store/projectsSlice';
import type { RootState, AppDispatch } from '../store';
import { Project_Project } from '../lib/MCP';
import { friendlyDate } from '../lib/utils';
import CommitList from './CommitList';
import BuildJobList from './BuildJobList';
import QueueItemList from './QueueItemList';
import BuildList from './BuildList';

interface ProjectStatus { test: string; build: string; at: string; built: boolean }

interface OwnProps {
  id?: string;
}

interface StateProps {
  list: Project_Project[] | null;
  detail: Project_Project | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

type Props = OwnProps & StateProps & { dispatch: AppDispatch };

interface LocalState {
  tab: number;
}

class Project extends React.Component<Props, LocalState>
{
  state: LocalState = { tab: 0 };

  componentDidMount()
  {
    this.update( this.props );
  }

  componentDidUpdate( prevProps: Props )
  {
    if ( prevProps.id !== this.props.id ||
         ( !prevProps.authenticated && this.props.authenticated ) ||
         ( prevProps.list !== null && this.props.list === null ) ||
         ( prevProps.detail !== null && this.props.detail === null ) )
    {
      this.update( this.props );
    }
  }

  update( props: Props )
  {
    if ( props.id !== undefined )
    {
      props.dispatch( fetchProject( decodeURIComponent( props.id ) ) );
    }
    else
    {
      props.dispatch( fetchProjectList() );
    }
  }

  projectStatus( item: Project_Project ): ProjectStatus | undefined
  {
    return item.status as ProjectStatus | undefined;
  }

  projectStatusIcon( item: Project_Project )
  {
    if ( item.busy ) return <SyncIcon fontSize="small" sx={{ color: 'info.main', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />;
    const st = this.projectStatus( item );
    const testOk = st?.test === 'Success';
    const buildOk = st?.build === 'Success';
    if ( testOk && buildOk ) return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
    if ( testOk || buildOk ) return <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />;
    return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
  }

  gitTypeLabel( type: string | undefined )
  {
    if ( type === 'GitHubProject' ) return 'GitHub';
    if ( type === 'GitLabProject' ) return 'GitLab';
    return 'Git';
  }

  render()
  {
    if ( this.props.loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if ( this.props.error ) return <Alert severity="error">{ this.props.error }</Alert>;

    if ( this.props.id !== undefined )
    {
      return this.renderDetail();
    }
    return this.renderList();
  }

  renderList()
  {
    const list = ( this.props.list || [] ).filter( ( p ) => p.name !== '_builtin_' );
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Projects</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Release Branch</TableCell>
              <TableCell>Last Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { [ ...list ].sort( ( a, b ) =>
            {
              const at_a = ( a.status as ProjectStatus | undefined )?.at ?? 0;
              const at_b = ( b.status as ProjectStatus | undefined )?.at ?? 0;
              return new Date( at_b ).getTime() - new Date( at_a ).getTime();
            } ).map( ( item ) => (
              <TableRow key={ item.name }>
                <TableCell>{ this.projectStatusIcon( item ) }</TableCell>
                <TableCell>
                  <Link component={ RouterLink } to={ `/project/${ encodeURIComponent( item.name ) }` }>{ item.name }</Link>
                </TableCell>
                <TableCell>{ this.gitTypeLabel( item.type ) }</TableCell>
                <TableCell>{ item.release_branch }</TableCell>
                <TableCell>{ this.projectStatus( item )?.at ? friendlyDate( this.projectStatus( item )!.at ) : '' }</TableCell>
              </TableRow>
            ) ) }
          </TableBody>
        </Table>
      </Box>
    );
  }

  renderDetail()
  {
    const project = this.props.detail;
    const projectName = this.props.id ? decodeURIComponent( this.props.id ) : undefined;
    const st = project ? this.projectStatus( project ) : undefined;

    return (
      <Box>
        <Link component={ RouterLink } to="/projects">&larr; Projects</Link>
        { project &&
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
              <Typography variant="h5" sx={{ mr: 2 }}>{ project.name }</Typography>
              { this.projectStatusIcon( project ) }
              { st &&
                <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
                  <Chip label={ `test: ${ st.test }` } color={ st.test === 'Success' ? 'success' : 'error' } size="small" />
                  <Chip label={ `build: ${ st.build }` } color={ st.build === 'Success' ? 'success' : 'error' } size="small" />
                </Box>
              }
            </Box>
            <Tabs value={ this.state.tab } onChange={ ( _, v ) => this.setState( { tab: v } ) } sx={{ mb: 2 }}>
              <Tab label="Latest Commit" />
              <Tab label="Commit History" />
              <Tab label="Build Jobs" />
              <Tab label="Queue" />
              <Tab label="Builds" />
            </Tabs>
            { this.state.tab === 0 && <CommitList projectUri={ projectName } showLatestOnly /> }
            { this.state.tab === 1 && <CommitList projectUri={ projectName } /> }
            { this.state.tab === 2 && <BuildJobList projectName={ projectName } /> }
            { this.state.tab === 3 && <QueueItemList projectName={ projectName } /> }
            { this.state.tab === 4 && <BuildList projectName={ projectName } /> }
          </Box>
        }
      </Box>
    );
  }
}

const mapStateToProps = ( state: RootState ) => ( {
  list: state.projects.list,
  detail: state.projects.detail,
  authenticated: state.app.authenticated,
  loading: state.projects.loading,
  error: state.projects.error,
} );

export default connect( mapStateToProps )( Project );
