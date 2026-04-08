import { createAuthThunk, createDetailListSlice } from './sliceFactory';
import { Project_Build, Project_Project } from '../lib/MCP';

export const fetchBuildList = createAuthThunk( 'builds/fetchList', async ( projectName: string | void, mcp ) =>
{
  if ( !projectName ) return [] as Project_Build[];
  const filter = new Project_Build._ListFilter_project( new Project_Project( mcp, projectName ) );
  const result = await mcp.Project_Build_get_multi( { filter } );
  return Object.values( result );
} );

export const fetchBuild = createAuthThunk( 'builds/fetchOne', async ( key: string, mcp ) =>
{
  return mcp.Project_Build_get( key );
} );

const buildsSlice = createDetailListSlice( {
  name: 'builds',
  fetchList: fetchBuildList,
  fetchOne: fetchBuild,
} );

export const { invalidate: invalidateBuilds } = buildsSlice.actions;
export default buildsSlice.reducer;
