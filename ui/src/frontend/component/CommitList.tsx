import React from 'react';
import { connect } from 'react-redux';
import { Alert, Box, Chip, CircularProgress, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchCommitList, invalidateCommits } from '../store/commitsSlice';
import type { CommitItem } from '../store/commitsSlice';
import type { RootState, AppDispatch } from '../store';
import { dateStr } from '../lib/utils';

interface OwnProps {
  projectUri?: string;
  showLatestOnly?: boolean;
}

interface StateProps {
  list: CommitItem[] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

type Props = OwnProps & StateProps & { dispatch: AppDispatch };

interface LocalState {
  expanded: Record<string, boolean>;
}

class CommitList extends React.Component<Props, LocalState>
{
  state: LocalState = { expanded: {} };

  componentDidMount()
  {
    this.update( this.props );
  }

  componentDidUpdate( prevProps: Props )
  {
    if ( prevProps.projectUri !== this.props.projectUri ||
         ( !prevProps.authenticated && this.props.authenticated ) ||
         ( prevProps.list !== null && this.props.list === null ) )
    {
      this.update( this.props );
    }
  }

  update( props: Props )
  {
    props.dispatch( invalidateCommits() );
    props.dispatch( fetchCommitList( props.projectUri ) );
  }

  toggleExpand( key: string )
  {
    this.setState( ( s ) => ( { expanded: { ...s.expanded, [key]: !s.expanded[key] } } ) );
  }

  statusColor( status: string ): 'success' | 'error' | 'warning' | 'default'
  {
    if ( status === 'Success' ) return 'success';
    if ( status === 'Failed' ) return 'error';
    return 'warning';
  }

  render()
  {
    if ( this.props.loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
    if ( this.props.error ) return <Alert severity="error">{ this.props.error }</Alert>;

    let list = this.props.list || [];

    if ( list.length === 0 ) return <Typography variant="body2" color="text.secondary">No commits.</Typography>;

    list = [ ...list ].sort( ( a, b ) => new Date( b.updated ).getTime() - new Date( a.updated ).getTime() );
    if ( this.props.showLatestOnly ) list = list.slice( 0, 1 );

    return (
      <Box>
        { list.map( ( item ) =>
        {
          const expanded = !!this.state.expanded[item.commit];
          const status = item.summary?.status ?? 'unknown';
          return (
            <Box key={ item.commit } sx={{ mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1, cursor: 'pointer' }} onClick={ () => this.toggleExpand( item.commit ) }>
                <Chip label={ status } color={ this.statusColor( status ) } size="small" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>{ item.commit }</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>{ item.branch }</Typography>
                { item.version && <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>v{ item.version }</Typography> }
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>{ dateStr( item.updated ) }</Typography>
                <IconButton size="small">{ expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> }</IconButton>
              </Box>
              <Collapse in={ expanded }>
                <Box sx={{ px: 2, pb: 1 }}>
                  { this.renderResults( 'Lint', item.lint_results, item.lint_at ) }
                  { this.renderResults( 'Test', item.test_results, item.test_at ) }
                  { this.renderBuildResults( item.build_results, item.build_at ) }
                </Box>
              </Collapse>
            </Box>
          );
        } ) }
      </Box>
    );
  }

  renderResults( label: string, results: Record<string, { results: string; success: boolean }> | undefined, at: string )
  {
    if ( !results || Object.keys( results ).length === 0 ) return null;
    return (
      <Box sx={{ mb: 1 }}>
        { Object.entries( results ).map( ( [key, val] ) => val.results ? (
          <Box key={ key }>
            <Typography variant="caption" color={ val.success ? 'success.main' : 'error.main' }>
              <strong>{ label }: { key } { val.success ? 'passed' : 'failed' }</strong>
              { at ? ` — ${ new Date( at ).toLocaleString() }` : '' }
            </Typography>
            <Box component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', mt: 0.5, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
              { val.results }
            </Box>
          </Box>
        ) : null ) }
      </Box>
    );
  }

  renderBuildResults( results: Record<string, Record<string, { results: string; success: boolean }>> | undefined, at: string )
  {
    if ( !results || Object.keys( results ).length === 0 ) return null;
    return (
      <Box sx={{ mb: 1 }}>
        { Object.entries( results ).map( ( [target, subMap] ) =>
          Object.entries( subMap ).map( ( [key, val] ) => val.results ? (
            <Box key={ `${ target }-${ key }` }>
              <Typography variant="caption" color={ val.success ? 'success.main' : 'error.main' }>
                <strong>Build: { key }::{ target } { val.success ? 'succeeded' : 'failed' }</strong>
                { at ? ` — ${ new Date( at ).toLocaleString() }` : '' }
              </Typography>
              <Box component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', mt: 0.5, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                { val.results }
              </Box>
            </Box>
          ) : null )
        ) }
      </Box>
    );
  }
}

const mapStateToProps = ( state: RootState ) => ( {
  list: state.commits.list,
  authenticated: state.app.authenticated,
  loading: state.commits.loading,
  error: state.commits.error,
} );

export default connect( mapStateToProps )( CommitList );
