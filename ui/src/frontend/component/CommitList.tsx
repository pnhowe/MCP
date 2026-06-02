import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ErrorPanel from './ErrorPanel';
import { Box, Chip, CircularProgress, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchCommitList } from '../store/commitsSlice';
import type { Project_Commit } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { dateStr } from '../lib/utils';

interface Props {
  projectUri?: string;
  showLatestOnly?: boolean;
}

const statusColor = ( status: string ): 'success' | 'error' | 'warning' | 'default' =>
{
  if ( status === 'Success' ) return 'success';
  if ( status === 'Failed' ) return 'error';
  return 'warning';
};

const statusIcon = ( status: string | undefined ) =>
{
  if ( status === 'Success' ) return <Box component="span" sx={{ color: 'success.main' }}>✓</Box>;
  if ( status === 'Failed' ) return <Box component="span" sx={{ color: 'error.main' }}>✗</Box>;
  return <Box component="span" sx={{ color: 'text.disabled' }}>○</Box>;
};

type Summary = { status?: string; lint?: { status?: string; score?: number | null }; test?: { status?: string; score?: number | null }; build?: { status?: string }; doc?: { status?: string } };

const renderSummary = ( summary: Summary | undefined ) =>
{
  if ( !summary ) return null;
  const sections = ( ['lint', 'test', 'build', 'doc'] as const ).flatMap( ( key ) =>
  {
    const s = summary[key];
    if ( !s ) return [];
    return [ { key, status: s.status, score: 'score' in s ? s.score : null } ];
  } );
  if ( sections.length === 0 ) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
      { sections.map( ( { key, status, score } ) => (
        <Typography key={ key } variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span">{ key }{ score != null ? ` (${ score })` : '' }:</Box>
          { statusIcon( status ) }
        </Typography>
      ) ) }
    </Box>
  );
};

const renderLintTest = ( lint_results: Record<string, { results: string; success: boolean }> | undefined, test_results: Record<string, { results: string; success: boolean }> | undefined, at: Date | undefined ) =>
{
  if ( ( !lint_results || Object.keys( lint_results ).length === 0 ) && ( !test_results || Object.keys( test_results ).length === 0 ) ) return null;
  return (
    <Box sx={{ mb: 1 }}>
      { Object.entries( lint_results || {} ).map( ( [key, val] ) => (
        <Box key={ key }>
          { val.results
            ? <>
                <Typography variant="caption" color={ val.success ? 'success.main' : 'error.main' }>
                  <strong>Lint: { key } { val.success ? 'passed' : 'failed' }</strong>
                  { at ? ` — ${ new Date( at ).toLocaleString() }` : '' }
                </Typography>
                <Box component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', mt: 0.5, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  { val.results }
                </Box>
              </>
            : <Typography variant="caption" color="text.secondary"><strong>Lint: { key }</strong> — Pending</Typography>
          }
        </Box>
      ) ) }
      { Object.entries( test_results || {} ).map( ( [key, val] ) => (
        <Box key={ key }>
          { val.results
            ? <>
                <Typography variant="caption" color={ val.success ? 'success.main' : 'error.main' }>
                  <strong>Test: { key } { val.success ? 'passed' : 'failed' }</strong>
                  { at ? ` — ${ new Date( at ).toLocaleString() }` : '' }
                </Typography>
                <Box component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', mt: 0.5, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  { val.results }
                </Box>
              </>
            : <Typography variant="caption" color="text.secondary"><strong>Test: { key }</strong> — Pending</Typography>
          }
        </Box>
      ) ) }
    </Box>
  );
};

const renderBuildResults = ( results: Record<string, Record<string, { results: string; success: boolean }>> | undefined, at: Date | undefined ) =>
{
  if ( !results || Object.keys( results ).length === 0 ) return null;
  return (
    <Box sx={{ mb: 1 }}>
      { Object.entries( results ).map( ( [target, subMap] ) =>
        Object.entries( subMap ).map( ( [key, val] ) => (
          <Box key={ `${ target }-${ key }` }>
            { val.results
              ? <>
                  <Typography variant="caption" color={ val.success ? 'success.main' : 'error.main' }>
                    <strong>Build: { key }::{ target } { val.success ? 'succeeded' : 'failed' }</strong>
                    { at ? ` — ${ new Date( at ).toLocaleString() }` : '' }
                  </Typography>
                  <Box component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', mt: 0.5, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    { val.results }
                  </Box>
                </>
              : <Typography variant="caption" color="text.secondary"><strong>Build: { key }::{ target }</strong> — Pending</Typography>
            }
          </Box>
        ) )
      ) }
    </Box>
  );
};

const CommitList: React.FC<Props> = ( { projectUri, showLatestOnly } ) =>
{
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector( ( s: RootState ) => s.app.authenticated );
  const { list, loading, error } = useSelector( ( s: RootState ) => s.commits );
  const [expanded, setExpanded] = useState<Record<string, boolean>>( {} );

  const fetchData = useCallback( () =>
  {
    if ( !authenticated ) return;
    dispatch( fetchCommitList( projectUri ) );
  }, [authenticated, dispatch, projectUri] );

  useEffect( () => { fetchData(); }, [fetchData] );

  const toggleExpand = ( key: string ) =>
    setExpanded( ( e ) => ( { ...e, [key]: !e[key] } ) );

  if ( loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
  if ( error ) return <ErrorPanel error={ error } onRetry={ fetchData } />;

  let items: Project_Commit[] = list || [];

  if ( items.length === 0 ) return <Typography variant="body2" color="text.secondary">No commits.</Typography>;

  items = [ ...items ].sort( ( a, b ) => ( a.updated ? new Date( a.updated ).getTime() : 0 ) - ( b.updated ? new Date( b.updated ).getTime() : 0 ) ).reverse();
  if ( showLatestOnly ) items = items.slice( 0, 1 );

  return (
    <Box>
      { items.map( ( item ) =>
      {
        const key = item.commit ?? item.id.toString();
        const isExpanded = !!expanded[key];
        const status = ( item.summary as any )?.status ?? 'unknown';
        return (
          <Box key={ key } sx={{ mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, cursor: 'pointer' }} onClick={ () => toggleExpand( key ) }>
              <Chip label={ status } color={ statusColor( status ) } size="small" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>{ item.commit }</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>{ item.branch }</Typography>
              { item.version && <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>v{ item.version }</Typography> }
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>{ dateStr( item.updated ) }</Typography>
              <IconButton size="small">{ isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> }</IconButton>
            </Box>
            <Collapse in={ isExpanded }>
              <Box sx={{ px: 2, pb: 1 }}>
                { renderSummary( item.summary as Summary ) }
                { renderLintTest( item.lint_results, item.test_results, item.test_at ) }
                { renderBuildResults( item.build_results, item.build_at ) }
              </Box>
            </Collapse>
          </Box>
        );
      } ) }
    </Box>
  );
};

export default CommitList;
