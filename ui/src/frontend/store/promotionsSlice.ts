import { createAuthThunk, createDetailListSlice } from './sliceFactory';
import { Processor_Promotion } from '../lib/MCP';

export const fetchPromotionList = createAuthThunk( 'promotions/fetchList', async ( _: void, mcp ) =>
{
  const result = await mcp.Processor_Promotion_get_multi( { filter: new Processor_Promotion._ListFilter_in_process() } );
  return Object.values( result );
} );

export const fetchPromotion = createAuthThunk( 'promotions/fetchOne', async ( id: string, mcp ) =>
{
  return mcp.Processor_Promotion_get( parseInt( id ) );
} );

const promotionsSlice = createDetailListSlice( {
  name: 'promotions',
  fetchList: fetchPromotionList,
  fetchOne: fetchPromotion,
} );

export const { invalidate: invalidatePromotions } = promotionsSlice.actions;
export default promotionsSlice.reducer;
