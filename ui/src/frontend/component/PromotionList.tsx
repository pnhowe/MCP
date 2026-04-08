import React from 'react';
import { connect } from 'react-redux';
import { Alert, Box, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { fetchPromotionList, invalidatePromotions } from '../store/promotionsSlice';
import type { PromotionItem } from '../store/promotionsSlice';
import type { RootState, AppDispatch } from '../store';
import { dateStr } from '../lib/utils';

interface StateProps {
  list: PromotionItem[] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

type Props = StateProps & { dispatch: AppDispatch };

class PromotionList extends React.Component<Props>
{
  componentDidMount()
  {
    this.update( this.props );
  }

  componentDidUpdate( prevProps: Props )
  {
    if ( ( !prevProps.authenticated && this.props.authenticated ) ||
         ( prevProps.list !== null && this.props.list === null ) )
    {
      this.update( this.props );
    }
  }

  update( props: Props )
  {
    props.dispatch( invalidatePromotions() );
    props.dispatch( fetchPromotionList() );
  }

  render()
  {
    if ( this.props.loading ) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={ 24 } /></Box>;
    if ( this.props.error ) return <Alert severity="error">{ this.props.error }</Alert>;

    const list = this.props.list || [];

    if ( list.length === 0 ) return <Typography variant="body2" color="text.secondary">No promotions in process.</Typography>;

    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>Result Map</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          { list.map( ( item ) => (
            <TableRow key={ item.uri }>
              <TableCell>{ item.tag }</TableCell>
              <TableCell>{ JSON.stringify( item.result_map ) }</TableCell>
              <TableCell>{ dateStr( item.created ) }</TableCell>
            </TableRow>
          ) ) }
        </TableBody>
      </Table>
    );
  }
}

const mapStateToProps = ( state: RootState ) => ( {
  list: state.promotions.list,
  authenticated: state.app.authenticated,
  loading: state.promotions.loading,
  error: state.promotions.error,
} );

export default connect( mapStateToProps )( PromotionList );
