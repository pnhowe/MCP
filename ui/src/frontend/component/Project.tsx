import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ErrorPanel from './ErrorPanel';
import { Box, Chip, CircularProgress, Link, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import WarningIcon from '@mui/icons-material/Warning';
import SyncIcon from '@mui/icons-material/Sync';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { fetchProjectList, fetchProject } from '../store/projectsSlice';
import type { RootState, AppDispatch } from '../store';
import { Project_Project } from '../lib/MCP';
import { friendlyDate } from '../lib/utils';
import CommitList from './CommitList';
import BuildJobList from './BuildJobList';
import QueueItemList from './QueueItemList';
import BuildList from './BuildList';

interface ProjectStatus { test: string; build: string; at: string; built: boolean }

interface Props {
  id?: string;
}

const projectStatus = ( item: Project_Project ): ProjectStatus | undefined =>
  item.status as ProjectStatus | undefined;

const projectStatusIcon = ( item: Project_Project ) =>
{
  if ( item.busy ) return <SyncIcon fontSize="small" sx={{ color: 'info.main', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />;
  const st = projectStatus( item );
  if ( !st ) return <HelpIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
  const testOk = st.test === 'Success';
  const buildOk = st.build === 'Success';
  if ( testOk && buildOk ) return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
  if ( testOk || buildOk ) return <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />;
  return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
};

const gitTypeLabel = ( type: string | undefined ) =>
{
  if ( type === 'GitHubProject' ) return 'GitHub';
  if ( type === 'GitLabProject' ) return 'GitLab';
  return 'Git';
};

const Project: React.FC<Props> = ( { id } ) =>
{
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = useSelector( ( s: RootState ) => s.app.authenticated );
  const { list, detail, loading, error } = useSelector( ( s: RootState ) => s.projects );

  const tabParam = new URLSearchParams( location.search ).get( 'tab' );
  const [tab, setTab] = useState( tabParam !== null ? parseInt( tabParam, 10 ) : 0 );

  useEffect( () =>
  {
    const t = new URLSearchParams( location.search ).get( 'tab' );
    setTab( t !== null ? parseInt( t, 10 ) : 0 );
  }, [location.search] );

  const fetchData = useCallback( () =>
  {
    if ( !authenticated ) return;
    if ( id !== undefined )
      dispatch( fetchProject( decodeURIComponent( id ) ) );
    else
      dispatch( fetchProjectList() );
  }, [authenticated, dispatch, id] );

  useEffect( () => { fetchData(); }, [fetchData] );

  if ( loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if ( error ) return <ErrorPanel error={ error } onRetry={ fetchData } />;

  if ( id !== undefined )
  {
    const project = detail;
    const projectName = decodeURIComponent( id );
    const st = project ? projectStatus( project ) : undefined;

    return (
      <Box>
        <Link component={ RouterLink } to="/projects">&larr; Projects</Link>
        { project &&
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
              <Typography variant="h5" sx={{ mr: 2 }}>{ project.name }</Typography>
              { projectStatusIcon( project ) }
              { st &&
                <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
                  <Chip label={ `test: ${ st.test }` } color={ st.test === 'Success' ? 'success' : 'error' } size="small" />
                  <Chip label={ `build: ${ st.build }` } color={ st.build === 'Success' ? 'success' : 'error' } size="small" />
                </Box>
              }
            </Box>
            <Tabs value={ tab } onChange={ ( _, v ) => { navigate( { search: `?tab=${ v }` } ); } } sx={{ mb: 2 }}>
              <Tab label="Latest Commit" />
              <Tab label="Commit History" />
              <Tab label="Build Jobs" />
              <Tab label="Queue" />
              <Tab label="Builds" />
            </Tabs>
            { tab === 0 && <CommitList projectUri={ projectName } showLatestOnly /> }
            { tab === 1 && <CommitList projectUri={ projectName } /> }
            { tab === 2 && <BuildJobList projectName={ projectName } /> }
            { tab === 3 && <QueueItemList projectName={ projectName } /> }
            { tab === 4 && <BuildList projectName={ projectName } /> }
          </Box>
        }
      </Box>
    );
  }

  const items = ( list || [] ).filter( ( p ) => p.name !== '_builtin_' );
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
          { [ ...items ].sort( ( a, b ) =>
          {
            const at_a = ( a.status as ProjectStatus | undefined )?.at ?? 0;
            const at_b = ( b.status as ProjectStatus | undefined )?.at ?? 0;
            return new Date( at_b ).getTime() - new Date( at_a ).getTime();
          } ).map( ( item ) => (
            <TableRow key={ item.name }>
              <TableCell>{ projectStatusIcon( item ) }</TableCell>
              <TableCell>
                <Link component={ RouterLink } to={ `/project/${ encodeURIComponent( item.name ) }` }>{ item.name }</Link>
              </TableCell>
              <TableCell>{ gitTypeLabel( item.type ) }</TableCell>
              <TableCell>{ item.release_branch }</TableCell>
              <TableCell>{ projectStatus( item )?.at ? friendlyDate( projectStatus( item )!.at ) : '' }</TableCell>
            </TableRow>
          ) ) }
        </TableBody>
      </Table>
    </Box>
  );
};

export default Project;
