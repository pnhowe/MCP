import { createAuthThunk, createDetailListSlice } from './sliceFactory';
import { Processor_BuildJob, Project_Project } from '../lib/MCP';

export const fetchBuildJobList = createAuthThunk( 'buildJobs/fetchList', async ( projectName: string | void, mcp ) =>
{
  let filter;
  if ( projectName )
  {
    filter = new Processor_BuildJob._ListFilter_project( new Project_Project( mcp, projectName ) );
  }
  const result = await mcp.Processor_BuildJob_get_multi( { filter } );
  return Object.values( result );
} );

export const fetchBuildJob = createAuthThunk( 'buildJobs/fetchOne', async ( id: string, mcp ) =>
{
  return mcp.Processor_BuildJob_get( parseInt( id ) );
} );

const buildJobsSlice = createDetailListSlice( {
  name: 'buildJobs',
  fetchList: fetchBuildJobList,
  fetchOne: fetchBuildJob,
} );

export const { invalidate: invalidateBuildJobs } = buildJobsSlice.actions;
export default buildJobsSlice.reducer;
