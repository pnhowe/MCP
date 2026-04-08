import { createAuthThunk, createDetailListSlice } from './sliceFactory';
import { Project_Project } from '../lib/MCP';

export const fetchProjectList = createAuthThunk( 'projects/fetchList', async ( _: void, mcp ) =>
{
  const result = await mcp.Project_Project_get_multi( { filter: new Project_Project._ListFilter_my_projects() } );
  return Object.values( result );
} );

export const fetchProject = createAuthThunk( 'projects/fetchOne', async ( name: string, mcp ) =>
{
  return mcp.Project_Project_get( name );
} );

const projectsSlice = createDetailListSlice( {
  name: 'projects',
  fetchList: fetchProjectList,
  fetchOne: fetchProject,
} );

export const { invalidate: invalidateProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
