import { createAuthThunk, createDetailListSlice } from './sliceFactory';
import { Processor_QueueItem, Project_Project } from '../lib/MCP';

export const fetchQueueItemList = createAuthThunk( 'queueItems/fetchList', async ( projectName: string | void, mcp ) =>
{
  let filter;
  if ( projectName )
  {
    filter = new Processor_QueueItem._ListFilter_project( new Project_Project( mcp, projectName ) );
  }
  const result = await mcp.Processor_QueueItem_get_multi( { filter } );
  return Object.values( result );
} );

export const fetchQueueItem = createAuthThunk( 'queueItems/fetchOne', async ( id: string, mcp ) =>
{
  return mcp.Processor_QueueItem_get( parseInt( id ) );
} );

const queueItemsSlice = createDetailListSlice( {
  name: 'queueItems',
  fetchList: fetchQueueItemList,
  fetchOne: fetchQueueItem,
} );

export const { invalidate: invalidateQueueItems } = queueItemsSlice.actions;
export default queueItemsSlice.reducer;
