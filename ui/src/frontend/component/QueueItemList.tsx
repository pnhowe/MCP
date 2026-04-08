import React from 'react';
import { connect } from 'react-redux';
import { Alert, Box, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { fetchQueueItemList, invalidateQueueItems } from '../store/queueItemsSlice';
import { Processor_QueueItem } from '../lib/MCP';
import type { RootState, AppDispatch } from '../store';
import { dateStr } from '../lib/utils';

interface OwnProps {
  projectName?: string;
}

interface StateProps {
  list: Processor_QueueItem[] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

type Props = OwnProps & StateProps & { dispatch: AppDispatch };

class QueueItemList extends React.Component<Props>
{
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
    props.dispatch( invalidateQueueItems() );
    props.dispatch( fetchQueueItemList( props.projectName ) );
  }

  render()
  {
    if ( this.props.loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
    if ( this.props.error ) return <Alert severity="error">{ this.props.error }</Alert>;

    const list = this.props.list || [];

    if ( list.length === 0 ) return <Typography variant="body2" color="text.secondary">No queued items.</Typography>;

    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            { this.props.projectName === undefined && <TableCell>Project</TableCell> }
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
          { list.map( ( item ) => (
            <TableRow key={ item.id.toString() }>
              { this.props.projectName === undefined && <TableCell>{ item.project?.name }</TableCell> }
              <TableCell>{ item.priority }</TableCell>
              <TableCell>{ item.build?.key }</TableCell>
              <TableCell>{ item.branch }</TableCell>
              <TableCell>{ item.target }</TableCell>
              <TableCell>{ item.manual ? 'Yes' : 'No' }</TableCell>
              <TableCell>{ dateStr( item.created ) }</TableCell>
              <TableCell>{ dateStr( item.updated ) }</TableCell>
            </TableRow>
          ) ) }
        </TableBody>
      </Table>
    );
  }
}

const mapStateToProps = ( state: RootState ) => ( {
  list: state.queueItems.list,
  authenticated: state.app.authenticated,
  loading: state.queueItems.loading,
  error: state.queueItems.error,
} );

export default connect( mapStateToProps )( QueueItemList );
